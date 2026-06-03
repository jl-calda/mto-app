// Derive a take-off screen's initial inputs from its saved Takeoff record (falling
// back to the system's declared defaults) — so the pages don't hard-code criteria,
// starting dimensions, or the selected variant.

import type { AttrValue, Model, Rule, SubAssembly, System, SystemVariantRef, Takeoff } from '@/lib/types';

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

/**
 * Resolved modifier values seeded the same way the engine resolves them:
 * system defaults → model.modifier_defaults → saved values. Mirrors
 * `resolveModifierValues` in the engine so the take-off UI starts from the
 * values the engine would otherwise apply by default. Null defaults (e.g.
 * `support_grid`) are skipped so they don't render as a control seed.
 */
export function deriveModifierValues(system: System, model: Model, saved?: Record<string, unknown> | null): Record<string, AttrValue> {
  const out: Record<string, AttrValue> = {};
  for (const m of system.modifiers) if (m.default_value != null) out[m.name] = m.default_value;
  for (const [k, v] of Object.entries(model.modifier_defaults ?? {})) if (v != null) out[k] = v;
  for (const [k, v] of Object.entries(saved ?? {})) if (v != null) out[k] = v as AttrValue;
  return out;
}

/**
 * Allowed values for each criterion, discovered from the rules that gate on it
 * (`applies_when.criteria`) across the model's materials, connection materials,
 * and the sub-assemblies it uses. Lets the take-off UI offer a select where the
 * data implies a finite set (e.g. EVO `wind_zone` → 1/2/3), falling back to free
 * text where no rule constrains the value.
 */
export function deriveCriteriaOptions(system: System, model: Model, subAssemblies: SubAssembly[] = []): Record<string, string[]> {
  const acc: Record<string, Set<string>> = {};
  const usedSaIds = new Set((model.sub_assembly_uses ?? []).map((u) => u.sub_assembly_id));
  const rules: Rule[] = [
    ...model.materials.map((m) => m.rule),
    ...(model.connection_materials ?? []).map((c) => c.rule),
    ...subAssemblies.filter((sa) => usedSaIds.has(sa.id)).flatMap((sa) => sa.materials.map((m) => m.rule)),
  ];
  for (const r of rules) {
    for (const [k, vals] of Object.entries(r.applies_when.criteria ?? {})) {
      for (const v of vals) (acc[k] ??= new Set()).add(String(v));
    }
  }
  return Object.fromEntries(system.criteria.map((c) => [c.library_id, [...(acc[c.library_id] ?? [])]]));
}

/** Index of the saved variant within the system's variant rows. */
export function deriveVariantIndex(system: System, takeoff?: Takeoff | null): number {
  const ref = takeoff?.variant_choice?.source_ref;
  if (!ref) return 0;
  const name = ref.kind === 'local' ? ref.name : ref.variant_id;
  const i = system.variants.rows.findIndex((r) => rowName(r) === name);
  return i >= 0 ? i : 0;
}
