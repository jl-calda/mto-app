'use server';

// System authoring persistence — a Server Action writing back through the repo.

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { System } from '@/lib/types';

export type SaveSystemResult = { ok: boolean; id: string; error?: string };

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
