'use server';

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { SubAssembly } from '@/lib/types';
import { diffNames } from '@/lib/versioning';

export type MutateResult = { ok: boolean; id: string; error?: string };

/** Persist the working draft (parameters + materials) without cutting a version. */
export async function saveSubAssemblyAction(sa: SubAssembly): Promise<MutateResult> {
  try {
    await getRepo().saveSubAssembly(sa);
    revalidatePath('/sub-assemblies');
    return { ok: true, id: sa.id };
  } catch (e) {
    return { ok: false, id: sa.id, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Publish the current parameters + materials as a new sub-assembly version. */
export async function publishSubAssemblyAction(sa: SubAssembly, changelog: string): Promise<MutateResult> {
  try {
    const prev = sa.versions.find((v) => v.version === sa.current_version);
    const version = sa.current_version + 1;
    const next: SubAssembly = {
      ...sa,
      current_version: version,
      versions: [
        ...sa.versions,
        {
          version,
          published_at: Date.now(),
          changelog: changelog || `v${version}`,
          parameters: sa.parameters,
          materials: sa.materials,
          diff_from_previous: diffNames((prev?.parameters ?? []).map((p) => p.name), sa.parameters.map((p) => p.name)),
        },
      ],
    };
    await getRepo().saveSubAssembly(next);
    revalidatePath('/sub-assemblies');
    return { ok: true, id: sa.id };
  } catch (e) {
    return { ok: false, id: sa.id, error: e instanceof Error ? e.message : String(e) };
  }
}
