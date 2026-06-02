// Rules — material-first, three-knob (variant scope, criteria scope, quantity pattern).

import type { AttrValue, Json } from './common';
import type { PropertyScope } from './property';

export type Rule = {
  qty_kind: 'fixed' | 'per' | 'per_length' | 'cut' | 'algorithm';
  qty?: number;
  per?: PerTarget;
  unit?: string;
  cut_length?: number;
  /** Sub-assembly context: take the cut length from a bound parameter by name. */
  cut_length_param?: string;
  /** Resolve this line's SKU from a model SkuLookup table instead of the material's SKU. */
  sku_lookup?: SkuLookupRef;
  algorithm_config?: AlgorithmCall;
  emit_per?: Emission[];
  emit_once?: Emission[];
  scope?: PropertyScope;
  applies_when: {
    variants: string[];
    criteria: Record<string, string[]>;
    /** Optional modifier-equality gates (e.g. is_loop=true, configuration=overhead). */
    modifiers?: Record<string, string[]>;
  };
  note?: string;
};

export type PerTarget =
  | { kind: 'property'; name: string }
  | { kind: 'primitive_input' }
  | { kind: 'unit_of_length'; length_source: string }
  | { kind: 'derived'; name: string } // 'support_position', 'stock_piece', 'join'
  | { kind: 'algorithm_output'; algorithm: string; field: string }
  | { kind: 'parameter'; name: string }; // inside a sub-assembly

export type SkuKeyRef =
  | { kind: 'literal'; value: string }
  | { kind: 'modifier'; name: string }
  | { kind: 'modifier_band'; name: string } // banded_distance → matched band's sku_key
  | { kind: 'criterion'; name: string }
  | { kind: 'property_input'; property: string; input: string }
  | { kind: 'variant_attr'; name: string };

export type SkuLookupRef = { table: string; keys: SkuKeyRef[] };

export type AlgorithmName = 'place_supports' | 'place_supports_optimal' | 'pack_stock' | 'cut_from_stock' | 'pack_stock_2d';

export type AlgorithmCall = {
  algorithm: AlgorithmName;
  inputs: Record<string, string>;
};

export type Emission = { material_id: string; qty: string; when?: string };

export type SkuLookup = {
  table_name: string;
  columns: string[];
  rows: { keys: Json[]; sku: string }[];
  fallback?: 'error' | 'custom' | { sku: string };
};

export type CriteriaDefault = {
  criterion: string;
  value: string;
  assignments: Record<string, AttrValue>;
};

export type ModelMaterial = { id: string; material_id: string; rule: Rule; notes?: string };
