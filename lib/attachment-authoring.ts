// Pure builders for authoring attachments in the UI. Each produces a minimal,
// type-valid default for its discriminated-union kind so the editor can append
// rows that already round-trip through saveSystem and the engine.

import type { Attachment, ConnectionConstraint, ConnectionPoint, PresetTarget } from '@/lib/types';

export function blankConnectionPoint(kind: ConnectionPoint['kind']): ConnectionPoint {
  switch (kind) {
    case 'segment_end': return { kind, segment_index: 0 };
    case 'position': return { kind, value: 0 };
    default: return { kind }; // head | foot | start | end
  }
}

export function blankConstraint(kind: ConnectionConstraint['kind']): ConnectionConstraint {
  switch (kind) {
    case 'height_match': return { kind, from_field: 'chain.adjusted', to_field: 'deck_height' };
    case 'alignment': return { kind, axis: 'x' };
    case 'clearance': return { kind, min: 0 };
  }
}

export function blankPresetTarget(kind: PresetTarget['kind']): PresetTarget {
  switch (kind) {
    case 'criterion': return { kind, name: 'criterion' };
    case 'modifier': return { kind, name: 'modifier' };
    case 'property_input': return { kind, property: 'property', input: 'input' };
    case 'primitive_input_field': return { kind, field: 'total' };
    case 'variant': return { kind };
  }
}

export function makeBlankAttachment(id: string, attachedSystemId: string): Attachment {
  return {
    id,
    role_label: 'New attachment',
    attached_system_id: attachedSystemId,
    model_binding: { kind: 'choose_at_takeoff' },
    connection: { from_point: { kind: 'head' }, to_point: { kind: 'foot' }, constraints: [] },
    presets: [],
    derived_bindings: [],
    suppressions: [],
    optional: false,
    default_included: true,
  };
}
