'use server';

// Take-off persistence — a Server Action writing back through the repository.
// The take-off carries its denormalized VariantSnapshot + computed MTO so the
// project view reflects saved state without re-running the engine.

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { SystemVariantRef, Takeoff, VariantSnapshot } from '@/lib/types';

export type SaveResult = { ok: boolean; savedAt: number; error?: string };
export type CreateResult = { ok: boolean; id: string; error?: string };

function snapshotFor(r: SystemVariantRef): VariantSnapshot {
  return r.kind === 'local'
    ? { source_ref: r, attributes: r.attributes }
    : { source_ref: r, snapshot_version: r.pinned_version, attributes: {} };
}

/** Create a blank take-off for a system (first model + defaults) and persist it. */
export async function createTakeoffAction(projectId: string, systemId: string): Promise<CreateResult> {
  try {
    const repo = getRepo();
    const system = await repo.getSystem(systemId);
    const model = (await repo.listModels(systemId))[0];
    if (!system || !model) return { ok: false, id: '', error: 'system or model not found' };
    const id = `tko-${crypto.randomUUID().slice(0, 8)}`;
    const kind = system.primitive.kind;
    const takeoff: Takeoff = {
      id, name: `New ${system.name} take-off`, system_id: system.id, model_id: model.id,
      variant_choice: snapshotFor(system.variants.rows[0] ?? { kind: 'local', name: 'Standard', attributes: {} }),
      criteria_values: Object.fromEntries(system.criteria.map((c) => [c.library_id, c.default_value ?? ''])),
      modifier_values: {},
      primitive_input: kind === 'length' ? { mode: 'single', total: 0 } : 0,
      property_values: {},
    };
    await repo.saveTakeoff(projectId, takeoff);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, id: '', error: e instanceof Error ? e.message : String(e) };
  }
}

export async function saveTakeoffAction(projectId: string, takeoff: Takeoff): Promise<SaveResult> {
  try {
    await getRepo().saveTakeoff(projectId, takeoff);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
    return { ok: true, savedAt: Date.now() };
  } catch (e) {
    return { ok: false, savedAt: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteTakeoffAction(projectId: string, id: string): Promise<CreateResult> {
  try {
    await getRepo().deleteTakeoff(projectId, id);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
    return { ok: true, id };
  } catch (e) {
    return { ok: false, id, error: e instanceof Error ? e.message : String(e) };
  }
}
