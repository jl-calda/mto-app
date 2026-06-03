// Referential-integrity guards for deletes — pure functions so they're trivially
// testable and shared by every server action. We GUARD across aggregates (refuse a
// delete that would orphan a saved take-off) rather than silently cascade. Returns
// a human-readable reason when the delete must be blocked, else null.

import type { System, Takeoff } from '@/lib/types';

/** Block deleting a system while any saved take-off still references it. Its nested
 *  models are part of the aggregate and cascade with it, so they don't block. */
export function systemDeleteBlock(system: System, takeoffs: Takeoff[]): string | null {
  const n = takeoffs.filter((t) => t.system_id === system.id).length;
  if (n > 0) return `In use by ${n} take-off${n === 1 ? '' : 's'} — delete those first`;
  return null;
}

/** Block deleting a model while any saved take-off still references it. */
export function modelDeleteBlock(modelId: string, takeoffs: Takeoff[]): string | null {
  const n = takeoffs.filter((t) => t.model_id === modelId).length;
  if (n > 0) return `In use by ${n} take-off${n === 1 ? '' : 's'} — delete those first`;
  return null;
}
