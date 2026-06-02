'use server';

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
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
