// Primitives and the dimension-chain role vocabulary.

export type Primitive =
  | { kind: 'length'; segmentable?: boolean }
  | { kind: 'height' } // segments into flights internally (compliance-driven)
  | { kind: 'count' }
  | { kind: 'area' } // v3
  | { kind: 'volume' }; // v3

export type PrimitiveKind = Primitive['kind'];

export type LengthInput =
  | { mode: 'single'; total: number; is_loop?: boolean }
  | { mode: 'segmented'; segments: SegmentInput[]; is_loop?: boolean };

export type SegmentInput = {
  length: number;
  junction_after?: { type: string; variant?: string };
  offsets?: { start?: number; end?: number };
};

/** The ordered roles in a dimension chain: input → adjusted → constrained → quantized. */
export type ChainRole = 'input' | 'adjusted' | 'constrained' | 'quantized';
