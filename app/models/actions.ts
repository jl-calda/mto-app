'use server';

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import { modelDeleteBlock } from '@/lib/repo/guards';
import type { Model } from '@/lib/types';

export type SaveModelResult = { ok: boolean; id: string; error?: string };

export async function saveModelAction(model: Model): Promise<SaveModelResult> {
  try {
    const saved = await getRepo().saveModel(model);
    revalidatePath(`/models/${saved.id}`);
    revalidatePath(`/systems/${saved.system_id}`);
    return { ok: true, id: saved.id };
  } catch (e) {
    return { ok: false, id: model.id, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteModelAction(id: string, systemId: string): Promise<SaveModelResult> {
  try {
    const repo = getRepo();
    const blocked = modelDeleteBlock(id, await repo.listTakeoffs());
    if (blocked) return { ok: false, id, error: blocked };
    await repo.deleteModel(id);
    revalidatePath(`/systems/${systemId}`);
    revalidatePath(`/models/${id}`);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, id, error: e instanceof Error ? e.message : String(e) };
  }
}
