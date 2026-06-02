// Attachments — an optional other system that physically connects at a defined interface.

import type { AttrValue } from './common';
import type { Visual } from './visual';
import type { Rule } from './rule';

export type ConnectionPoint =
  | { kind: 'head' }
  | { kind: 'foot' }
  | { kind: 'segment_end'; segment_index: number }
  | { kind: 'position'; value: number }
  | { kind: 'start' }
  | { kind: 'end' };

export type ConnectionConstraint =
  | { kind: 'height_match'; from_field: string; to_field: string; tolerance?: number }
  | { kind: 'alignment'; axis: 'x' | 'y' | 'z' }
  | { kind: 'clearance'; min: number };

export type PresetTarget =
  | { kind: 'variant' }
  | { kind: 'criterion'; name: string }
  | { kind: 'modifier'; name: string }
  | { kind: 'property_input'; property: string; input: string }
  | { kind: 'primitive_input_field'; field: string };

export type AttachmentPreset = { target: PresetTarget; value: AttrValue; locked: boolean };

export type DerivedBinding = { target: PresetTarget; source: ConnectionConstraint };

export type Suppression = {
  member: 'this' | 'attached';
  property_name: string;
  region?: 'at_connection' | 'whole';
};

export type Attachment = {
  id: string;
  visual?: Visual;
  role_label: string;
  attached_system_id: string;
  model_binding:
    | { kind: 'pinned'; model_id: string }
    | { kind: 'choose_at_takeoff'; default_model_id?: string };
  connection: {
    from_point: ConnectionPoint;
    to_point: ConnectionPoint;
    constraints: ConnectionConstraint[];
  };
  presets: AttachmentPreset[];
  derived_bindings: DerivedBinding[];
  suppressions: Suppression[];
  optional: boolean;
  default_included: boolean;
};

/** Connection materials (gate, transition bracket) are MODEL-level rules. */
export type ConnectionMaterialRule = { attachment_id: string; material_id: string; rule: Rule };
