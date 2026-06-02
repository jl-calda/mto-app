// Take-off — a user filling in answers and getting an MTO. Lives in a project.

import type { Visual } from './visual';
import type { VariantSnapshot } from './variant';
import type { CanonicalGeometry } from './geometry';
import type { MtoLine } from './mto';
import type { Warning } from './warning';

export type AttachmentInstance = {
  attachment_id: string;
  included: boolean;
  chosen_model_id?: string;
  variant_choice?: VariantSnapshot;
  criteria_values?: Record<string, unknown>;
  modifier_values?: Record<string, unknown>;
  property_values?: Record<string, unknown>;
  primitive_input?: unknown;
};

export type Takeoff = {
  id: string;
  visual?: Visual;
  name: string;
  system_id: string;
  model_id: string;
  model_version?: number; // v3
  variant_choice: VariantSnapshot;
  criteria_values: Record<string, unknown>;
  modifier_values: Record<string, unknown>;
  primitive_input: unknown; // LengthInput | number | etc.
  property_values: Record<string, unknown>;
  attachments?: AttachmentInstance[];
  computed_geometry?: CanonicalGeometry;
  mto?: MtoLine[];
  warnings?: Warning[];
  reserved_inventory_ids?: string[]; // v3
};
