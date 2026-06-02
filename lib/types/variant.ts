// Variants — global design-family alternatives, versioned with snapshot semantics.

import type { AttrValue } from './common';
import type { Visual } from './visual';
import type { ModifierType } from './modifier';

export type VersionDiff = {
  added: Record<string, AttrValue>;
  modified: Record<string, { from: AttrValue; to: AttrValue }>;
  removed: string[];
};

export type VariantVersion = {
  version: number;
  published_at: number;
  published_by?: string;
  changelog: string;
  common_attributes: Record<string, AttrValue>;
  diff_from_previous?: VersionDiff;
};

export type Variant = {
  id: string;
  visual?: Visual;
  name: string;
  description?: string;
  common_attributes: Record<string, AttrValue>;
  current_version: number;
  versions: VariantVersion[];
  status: 'active' | 'deprecated' | 'archived';
  used_in_systems: string[]; // computed
};

export type VariantTable = {
  attribute_columns: { name: string; type: ModifierType }[];
  rows: SystemVariantRef[];
};

export type SystemVariantRef =
  | {
      kind: 'library';
      variant_id: string;
      pinned_version: number;
      system_overrides?: Record<string, AttrValue>;
    }
  | { kind: 'local'; name: string; visual?: Visual; attributes: Record<string, AttrValue> };

/** Resolved variant attributes snapshotted into a take-off at a version. */
export type VariantSnapshot = {
  source_ref: SystemVariantRef;
  snapshot_version?: number;
  attributes: Record<string, AttrValue>;
};
