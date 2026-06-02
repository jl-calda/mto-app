// The pure resolution engine — the ONLY import surface for the UI.
// Implementations land in Brief 05 (interpreter), 06 (take-off), 07 (geometry),
// 08 (algorithms), 09 (sub-assemblies + attachments). Stubs throw until then.
//
// Purity contract: no I/O, no Date.now, no randomness; deterministic solvers.
// resolveTakeoff (take-off screen) and evaluateRuleAgainstSample (material-rule
// live pane) share the SAME evaluator — build it once.

import type {
  CanonicalGeometry,
  CuttingPlan,
  DimensionChain,
  Model,
  MtoLine,
  Rule,
  System,
  VariantSnapshot,
  Warning,
} from '@/lib/types';
import type { AlgorithmRegistry } from './algorithms/types';
import type { XRef } from './context';

export type { EvalContext, ScopeInstance, XRef } from './context';
export type { Algorithm, AlgorithmRegistry, AlgoInput, AlgoOutput } from './algorithms/types';
export { createRegistry, defaultRegistry } from './algorithms/registry';
export { WarningSink } from './warnings';

/** A take-off's user-supplied inputs (the editable state). */
export type TakeoffInput = {
  criteria_values: Record<string, unknown>;
  modifier_values: Record<string, unknown>;
  primitive_input: unknown;
  property_values: Record<string, unknown>;
  attachments?: unknown[];
};

export type ResolveTakeoffArgs = {
  system: System;
  model: Model;
  /** DENORMALIZED snapshot — never a live ref (snapshots are a correctness law). */
  variant: VariantSnapshot;
  input: TakeoffInput;
  projectDefaults?: Record<string, unknown>;
  /** For attachment recursion; undefined in live-eval. */
  resolveAttachedSystem?: (id: string) => { system: System; model: Model };
  /** Injectable so tests can stub solvers. */
  algorithms?: AlgorithmRegistry;
};

export type TraceNode = { label: string; detail?: string; children?: TraceNode[] };

export type TakeoffResult = {
  geometry: CanonicalGeometry;
  chain: DimensionChain;
  mto: MtoLine[];
  cuttingPlans: CuttingPlan[];
  warnings: Warning[];
  trace: TraceNode[];
  counters: Record<string, number>;
};

/** Sample inputs for the material-rule live-evaluation pane. */
export type SampleInput = {
  variant: string;
  criteria: Record<string, unknown>;
  properties: Record<string, unknown>;
  primitive: Record<string, number>;
};

export type CutDemandResult = { cut_length: number; occurrences: number };

export type RuleEvalResult = {
  fires: boolean;
  qty: number | CutDemandResult;
  sku: string | null;
  checks: { variant: boolean; criteria: boolean };
  skipReason?: string;
  trace: TraceNode;
};

/** The projection of a System (+ Model) that drives the X-picker — same `XRef`
 *  vocabulary the runtime resolver consumes, so a picked option always resolves. */
export type RuleContext = {
  variants: string[];
  criteria: Record<string, string[]>;
  properties: { name: string; archetype: string; kind: 'count' | 'length' }[];
  modifiers: string[];
  derived: string[];
  algoOutputs: { algo: string; fields: string[] }[];
  /** Every selectable reference (authoring↔runtime exhaustiveness contract). */
  xrefs: XRef[];
};

export function resolveTakeoff(_args: ResolveTakeoffArgs): TakeoffResult {
  throw new Error('resolveTakeoff: not implemented yet (Brief 05/06)');
}

export function evaluateRuleAgainstSample(
  _rule: Rule,
  _system: System,
  _sample: SampleInput,
): RuleEvalResult {
  throw new Error('evaluateRuleAgainstSample: not implemented yet (Brief 05)');
}

export function deriveRuleContext(_system: System, _model?: Model): RuleContext {
  throw new Error('deriveRuleContext: not implemented yet (Brief 05)');
}
