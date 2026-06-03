// Pure builders + coercion for authoring sub-assemblies in the UI. Kept out of the
// component so they're unit-testable and side-effect-free (ids are passed in).

import type { AttrValue, InputType, ParameterDef, SubAssemblyMaterial } from '@/lib/types';

/** A blank material rule entry referencing `materialId`, defaulting to a fixed 1×. */
export function blankSam(id: string, materialId: string): SubAssemblyMaterial {
  return { id, material_id: materialId, rule: { qty_kind: 'fixed', qty: 1, applies_when: { variants: [], criteria: {} } } };
}

/** A blank numeric parameter with a unique-ish name the author can rename. */
export function blankParam(name: string): ParameterDef {
  return { name, type: { kind: 'number' }, required: false };
}

/** Coerce a free-text default into the value type implied by the parameter's input kind. */
export function coerceParamDefault(raw: string, kind: InputType['kind']): AttrValue | undefined {
  const s = raw.trim();
  if (s === '') return undefined;
  if (kind === 'bool') return s === 'true' || s === '1' || s.toLowerCase() === 'yes';
  if (kind === 'distance' || kind === 'number' || kind === 'integer') {
    const num = Number(s);
    return Number.isFinite(num) ? num : undefined;
  }
  return s; // enum / variant → string
}
