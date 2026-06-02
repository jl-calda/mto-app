'use server';

// Take-off persistence — a Server Action writing back through the repository.
// The take-off carries its denormalized VariantSnapshot + computed MTO so the
// project view reflects saved state without re-running the engine.

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { Takeoff } from '@/lib/types';

export type SaveResult = { ok: boolean; savedAt: number; error?: string };

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
