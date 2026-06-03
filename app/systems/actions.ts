'use server';

// System authoring persistence — a Server Action writing back through the repo.

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import { systemDeleteBlock } from '@/lib/repo/guards';
import type { Attachment, System } from '@/lib/types';

export type SaveSystemResult = { ok: boolean; id: string; error?: string };

/** Persist just the attachments of a system (authored on the system detail page). */
export async function saveSystemAttachmentsAction(systemId: string, attachments: Attachment[]): Promise<SaveSystemResult> {
  try {
    const repo = getRepo();
    const system = await repo.getSystem(systemId);
    if (!system) return { ok: false, id: systemId, error: 'system not found' };
    await repo.saveSystem({ ...system, attachments });
    revalidatePath(`/systems/${systemId}`);
    return { ok: true, id: systemId };
  } catch (e) {
    return { ok: false, id: systemId, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function saveSystemAction(system: System): Promise<SaveSystemResult> {
  try {
    const saved = await getRepo().saveSystem(system);
    revalidatePath('/systems');
    revalidatePath(`/systems/${saved.id}`);
    return { ok: true, id: saved.id };
  } catch (e) {
    return { ok: false, id: system.id, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteSystemAction(id: string): Promise<SaveSystemResult> {
  try {
    const repo = getRepo();
    const system = await repo.getSystem(id);
    if (!system) return { ok: false, id, error: 'system not found' };
    const blocked = systemDeleteBlock(system, await repo.listTakeoffs());
    if (blocked) return { ok: false, id, error: blocked };
    await repo.deleteSystem(id);
    revalidatePath('/systems');
    return { ok: true, id };
  } catch (e) {
    return { ok: false, id, error: e instanceof Error ? e.message : String(e) };
  }
}
