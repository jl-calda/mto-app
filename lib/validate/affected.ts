// Namespaced `affected_fields` tokens for validation warnings. They let the UI
// filter the flat Warning[] down to the row/field a warning concerns (e.g. show a
// badge on just the `wind_zone` criterion row). Validation emits these namespaced
// tokens; the ENGINE emits bare ids (a material_id like `mat-evo-cw`), so a model
// row asks `byAffected` for BOTH its `mm:<id>` token and its bare material_id.

import type { Warning } from '@/lib/types';

export const affected = {
  /** A model material row — keyed by ModelMaterial.id (or material_id for connection rules). */
  mm: (id: string) => `mm:${id}`,
  prop: (name: string) => `prop:${name}`,
  mod: (name: string) => `mod:${name}`,
  variant: (name: string) => `variant:${name}`,
  crit: (id: string) => `crit:${id}`,
  span: (name: string) => `span:${name}`,
  skuLookup: (table: string) => `sku_lookup:${table}`,
  placement: (name: string) => `placement:${name}`,
};

/** Warnings whose `affected_fields` contains ANY of the given tokens. */
export function byAffected(warnings: Warning[], ...tokens: string[]): Warning[] {
  const want = new Set(tokens);
  return warnings.filter((wn) => (wn.affected_fields ?? []).some((f) => want.has(f)));
}
