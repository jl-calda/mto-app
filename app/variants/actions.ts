'use server';

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { Variant } from '@/lib/types';

export type MutateResult = { ok: boolean; id: string; error?: string };

export async function saveVariantAction(variant: Variant): Promise<MutateResult> {
  try {
    await getRepo().saveVariant(variant);
    revalidatePath('/variants');
    return { ok: true, id: variant.id };
  } catch (e) {
    return { ok: false, id: variant.id, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteVariantAction(id: string): Promise<MutateResult> {
  try {
    await getRepo().deleteVariant(id);
    revalidatePath('/variants');
    return { ok: true, id };
  } catch (e) {
    return { ok: false, id, error: e instanceof Error ? e.message : String(e) };
  }
}
