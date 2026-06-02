// Engine-internal shared types — kept out of index.ts so emit.ts / attachments.ts
// can import them without a runtime import cycle (index imports those modules).
// The public ones (TakeoffInput, TraceNode) are re-exported from index.ts.

import type {
  AttachmentInstance,
  AttrValue,
  ChainRole,
  DimensionChain,
  Material,
  SubAssembly,
  System,
} from '@/lib/types';
import type { AlgoOutput } from './algorithms/types';

export type TakeoffInput = {
  criteria_values: Record<string, unknown>;
  modifier_values: Record<string, unknown>;
  primitive_input: unknown;
  property_values: Record<string, unknown>;
  /** Per-attachment user choices (include/exclude + open inputs). */
  attachments?: AttachmentInstance[];
  /** Manual overrides of dimension-chain step values (Brief 10). */
  chain_overrides?: Partial<Record<ChainRole, number>>;
};

export type TraceNode = { label: string; detail?: string; children?: TraceNode[] };

/** Everything a sub-assembly parameter binding or connection material can read
 *  from the host take-off it is inlined into. */
export type HostEvalContext = {
  variantName: string;
  variantAttrs: Record<string, AttrValue>;
  criteria: Record<string, unknown>;
  modifiers: Record<string, unknown>;
  chain: DimensionChain;
  /** archetype-resolved numeric value per property. */
  propertyValues: Record<string, number>;
  /** raw per-property input values (for property_ref with an input_name). */
  propertyInputs: Record<string, Record<string, unknown>>;
  derived: Record<string, number>;
  primitiveCount: number;
  algorithmOutputs: Map<string, AlgoOutput>;
};

/** A suppression resolved to the member it acts on (host vs. attached already split). */
export type Suppress = { property_name: string; region: 'at_connection' | 'whole' };

/** Shared dependencies threaded through the recursive resolution. */
export type ResolveDeps = {
  materials: Map<string, Material>;
  /** ONE shared cut pool for the whole take-off tree (host + sub-assemblies + attachments). */
  cutPool: Map<string, number[]>;
  resolveSubAssembly?: (id: string) => SubAssembly | undefined;
  resolveAttachedSystem?: (id: string) => System | undefined;
};
