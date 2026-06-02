// Sub-assemblies — parametric, reusable, versioned bundles of materials.

import type { AttrValue } from './common';
import type { Visual } from './visual';
import type { InputType, PropertyScope } from './property';
import type { ChainRole } from './primitive';
import type { Rule } from './rule';
import type { VersionDiff } from './variant';

export type ParameterDef = {
  name: string;
  type: InputType;
  required: boolean;
  default?: AttrValue;
  description?: string;
};

export type SubAssemblyMaterial = { id: string; material_id: string; rule: Rule };

export type ParameterBinding =
  | { kind: 'literal'; value: AttrValue }
  | { kind: 'modifier_ref'; modifier_name: string }
  | { kind: 'criterion_ref'; criterion_name: string }
  | { kind: 'variant_attr_ref'; attr_name: string }
  | { kind: 'chain_ref'; role: ChainRole }
  | { kind: 'property_ref'; property_name: string; input_name?: string }
  | { kind: 'algorithm_output_ref'; algorithm: string; field: string }
  | { kind: 'expression'; expr: string };

export type SubAssemblyUse = {
  id: string;
  sub_assembly_id: string;
  pinned_version: number;
  parameter_bindings: Record<string, ParameterBinding>;
  scope: PropertyScope;
};

export type SubAssemblyVersion = {
  version: number;
  published_at: number;
  changelog: string;
  parameters: ParameterDef[];
  materials: SubAssemblyMaterial[];
  diff_from_previous?: VersionDiff;
};

export type SubAssembly = {
  id: string;
  visual?: Visual;
  name: string;
  description?: string;
  category?: string;
  current_version: number;
  versions: SubAssemblyVersion[];
  status: 'active' | 'deprecated' | 'archived';
  parameters: ParameterDef[];
  materials: SubAssemblyMaterial[];
  sub_assembly_uses?: SubAssemblyUse[]; // nested (acyclic; resolve recursively)
};
