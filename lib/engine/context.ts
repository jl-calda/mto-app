// EvalContext — "everything a rule can see" — and the XRef value-source union
// that couples authoring (the X-picker) to runtime (resolveX). Build logic lands
// in Brief 05 (single-segment) and Brief 07 (scope instances).

import type {
  AttrValue,
  CanonicalGeometry,
  ChainRole,
  DimensionChain,
  PropertyScope,
  VariantSnapshot,
} from '@/lib/types';
import type { AlgoOutput } from './algorithms/types';

/** Tagged reference to a value a rule can read — the authoring↔runtime contract. */
export type XRef =
  | { kind: 'property'; name: string }
  | { kind: 'property_length'; name: string }
  | { kind: 'derived'; name: string }
  | { kind: 'chain'; role: ChainRole }
  | { kind: 'primitive_input' }
  | { kind: 'algorithm_output'; algo: string; field: string };

/** Everything a rule can see during evaluation. */
export type EvalContext = {
  variant: VariantSnapshot;
  criteria: Record<string, AttrValue>;
  modifiers: Record<string, AttrValue>;
  primitiveInput: unknown;
  geometry: CanonicalGeometry;
  /** property name → input name → value */
  properties: Record<string, Record<string, AttrValue>>;
  /** engine-owned derived counters (posts, free_ends_count, corner_count, …). */
  derived: Record<string, number>;
  /** keyed by algorithm-run id. */
  algorithmOutputs: Map<string, AlgoOutput>;
};

/** A scope narrows the context (per_segment hands the rule that segment's chain). */
export type ScopeInstance = {
  scope: PropertyScope;
  index: number;
  chain: DimensionChain;
  context: EvalContext;
};

export function buildContext(): EvalContext {
  throw new Error('buildContext: not implemented yet (Brief 05)');
}
