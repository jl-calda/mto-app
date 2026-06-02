// Rule evaluation core (v1): applies_when, the quantity patterns, property
// archetypes. Pure and deterministic. Algorithm-driven quantities and the
// stock/variant/junction archetypes arrive in Brief 08; sub-assembly params in 09.

import type {
  DimensionChain,
  PerTarget,
  PropertyInstance,
  PropertyScope,
  Rule,
  VariantSnapshot,
} from '@/lib/types';
import type { GeometryParts } from './geometry/segmentation';
import { chainLength } from './geometry/dimension-chain';

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

export function variantName(v: VariantSnapshot): string {
  return v.source_ref.kind === 'local' ? v.source_ref.name : v.source_ref.variant_id;
}

export type AppliesResult = { variant: boolean; criteria: boolean; skipReason?: string };

export function appliesWhen(
  rule: Rule,
  vname: string,
  criteria: Record<string, unknown>,
): AppliesResult {
  const vlist = rule.applies_when.variants ?? [];
  const variantOk = vlist.length === 0 || vlist.includes(vname);

  let criteriaOk = true;
  let failed: string | undefined;
  for (const [k, allowed] of Object.entries(rule.applies_when.criteria ?? {})) {
    if (!allowed || allowed.length === 0) continue;
    if (!allowed.includes(String(criteria[k]))) {
      criteriaOk = false;
      failed = k;
      break;
    }
  }

  const skipReason = !variantOk
    ? `variant '${vname}' not in {${vlist.join(', ')}}`
    : !criteriaOk
      ? `criterion '${failed}' = '${String(criteria[failed as string])}' not allowed`
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
      return 0; // Brief 08
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
): QtyResult {
  switch (rule.qty_kind) {
    case 'fixed':
      return { kind: 'qty', value: rule.qty ?? 1 };
    case 'per': {
      const base = resolveX(rule.per, propertyVals, derived, primitiveCount, chain, parameters);
      return { kind: 'qty', value: Math.ceil((rule.qty ?? 1) * base) };
    }
    case 'per_length':
      return { kind: 'qty', value: Math.ceil((rule.qty ?? 1) * (chainLength(chain) / 1000)) };
    case 'cut':
      return {
        kind: 'cut',
        cut_length:
          rule.cut_length ?? (rule.cut_length_param ? (parameters[rule.cut_length_param] ?? 0) : 0),
        occurrences: resolveX(rule.per, propertyVals, derived, primitiveCount, chain, parameters) || 1,
      };
    case 'algorithm':
      return { kind: 'skip', reason: 'algorithm-driven (Brief 08)' };
    default:
      return { kind: 'skip', reason: 'unknown quantity kind' };
  }
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
