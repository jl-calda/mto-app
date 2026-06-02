// Canonical geometry — the resolved shape the engine builds from a take-off's inputs.

import type { ChainRole } from './primitive';

export type DimensionChainStep = {
  role: ChainRole;
  name: string;
  value: number;
  source: 'user_input' | 'derived' | 'solved' | 'user_override';
  from?: string[];
  contributing_constraints?: { name: string; value: number; dominant: boolean }[];
  override_history?: {
    overridden_value: number;
    original_engine_value: number;
    overridden_at: number;
  };
};

export type DimensionChain = { steps: DimensionChainStep[] };

export type Segment = {
  id: string;
  index: number;
  primitive_input: unknown;
  dimension_chain: DimensionChain;
  foot_kind: 'free' | 'junction_attached';
  head_kind: 'free' | 'junction_attached';
};

export type Junction = {
  id: string;
  type: 'corner' | 'splice' | 'rest_platform' | (string & {});
  position: number;
  variant?: string;
  attributes: Record<string, unknown>;
  adjacent_segment_constraints?: {
    overshoot_into_segment_below?: number;
    overshoot_above_segment_above?: number;
  };
};

export type Span = {
  name: string;
  range: [number, number];
  covered_segments: string[];
  covered_junctions: string[];
  length: number;
};

export type SupportGrid =
  | { kind: 'dense' }
  | { kind: 'regular'; spacing: number; phase: number }
  | { kind: 'irregular'; positions: number[] };

export type MountSurface = {
  id: string;
  substrate: string;
  support_grid: SupportGrid;
  segments_covered: string[];
  span_range: [number, number];
};

export type SupportPosition = { mount_surface_id: string; position: number; satisfies_rule?: string };
export type JointPosition = { position: number; segment_id: string };
export type Gap = { start: number; end: number; span_name?: string };

export type CanonicalGeometry = {
  measured_range: [number, number];
  effective_range: [number, number];
  installed_range: [number, number];
  physical_range: [number, number];
  free_ends_count: 0 | 1 | 2;
  end_roles: { start: string; end: string };
  orientation: 'horizontal' | 'vertical' | 'inclined';
  is_loop: boolean;
  segments?: Segment[];
  junctions?: Junction[];
  spans?: Span[];
  mount_surfaces?: MountSurface[];
  supports?: SupportPosition[];
  joints?: JointPosition[];
  gaps?: Gap[];
  dimension_chain: DimensionChain;
};
