// Rule evaluation core (v1): applies_when, the quantity patterns, property
// archetypes. Pure and deterministic. Algorithm-driven quantities and the
// stock/variant/junction archetypes arrive in Brief 08; sub-assembly params in 09.

import type {
  AttrValue,
  DimensionChain,
  Modifier,
  PerTarget,
  PropertyInstance,
  PropertyScope,
  Rule,
  SkuLookup,
  SkuLookupRef,
  VariantSnapshot,
} from '@/lib/types';
import type { AlgoOutput } from './algorithms/types';
import type { GeometryParts } from './geometry/segmentation';
import { chainLength } from './geometry/dimension-chain';
import { activeBandIndex } from './bands';

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

export function variantName(v: VariantSnapshot): string {
  return v.source_ref.kind === 'local' ? v.source_ref.name : v.source_ref.variant_id;
}

export type AppliesResult = { variant: boolean; criteria: boolean; skipReason?: string };

function matchAll(spec: Record<string, string[]> | undefined, values: Record<string, unknown>): { ok: boolean; failed?: string } {
  for (const [k, allowed] of Object.entries(spec ?? {})) {
    if (!allowed || allowed.length === 0) continue;
    if (!allowed.includes(String(values[k]))) return { ok: false, failed: k };
  }
  return { ok: true };
}

export function appliesWhen(
  rule: Rule,
  vname: string,
  criteria: Record<string, unknown>,
  modifiers: Record<string, unknown> = {},
): AppliesResult {
  const vlist = rule.applies_when.variants ?? [];
  const variantOk = vlist.length === 0 || vlist.includes(vname);

  const crit = matchAll(rule.applies_when.criteria, criteria);
  const mod = matchAll(rule.applies_when.modifiers, modifiers);
  const criteriaOk = crit.ok && mod.ok;

  const skipReason = !variantOk
    ? `variant '${vname}' not in {${vlist.join(', ')}}`
    : !crit.ok
      ? `criterion '${crit.failed}' = '${String(criteria[crit.failed as string])}' not allowed`
      : !mod.ok
        ? `modifier '${mod.failed}' = '${String(modifiers[mod.failed as string])}' not allowed`
        : undefined;
  return { variant: variantOk, criteria: criteriaOk, skipReason };
}

type Inp = (name: string) => number;
function makeInp(p: PropertyInstance, propertyValues: Record<string, unknown>): Inp {
  const inputs = (propertyValues[p.name] as Record<string, unknown> | undefined) ?? {};
  return (name) => (inputs[name] != null ? num(inputs[name]) : num(p.inputs.find((i) => i.name === name)?.default));
}

/** One archetype's numeric contribution for a length L (counts for spacing/threshold;
 *  a measure for rate; the raw count otherwise). */
function archetypeValue(p: PropertyInstance, L: number, inp: Inp): number {
  switch (p.archetype) {
    case 'spacing': {
      const spacing = inp('spacing') || 1;
      return Math.ceil(L / spacing) + 1; // + endpoints
    }
    case 'rate':
      return (L / 1000) * inp('rate');
    case 'count':
      return inp('count');
    case 'threshold': {
      const threshold = inp('threshold');
      const spacing = inp('spacing') || inp('hoop_spacing') || 1;
      return L >= threshold && spacing > 0 ? Math.ceil((L - threshold) / spacing) : 0;
    }
    default:
      return 0; // stock / variant / junction → later briefs
  }
}

/** Single-chain property evaluation (used by the live-eval pane). */
export function evaluateProperties(
  properties: PropertyInstance[],
  chain: DimensionChain,
  propertyValues: Record<string, unknown>,
): Record<string, number> {
  const L = chainLength(chain);
  const out: Record<string, number> = {};
  for (const p of properties) out[p.name] = archetypeValue(p, L, makeInp(p, propertyValues));
  return out;
}

/** The length(s) a property's scope evaluates over. Single-segment runs reduce to
 *  the run length, so existing take-offs are unchanged; segmented runs evaluate
 *  per segment and sum. */
function lengthsForScope(scope: PropertyScope, geo: GeometryParts, runLength: number): number[] {
  if (scope === 'per_segment') return geo.segments.length ? geo.segments.map((s) => chainLength(s.dimension_chain)) : [runLength];
  if (typeof scope === 'object' && scope.kind === 'per_span') {
    const span = geo.spans.find((sp) => sp.name === scope.span_name);
    return span ? [span.length] : [runLength];
  }
  if (scope === 'per_mount_surface') return geo.mount_surfaces.length ? geo.mount_surfaces.map((m) => m.span_range[1] - m.span_range[0]) : [runLength];
  return [runLength]; // set_level / per_junction / default
}

/** Scope-aware property evaluation over the resolved geometry. */
export function evaluatePropertiesScoped(
  properties: PropertyInstance[],
  geo: GeometryParts,
  runChain: DimensionChain,
  propertyValues: Record<string, unknown>,
): Record<string, number> {
  const runLength = chainLength(runChain);
  const out: Record<string, number> = {};
  for (const p of properties) {
    const inp = makeInp(p, propertyValues);
    const lengths = lengthsForScope(p.scope, geo, runLength);
    out[p.name] = lengths.reduce((s, L) => s + archetypeValue(p, L, inp), 0);
  }
  return out;
}

export type QtyResult =
  | { kind: 'qty'; value: number }
  | { kind: 'cut'; cut_length: number; occurrences: number }
  | { kind: 'skip'; reason: string };

function resolveX(
  per: PerTarget | undefined,
  propertyVals: Record<string, number>,
  derived: Record<string, number>,
  primitiveCount: number,
  chain: DimensionChain,
  parameters: Record<string, number> = {},
  algoOutputs: Map<string, AlgoOutput> = new Map(),
): number {
  if (!per) return 1;
  switch (per.kind) {
    case 'property':
      return propertyVals[per.name] ?? 0;
    case 'derived':
      return derived[per.name] ?? 0;
    case 'primitive_input':
      return primitiveCount;
    case 'unit_of_length':
      return chainLength(chain) / 1000;
    case 'algorithm_output':
      return algoOutputs.get(per.algorithm)?.fields[per.field] ?? 0;
    case 'parameter':
      return parameters[per.name] ?? 0; // sub-assembly context (Brief 09)
    default:
      return 0;
  }
}

export function resolveQuantity(
  rule: Rule,
  propertyVals: Record<string, number>,
  derived: Record<string, number>,
  primitiveCount: number,
  chain: DimensionChain,
  /** Bound parameters when the rule is evaluated inside a sub-assembly use. */
  parameters: Record<string, number> = {},
  /** Algorithm outputs keyed by algorithm name (for algorithm_output X-refs). */
  algoOutputs: Map<string, AlgoOutput> = new Map(),
): QtyResult {
  switch (rule.qty_kind) {
    case 'fixed':
      return { kind: 'qty', value: rule.qty ?? 1 };
    case 'per': {
      const base = resolveX(rule.per, propertyVals, derived, primitiveCount, chain, parameters, algoOutputs);
      return { kind: 'qty', value: Math.ceil((rule.qty ?? 1) * base) };
    }
    case 'per_length':
      return { kind: 'qty', value: Math.ceil((rule.qty ?? 1) * (chainLength(chain) / 1000)) };
    case 'cut':
      return {
        kind: 'cut',
        cut_length:
          rule.cut_length ?? (rule.cut_length_param ? (parameters[rule.cut_length_param] ?? 0) : 0),
        occurrences: resolveX(rule.per, propertyVals, derived, primitiveCount, chain, parameters, algoOutputs) || 1,
      };
    case 'algorithm':
      return { kind: 'skip', reason: 'algorithm-driven (Brief 08)' };
    default:
      return { kind: 'skip', reason: 'unknown quantity kind' };
  }
}

/** Context a SkuLookupRef's keys resolve against. */
export type SkuContext = {
  modifiers: Record<string, unknown>;
  criteria: Record<string, unknown>;
  variantAttrs: Record<string, AttrValue>;
  propertyInputs: Record<string, Record<string, unknown>>;
  systemModifiers: Modifier[];
};

function bandSkuKey(name: string, value: number, mods: Modifier[]): string {
  const m = mods.find((x) => x.name === name);
  if (m?.type.kind === 'banded_distance') {
    const i = activeBandIndex(value, m.type.bands);
    return i >= 0 ? m.type.bands[i].sku_key : '';
  }
  return String(value);
}

/** Resolve a line's SKU from a model SkuLookup table (banded modifier / property input /
 *  variant attr / criterion / literal). Returns null when no row + no usable fallback. */
export function resolveSkuLookup(ref: SkuLookupRef, tables: SkuLookup[], ctx: SkuContext): { sku: string | null; keys: string[] } {
  const keys = ref.keys.map((k) => {
    switch (k.kind) {
      case 'literal': return k.value;
      case 'modifier': return String(ctx.modifiers[k.name]);
      case 'modifier_band': return bandSkuKey(k.name, num(ctx.modifiers[k.name]), ctx.systemModifiers);
      case 'criterion': return String(ctx.criteria[k.name]);
      case 'property_input': return String(ctx.propertyInputs[k.property]?.[k.input]);
      case 'variant_attr': return String(ctx.variantAttrs[k.name]);
    }
  });
  const table = tables.find((t) => t.table_name === ref.table);
  if (!table) return { sku: null, keys };
  const row = table.rows.find((r) => r.keys.length === keys.length && r.keys.every((v, i) => String(v) === keys[i]));
  if (row) return { sku: row.sku, keys };
  const fb = table.fallback;
  if (fb && typeof fb === 'object' && 'sku' in fb) return { sku: fb.sku, keys };
  return { sku: null, keys };
}

export function readPrimitive(primitiveInput: unknown): number {
  if (typeof primitiveInput === 'number') return primitiveInput;
  if (primitiveInput && typeof primitiveInput === 'object') {
    const o = primitiveInput as Record<string, unknown>;
    if (typeof o.total === 'number') return o.total;
    if (Array.isArray(o.segments)) {
      return (o.segments as { length?: unknown }[]).reduce((s, x) => s + num(x.length), 0);
    }
  }
  return 0;
}
