// Properties (detail inputs the take-off user fills), their archetypes & scopes,
// plus packing policy, placement rules, and span declarations.

import type { AttrValue } from './common';
import type { ChainRole } from './primitive';

export type PropertyArchetype =
  | 'spacing'
  | 'count'
  | 'rate'
  | 'stock'
  | 'variant'
  | 'threshold'
  | 'junction';

export type PropertyScope =
  | 'per_segment'
  | 'per_junction'
  | { kind: 'per_span'; span_name: string }
  | 'per_mount_surface'
  | 'set_level';

export type InputType =
  | { kind: 'distance' }
  | { kind: 'number' }
  | { kind: 'integer' }
  | { kind: 'bool' }
  | { kind: 'enum'; values: string[] }
  | { kind: 'variant'; options: VariantOption[] };

export type VariantOption = { value: string; label: string; sub_inputs: PropertyInput[] };

export type PropertyInput = {
  name: string;
  label: string;
  type: InputType;
  required: boolean;
  default?: AttrValue;
};

export type CriterionRef = { library_id: string; default_value?: AttrValue };

export type PackingPolicy =
  | { mode: 'tight'; overlap_per_joint: number }
  | { mode: 'spaced'; max_gap: number; gap_distribution?: 'even' | 'flexible' };

export type PlacementRules = {
  end_clearance_foot?: { max: number; min?: number; editable_at_takeoff?: boolean };
  end_clearance_head?: { max: number; min?: number; editable_at_takeoff?: boolean };
  max_spacing?: number;
  min_spacing?: number;
  min_count_in_region?: { from: 'foot' | 'head'; distance: number; min: number }[];
  forbidden_zones?: { start: number; end: number }[];
  required_positions?: number[];
};

export type PropertyInstance = {
  catalog_id: string;
  name: string;
  archetype: PropertyArchetype;
  inputs: PropertyInput[];
  scope: PropertyScope;
  length_basis?: ChainRole;
  packing_policy?: PackingPolicy; // for 'stock'
  placement_rules?: PlacementRules; // for algorithm-driven
  /** Variant×property gating (authored via the wizard matrix). Empty/undefined = all variants. */
  applies_to_variants?: string[];
};

export type SpanEndpoint =
  | { kind: 'segment_foot'; segment_index: number; offset?: number }
  | { kind: 'segment_head'; segment_index: number; offset?: number }
  | { kind: 'junction_deck'; junction_index: number; offset?: number }
  | { kind: 'compliance_constant'; name: string };

export type SpanDeclaration = {
  name: string;
  start: SpanEndpoint;
  end: SpanEndpoint;
  enabled: boolean;
};
