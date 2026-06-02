// Starter seed — a compact, type-valid dataset adapted from the prototype's
// data.jsx, covering all 8 collections so screens have data to render. Expanded
// (full 28 materials / 4 systems / 12 variants …) as later briefs need it.

import type {
  InventoryItem,
  Material,
  Project,
  SubAssembly,
  System,
  Variant,
} from '@/lib/types';

const materials: Material[] = [
  { id: 'mat-stile', sku: 'VEC-LDR-S-3000-AN', name: 'Ladder stile · 3000 mm · anodized', vendor: 'Vectaco', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: true, stock_options: [3000], cut_allowance: 3, min_offcut_to_retain: 300 },
  { id: 'mat-rung', sku: 'VEC-LDR-RUNG-AN', name: 'Rung · anodized', vendor: 'Vectaco', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-cage', sku: 'VEC-LDR-CAGE-AN', name: 'Cage hoop · anodized', vendor: 'Vectaco', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-bracket', sku: 'VEC-BRK-S', name: 'Wall bracket · standard', vendor: 'Vectaco', unit: 'ea', category: 'Mounting', attributes: {}, is_cuttable: false },
  { id: 'mat-rail-top', sku: 'VEC-RAIL-T-3000-AN', name: 'Top rail · 3000 mm · anodized', vendor: 'Vectaco', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: true, stock_options: [3000, 6000], cut_allowance: 3 },
  { id: 'mat-upright', sku: 'VEC-UPR-FS-AN', name: 'Guardrail upright · floor fix', vendor: 'Vectaco', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-anchor', sku: 'VEC-ANC-SS', name: 'Anchor point · stainless', vendor: 'Vectaco', unit: 'ea', category: 'Anchor', attributes: {}, is_cuttable: false },
];

const variants: Variant[] = [
  {
    id: 'var-cage', name: 'Cage ladder', common_attributes: { has_cage: true },
    current_version: 1, status: 'active', used_in_systems: ['sys-ladder'],
    versions: [{ version: 1, published_at: 0, changelog: 'Initial', common_attributes: { has_cage: true } }],
  },
  {
    id: 'var-ss316', name: 'SS316 Coastal', common_attributes: { material_finish: 'ss316' },
    current_version: 1, status: 'active', used_in_systems: ['sys-guardrail'],
    versions: [{ version: 1, published_at: 0, changelog: 'Initial', common_attributes: { material_finish: 'ss316' } }],
  },
];

const subAssemblies: SubAssembly[] = [
  {
    id: 'sa-wall-bracket', name: 'Wall bracket assembly', category: 'Mounting',
    current_version: 1, status: 'active',
    parameters: [{ name: 'bracket_length', type: { kind: 'distance' }, required: true }],
    materials: [
      { id: 'sam-bracket', material_id: 'mat-bracket', rule: { qty_kind: 'fixed', qty: 1, applies_when: { variants: [], criteria: {} } } },
    ],
    versions: [{ version: 1, published_at: 0, changelog: 'Initial', parameters: [{ name: 'bracket_length', type: { kind: 'distance' }, required: true }], materials: [] }],
  },
];

const systems: System[] = [
  {
    id: 'sys-ladder', name: 'Vertical access ladder', primitive: { kind: 'height' },
    modifiers: [
      { name: 'handhold_extension', group: 'geometric', type: { kind: 'distance' }, enabled: true, default_value: 250 },
      { name: 'flight_max_height', group: 'compliance', type: { kind: 'distance' }, enabled: true, default_value: 6000 },
    ],
    variants: {
      attribute_columns: [{ name: 'has_cage', type: { kind: 'bool' } }],
      rows: [
        { kind: 'local', name: 'Standard', attributes: { has_cage: false } },
        { kind: 'library', variant_id: 'var-cage', pinned_version: 1 },
      ],
    },
    criteria: [{ library_id: 'compliance_code', default_value: 'NF E85-016' }, { library_id: 'material_finish', default_value: 'anodized' }],
    properties: [
      { catalog_id: 'rungs', name: 'rungs', archetype: 'spacing', inputs: [{ name: 'spacing', label: 'Spacing', type: { kind: 'distance' }, required: true, default: 280 }], scope: 'per_segment' },
      { catalog_id: 'cage_hoops', name: 'cage_hoops', archetype: 'threshold', inputs: [], scope: { kind: 'per_span', span_name: 'cage_zone' } },
    ],
    models: [
      {
        id: 'mdl-ladder-nf', name: 'NF E85-016 cage ladder', system_id: 'sys-ladder', status: 'published',
        modifier_defaults: { handhold_extension: 250 }, sub_assembly_uses: [], sku_lookups: [], criteria_driven_defaults: [],
        materials: [
          { id: 'mm-rung', material_id: 'mat-rung', rule: { qty_kind: 'per', per: { kind: 'property', name: 'rungs' }, applies_when: { variants: [], criteria: {} } } },
          { id: 'mm-cage', material_id: 'mat-cage', rule: { qty_kind: 'per', per: { kind: 'property', name: 'cage_hoops' }, applies_when: { variants: ['Cage ladder'], criteria: {} } } },
        ],
      },
    ],
  },
  {
    id: 'sys-guardrail', name: 'Roof-edge guardrail', primitive: { kind: 'length', segmentable: true },
    modifiers: [{ name: 'start_offset', group: 'geometric', type: { kind: 'distance' }, enabled: true, default_value: 0 }],
    variants: {
      attribute_columns: [{ name: 'material_finish', type: { kind: 'enum', values: ['anodized', 'ss316'] } }],
      rows: [{ kind: 'library', variant_id: 'var-ss316', pinned_version: 1 }],
    },
    criteria: [{ library_id: 'compliance_code', default_value: 'EN_ISO_14122-3' }],
    properties: [
      { catalog_id: 'intermediate', name: 'intermediate', archetype: 'spacing', inputs: [{ name: 'spacing', label: 'Spacing', type: { kind: 'distance' }, required: true, default: 1500 }], scope: 'per_segment' },
    ],
    models: [
      {
        id: 'mdl-guardrail-coastal', name: 'Coastal SS316', system_id: 'sys-guardrail', status: 'published',
        modifier_defaults: {}, sub_assembly_uses: [], sku_lookups: [], criteria_driven_defaults: [],
        materials: [
          { id: 'mm-upright', material_id: 'mat-upright', rule: { qty_kind: 'per', per: { kind: 'property', name: 'intermediate' }, applies_when: { variants: [], criteria: {} } } },
          { id: 'mm-railtop', material_id: 'mat-rail-top', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: { variants: [], criteria: {} } } },
        ],
      },
    ],
  },
  {
    id: 'sys-anchors', name: 'Anchor points · plan', primitive: { kind: 'count' },
    modifiers: [],
    variants: { attribute_columns: [], rows: [{ kind: 'local', name: 'Standard', attributes: {} }] },
    criteria: [{ library_id: 'substrate', default_value: 'concrete' }],
    properties: [{ catalog_id: 'anchors', name: 'anchors', archetype: 'count', inputs: [], scope: 'set_level' }],
    models: [
      {
        id: 'mdl-anchors-ss', name: 'Stainless anchors', system_id: 'sys-anchors', status: 'published',
        modifier_defaults: {}, sub_assembly_uses: [], sku_lookups: [], criteria_driven_defaults: [],
        materials: [{ id: 'mm-anchor', material_id: 'mat-anchor', rule: { qty_kind: 'per', per: { kind: 'primitive_input' }, applies_when: { variants: [], criteria: {} } } }],
      },
    ],
  },
];

const inventory: InventoryItem[] = [
  { id: 'inv-1', material_id: 'mat-stile', length: 3000, quantity: 4, origin: { kind: 'purchased', purchase_order: 'PO-2291', purchased_at: 0 }, status: 'available' },
  { id: 'inv-2', material_id: 'mat-rail-top', length: 1850, quantity: 1, origin: { kind: 'offcut', source_takeoff_id: 'tko-guardrail', source_stock_id: 'st-7' }, status: 'available' },
];

const projects: Project[] = [
  {
    id: 'prj-westfield', name: 'Westfield Sky Garden L08', client: 'Westfield', location: 'Sydney', created_at: 0,
    takeoffs: [
      {
        id: 'tko-ladder', name: 'Plant access ladder · L1→L4', system_id: 'sys-ladder', model_id: 'mdl-ladder-nf',
        variant_choice: { source_ref: { kind: 'library', variant_id: 'var-cage', pinned_version: 1 }, snapshot_version: 1, attributes: { has_cage: true } },
        criteria_values: { compliance_code: 'NF E85-016', material_finish: 'anodized' },
        modifier_values: {}, primitive_input: 9200, property_values: { rungs: { spacing: 280 } },
      },
    ],
  },
];

export const seed = { projects, systems, materials, variants, subAssemblies, inventory };
