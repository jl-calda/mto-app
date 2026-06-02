// Models — children of a System; declare the materials its answers produce.

import type { AttrValue } from './common';
import type { Visual } from './visual';
import type { ModelMaterial, SkuLookup, CriteriaDefault } from './rule';
import type { SubAssemblyUse } from './subassembly';
import type { ConnectionMaterialRule } from './attachment';
import type { VersionDiff } from './variant';

export type AutoSegmentationConfig = {
  policy: 'equal_flights' | 'lower_flight_maxed' | 'specific_deck_heights' | 'match_structural_levels';
  deck_heights?: number[];
  structural_levels?: number[];
};

export type ModelVersion = {
  version: number;
  published_at: number;
  changelog: string;
  diff_from_previous?: VersionDiff;
};

export type Model = {
  id: string;
  visual?: Visual;
  name: string;
  description?: string;
  system_id: string;
  status: 'draft' | 'published' | 'deprecated';
  current_version?: number;
  versions?: ModelVersion[];
  modifier_defaults: Record<string, AttrValue>;
  materials: ModelMaterial[];
  sub_assembly_uses: SubAssemblyUse[];
  sku_lookups: SkuLookup[];
  criteria_driven_defaults: CriteriaDefault[];
  auto_segmentation_config?: AutoSegmentationConfig;
  /** Connection materials for attachments declared on this model's system. */
  connection_materials?: ConnectionMaterialRule[];
};
