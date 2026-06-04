// Build a real engine call (resolveTakeoff args) from the model editor's sample
// inputs, so the editor can show LIVE engine warnings (high_wastage, cut_too_long,
// auto-split info, runtime missing_sku, …) the static checks can't prove. Pure.
//
// No sub-assembly / attached-system resolvers are supplied — the editor doesn't
// have them — so the engine's "… not found" warnings for those are filtered out by
// the caller (see ENGINE_NOISE).

import type { Material, Model, System, VariantSnapshot } from '@/lib/types';
import type { ResolveTakeoffArgs } from '@/lib/engine';
import { deriveModifierValues } from '@/lib/takeoff-init';

/** The model editor's live-eval sample state. */
export type EditorSample = {
  variant: string;
  criteria: Record<string, string>;
  props: Record<string, Record<string, number>>;
  primitive: number;
};

/** Warnings that are artifacts of the editor lacking sub-assembly / attachment
 *  resolvers (a take-off-time concern), not authoring problems — filter these out. */
export const ENGINE_NOISE = /(sub-assembly|attached (system|model)).*not found/i;

function variantSnapshot(system: System, name: string): VariantSnapshot {
  const row = system.variants.rows.find((r) => (r.kind === 'local' ? r.name : r.variant_id) === name) ?? system.variants.rows[0];
  if (!row) return { source_ref: { kind: 'local', name, attributes: {} }, attributes: {} };
  const attributes = row.kind === 'local' ? row.attributes : (row.system_overrides ?? {});
  return { source_ref: row, attributes };
}

export function synthSample(system: System, model: Model, sample: EditorSample, materials: Material[] = []): ResolveTakeoffArgs {
  // height/count primitives are a bare number; a length is a single-run LengthInput.
  const primitive_input = system.primitive.kind === 'length' ? { mode: 'single', total: sample.primitive } : sample.primitive;
  return {
    system,
    model,
    materials,
    variant: variantSnapshot(system, sample.variant),
    input: {
      criteria_values: sample.criteria,
      modifier_values: deriveModifierValues(system, model),
      primitive_input,
      property_values: sample.props,
    },
  };
}
