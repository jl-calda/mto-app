// Modifiers — system-declared knobs resolved System → Model → Project → Take-off.

import type { AttrValue } from './common';

export type Modifier = {
  name: string;
  group: 'geometric' | 'mounting' | 'stock' | 'compliance' | 'environmental';
  type: ModifierType;
  enabled: boolean;
  default_value?: AttrValue;
  editable_at_takeoff?: boolean;
};

export type ModifierType =
  | { kind: 'distance' }
  | { kind: 'banded_distance'; bands: { range: [number, number]; sku_key: string }[] }
  | { kind: 'bool' }
  | { kind: 'percentage' }
  | { kind: 'enum'; values: string[] }
  | { kind: 'enum_with_attributes'; values: { name: string; attrs: Record<string, AttrValue> }[] }
  | { kind: 'discrete_set'; element_type: ModifierType }
  | { kind: 'support_grid' };
