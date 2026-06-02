'use server';

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { Material } from '@/lib/types';

export type MutateResult = { ok: boolean; id: string; error?: string };

export async function saveMaterialAction(material: Material): Promise<MutateResult> {
  try {
    await getRepo().saveMaterial(material);
    revalidatePath('/materials');
    return { ok: true, id: material.id };
  } catch (e) {
    return { ok: false, id: material.id, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteMaterialAction(id: string): Promise<MutateResult> {
  try {
    await getRepo().deleteMaterial(id);
    revalidatePath('/materials');
    return { ok: true, id };
  } catch (e) {
    return { ok: false, id, error: e instanceof Error ? e.message : String(e) };
  }
}
