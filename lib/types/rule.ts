// Rules — material-first, three-knob (variant scope, criteria scope, quantity pattern).

import type { AttrValue, Json } from './common';
import type { PropertyScope } from './property';

export type Rule = {
  qty_kind: 'fixed' | 'per' | 'per_length' | 'cut' | 'algorithm';
  qty?: number;
  per?: PerTarget;
  unit?: string;
  cut_length?: number;
  algorithm_config?: AlgorithmCall;
  emit_per?: Emission[];
  emit_once?: Emission[];
  scope?: PropertyScope;
  applies_when: {
    variants: string[];
    criteria: Record<string, string[]>;
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

export type AlgorithmName = 'place_supports' | 'pack_stock' | 'cut_from_stock' | 'pack_stock_2d';

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
