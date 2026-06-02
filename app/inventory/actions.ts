'use server';

import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/repo';
import type { InventoryItem } from '@/lib/types';

export type MutateResult = { ok: boolean; id: string; error?: string };

// NOTE: in-memory status transition. True no-double-claim guarantees need
// DB-level row locking / transactional status transitions (Brief 12 · RLS).
export async function setInventoryStatusAction(item: InventoryItem, status: InventoryItem['status']): Promise<MutateResult> {
  try {
    await getRepo().saveInventoryItem({ ...item, status, reserved_for_takeoff_id: status === 'reserved' ? item.reserved_for_takeoff_id : undefined });
    revalidatePath('/inventory');
    return { ok: true, id: item.id };
  } catch (e) {
    return { ok: false, id: item.id, error: e instanceof Error ? e.message : String(e) };
  }
}
