'use server';

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { Project } from '@/lib/types';

export type SaveProjectResult = { ok: boolean; id: string; error?: string };

export async function saveProjectAction(project: Project): Promise<SaveProjectResult> {
  try {
    const saved = await getRepo().saveProject(project);
    revalidatePath('/');
    revalidatePath(`/projects/${saved.id}`);
    return { ok: true, id: saved.id };
  } catch (e) {
    return { ok: false, id: project.id, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteProjectAction(id: string): Promise<SaveProjectResult> {
  try {
    await getRepo().deleteProject(id);
    revalidatePath('/');
    revalidatePath('/projects');
    return { ok: true, id };
  } catch (e) {
    return { ok: false, id, error: e instanceof Error ? e.message : String(e) };
  }
}
