// Derive a take-off screen's initial inputs from its saved Takeoff record (falling
// back to the system's declared defaults) — so the pages don't hard-code criteria,
// starting dimensions, or the selected variant.

import type { System, SystemVariantRef, Takeoff } from '@/lib/types';

const rowName = (r: SystemVariantRef): string => (r.kind === 'local' ? r.name : r.variant_id);

/** Criteria values: the saved take-off's, else each criterion's declared default. */
export function deriveCriteria(system: System, takeoff?: Takeoff | null): Record<string, string> {
  if (takeoff?.criteria_values && Object.keys(takeoff.criteria_values).length) {
    return Object.fromEntries(Object.entries(takeoff.criteria_values).map(([k, v]) => [k, String(v)]));
  }
  return Object.fromEntries(system.criteria.map((c) => [c.library_id, c.default_value != null ? String(c.default_value) : '']));
}

/** The primitive starting value (number for height/count, the `.total` for a single length). */
export function derivePrimitiveTotal(takeoff?: Takeoff | null): number | undefined {
  const p = takeoff?.primitive_input;
  if (typeof p === 'number') return p;
  if (p && typeof p === 'object' && typeof (p as { total?: unknown }).total === 'number') return (p as { total: number }).total;
  return undefined;
}

/** Index of the saved variant within the system's variant rows. */
export function deriveVariantIndex(system: System, takeoff?: Takeoff | null): number {
  const ref = takeoff?.variant_choice?.source_ref;
  if (!ref) return 0;
  const name = ref.kind === 'local' ? ref.name : ref.variant_id;
  const i = system.variants.rows.findIndex((r) => rowName(r) === name);
  return i >= 0 ? i : 0;
}
