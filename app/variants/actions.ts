'use server';

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { Variant } from '@/lib/types';
import { diffAttributes } from '@/lib/versioning';

export type MutateResult = { ok: boolean; id: string; error?: string };

/** Publish the working common_attributes as a new version (pin policy: existing
 *  take-offs stay on their snapshot_version). */
export async function publishVariantAction(variant: Variant, changelog: string): Promise<MutateResult> {
  try {
    const prev = variant.versions.find((v) => v.version === variant.current_version);
    const version = variant.current_version + 1;
    const next: Variant = {
      ...variant,
      current_version: version,
      versions: [
        ...variant.versions,
        { version, published_at: Date.now(), changelog: changelog || `v${version}`, common_attributes: variant.common_attributes, diff_from_previous: diffAttributes(prev?.common_attributes ?? {}, variant.common_attributes) },
      ],
    };
    await getRepo().saveVariant(next);
    revalidatePath('/variants');
    return { ok: true, id: variant.id };
  } catch (e) {
    return { ok: false, id: variant.id, error: e instanceof Error ? e.message : String(e) };
  }
}

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
