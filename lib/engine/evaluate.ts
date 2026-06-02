// Rule evaluation core (v1): applies_when, the quantity patterns, property
// archetypes. Pure and deterministic. Algorithm-driven quantities and the
// stock/variant/junction archetypes arrive in Brief 08; sub-assembly params in 09.

import type {
  DimensionChain,
  PerTarget,
  PropertyInstance,
  Rule,
  VariantSnapshot,
} from '@/lib/types';
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

/** Compute a numeric value per property by archetype (counts for spacing/count/
 *  threshold; a measure for rate). */
export function evaluateProperties(
  properties: PropertyInstance[],
  chain: DimensionChain,
  propertyValues: Record<string, unknown>,
): Record<string, number> {
  const L = chainLength(chain);
  const out: Record<string, number> = {};
  for (const p of properties) {
    const inputs = (propertyValues[p.name] as Record<string, unknown> | undefined) ?? {};
    const inp = (name: string): number => {
      if (inputs[name] != null) return num(inputs[name]);
      return num(p.inputs.find((i) => i.name === name)?.default);
    };
    switch (p.archetype) {
      case 'spacing': {
        const spacing = inp('spacing') || 1;
        out[p.name] = Math.ceil(L / spacing) + 1; // + endpoints
        break;
      }
      case 'rate':
        out[p.name] = (L / 1000) * inp('rate');
        break;
      case 'count':
        out[p.name] = inp('count');
        break;
      case 'threshold': {
        const threshold = inp('threshold');
        const spacing = inp('spacing') || inp('hoop_spacing') || 1;
        out[p.name] = L >= threshold && spacing > 0 ? Math.ceil((L - threshold) / spacing) : 0;
        break;
      }
      default:
        out[p.name] = 0; // stock / variant / junction → later briefs
    }
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
