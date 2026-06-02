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
  { id: 'mat-stringer', sku: 'VEC-LDR-STR-AN', name: 'Cage stringer · anodized', vendor: 'Vectaco', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-restplatform', sku: 'VEC-LDR-RP-AN', name: 'Rest platform', vendor: 'Vectaco', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-cert', sku: 'VEC-CERT-NF', name: 'Compliance certificate · NF E85-016', vendor: 'Vectaco', unit: 'ea', category: 'Compliance', attributes: {}, is_cuttable: false },
  { id: 'mat-lbar', sku: 'VEC-LBAR-6000', name: 'L-bar · 6000 mm (cut to length)', vendor: 'Vectaco', unit: 'ea', category: 'Mounting', attributes: {}, is_cuttable: true, stock_options: [6000], cut_allowance: 3, min_offcut_to_retain: 300 },
  { id: 'mat-fastener', sku: 'VEC-FX-M10', name: 'Anchor bolt · M10×80 · SS', vendor: 'Vectaco', unit: 'ea', category: 'Mounting', attributes: {}, is_cuttable: false },
  { id: 'mat-gate', sku: 'VEC-GATE-SC', name: 'Self-closing safety gate', vendor: 'Vectaco', unit: 'ea', category: 'Mounting', attributes: {}, is_cuttable: false },
  { id: 'mat-grating', sku: 'VEC-WALK-GRT-AN', name: 'Walkway grating panel · anodized', vendor: 'Vectaco', unit: 'ea', category: 'Walkway', attributes: {}, is_cuttable: false },
  { id: 'mat-walk-rail', sku: 'VEC-WALK-RAIL-3000', name: 'Walkway handrail · 3000 mm', vendor: 'Vectaco', unit: 'ea', category: 'Walkway', attributes: {}, is_cuttable: true, stock_options: [3000, 6000], cut_allowance: 3 },
  { id: 'mat-walk-post', sku: 'VEC-WALK-POST', name: 'Walkway handrail post', vendor: 'Vectaco', unit: 'ea', category: 'Walkway', attributes: {}, is_cuttable: false },
];

const variants: Variant[] = [
  {
    id: 'var-cage', name: 'Cage ladder', common_attributes: { has_cage: true },
    current_version: 1, status: 'active', used_in_systems: ['sys-ladder'],
    versions: [{ version: 1, published_at: 0, changelog: 'Initial', common_attributes: { has_cage: true } }],
  },
  {
    id: 'var-ss316', name: 'SS316 Coastal', common_attributes: { material_finish: 'ss316' },
    current_version: 2, status: 'active', used_in_systems: ['sys-guardrail'],
    versions: [
      { version: 1, published_at: 0, changelog: 'Initial', common_attributes: { material_finish: 'ss316' } },
      { version: 2, published_at: 0, changelog: 'Add 316L weld spec', common_attributes: { material_finish: 'ss316' } },
    ],
  },
];

const wallBracketParams = [
  { name: 'count', type: { kind: 'integer' } as const, required: true, description: 'Number of bracket positions to mount' },
  { name: 'bracket_length', type: { kind: 'distance' } as const, required: true, default: 800, description: 'Cut length of the L-bar mounting bar' },
];
const wallBracketMaterials = [
  { id: 'sam-bracket', material_id: 'mat-bracket', rule: { qty_kind: 'per' as const, qty: 1, per: { kind: 'parameter' as const, name: 'count' }, applies_when: { variants: [], criteria: {} } } },
  { id: 'sam-fastener', material_id: 'mat-fastener', rule: { qty_kind: 'per' as const, qty: 2, per: { kind: 'parameter' as const, name: 'count' }, applies_when: { variants: [], criteria: {} } } },
  { id: 'sam-lbar', material_id: 'mat-lbar', rule: { qty_kind: 'cut' as const, cut_length_param: 'bracket_length', per: { kind: 'parameter' as const, name: 'count' }, applies_when: { variants: [], criteria: {} } } },
];

const subAssemblies: SubAssembly[] = [
  {
    id: 'sa-wall-bracket', name: 'Wall bracket assembly', category: 'Mounting',
    description: 'A mounting position: one wall bracket, two anchor bolts, and a cut L-bar packer. Scales by the bound `count` parameter.',
    current_version: 1, status: 'active',
    parameters: wallBracketParams,
    materials: wallBracketMaterials,
    versions: [{ version: 1, published_at: 0, changelog: 'Initial', parameters: wallBracketParams, materials: wallBracketMaterials }],
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
        { kind: 'local', name: 'Cage ladder', attributes: { has_cage: true } },
        { kind: 'local', name: 'Side-exit cage', attributes: { has_cage: true, side_exit: true } },
      ],
    },
    criteria: [{ library_id: 'compliance_code', default_value: 'NF E85-016' }, { library_id: 'material_finish', default_value: 'anodized' }],
    properties: [
      { catalog_id: 'rungs', name: 'rungs', archetype: 'spacing', inputs: [{ name: 'spacing', label: 'Spacing', type: { kind: 'distance' }, required: true, default: 280 }], scope: 'per_segment' },
      { catalog_id: 'cage_hoops', name: 'cage_hoops', archetype: 'threshold', inputs: [{ name: 'threshold', label: 'Threshold', type: { kind: 'distance' }, required: true, default: 3000 }, { name: 'hoop_spacing', label: 'Hoop spacing', type: { kind: 'distance' }, required: true, default: 280 }], scope: { kind: 'per_span', span_name: 'cage_zone' } },
      { catalog_id: 'mounting_brackets', name: 'mounting_brackets', archetype: 'spacing', inputs: [{ name: 'spacing', label: 'Spacing', type: { kind: 'distance' }, required: true, default: 1600 }], scope: 'per_mount_surface' },
    ],
    attachments: [
      {
        id: 'att-walkway', role_label: 'Top walkway', attached_system_id: 'sys-walkway',
        model_binding: { kind: 'pinned', model_id: 'mdl-walkway-std' },
        connection: {
          from_point: { kind: 'head' },
          to_point: { kind: 'start' },
          constraints: [{ kind: 'height_match', from_field: 'chain.adjusted', to_field: 'deck_height' }],
        },
        // walkway post spacing is fixed by the host design (locked); the deck height
        // is derived from the ladder climb and pushed into the attached system.
        presets: [{ target: { kind: 'property_input', property: 'handrail_posts', input: 'spacing' }, value: 1500, locked: true }],
        derived_bindings: [{ target: { kind: 'modifier', name: 'deck_height' }, source: { kind: 'height_match', from_field: 'chain.adjusted', to_field: 'deck_height' } }],
        // at the joint the top cage hoop and the walkway's end post/leg are redundant.
        suppressions: [
          { member: 'this', property_name: 'cage_hoops', region: 'at_connection' },
          { member: 'attached', property_name: 'handrail_posts', region: 'at_connection' },
        ],
        optional: true, default_included: true,
      },
    ],
    models: [
      {
        id: 'mdl-ladder-nf', name: 'NF E85-016 cage ladder', system_id: 'sys-ladder', status: 'published',
        modifier_defaults: { handhold_extension: 250 }, sku_lookups: [], criteria_driven_defaults: [],
        // The bracket mounting is a reusable sub-assembly: bracket + bolts + cut L-bar,
        // scaled by `count` ← the mounting_brackets property, with bracket_length pinned.
        sub_assembly_uses: [
          {
            id: 'sau-wall-bracket', sub_assembly_id: 'sa-wall-bracket', pinned_version: 1, scope: 'per_mount_surface',
            parameter_bindings: {
              count: { kind: 'property_ref', property_name: 'mounting_brackets' },
              bracket_length: { kind: 'literal', value: 800 },
            },
          },
        ],
        materials: [
          { id: 'mm-stile', material_id: 'mat-stile', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: { variants: [], criteria: {} } } },
          { id: 'mm-rung', material_id: 'mat-rung', rule: { qty_kind: 'per', per: { kind: 'property', name: 'rungs' }, applies_when: { variants: [], criteria: {} } } },
          { id: 'mm-cage', material_id: 'mat-cage', rule: { qty_kind: 'per', per: { kind: 'property', name: 'cage_hoops' }, applies_when: { variants: ['Cage ladder', 'Side-exit cage'], criteria: {} } } },
          { id: 'mm-stringer', material_id: 'mat-stringer', rule: { qty_kind: 'fixed', qty: 4, applies_when: { variants: ['Cage ladder', 'Side-exit cage'], criteria: {} } } },
          { id: 'mm-restplatform', material_id: 'mat-restplatform', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'rest_platforms' }, applies_when: { variants: [], criteria: {} } } },
          { id: 'mm-cert', material_id: 'mat-cert', rule: { qty_kind: 'fixed', qty: 1, applies_when: { variants: [], criteria: {} } } },
        ],
        // connection materials are MODEL-level rules keyed by attachment — a gate at
        // the landing + transition bars cut from the SAME L-bar pool as everything else.
        connection_materials: [
          { attachment_id: 'att-walkway', material_id: 'mat-gate', rule: { qty_kind: 'fixed', qty: 1, applies_when: { variants: [], criteria: {} } } },
          { attachment_id: 'att-walkway', material_id: 'mat-lbar', rule: { qty_kind: 'cut', cut_length: 450, per: { kind: 'derived', name: 'free_ends_count' }, applies_when: { variants: [], criteria: {} } } },
        ],
      },
    ],
  },
  {
    id: 'sys-walkway', name: 'Elevated walkway', primitive: { kind: 'length', segmentable: true },
    modifiers: [
      { name: 'start_offset', group: 'geometric', type: { kind: 'distance' }, enabled: true, default_value: 0 },
      { name: 'deck_height', group: 'environmental', type: { kind: 'distance' }, enabled: true, default_value: 0 },
    ],
    variants: { attribute_columns: [], rows: [{ kind: 'local', name: 'Standard', attributes: {} }] },
    criteria: [{ library_id: 'compliance_code', default_value: 'EN_ISO_14122-3' }],
    properties: [
      { catalog_id: 'walk_posts', name: 'handrail_posts', archetype: 'spacing', inputs: [{ name: 'spacing', label: 'Post spacing', type: { kind: 'distance' }, required: true, default: 1500 }], scope: 'per_segment' },
    ],
    models: [
      {
        id: 'mdl-walkway-std', name: 'Standard grated walkway', system_id: 'sys-walkway', status: 'published',
        modifier_defaults: {}, sub_assembly_uses: [], sku_lookups: [], criteria_driven_defaults: [],
        materials: [
          { id: 'mm-walk-grating', material_id: 'mat-grating', rule: { qty_kind: 'per_length', qty: 1, applies_when: { variants: [], criteria: {} } } },
          { id: 'mm-walk-rail', material_id: 'mat-walk-rail', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: { variants: [], criteria: {} } } },
          { id: 'mm-walk-post', material_id: 'mat-walk-post', rule: { qty_kind: 'per', per: { kind: 'property', name: 'handrail_posts' }, applies_when: { variants: [], criteria: {} } } },
          { id: 'mm-walk-leg', material_id: 'mat-lbar', rule: { qty_kind: 'cut', cut_length: 600, per: { kind: 'property', name: 'handrail_posts' }, applies_when: { variants: [], criteria: {} } } },
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
          // per_junction rule: a corner bracket per corner (0 for single-segment runs)
          { id: 'mm-corner', material_id: 'mat-bracket', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'junction_corner' }, applies_when: { variants: [], criteria: {} } } },
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
        variant_choice: { source_ref: { kind: 'local', name: 'Cage ladder', attributes: { has_cage: true } }, attributes: { has_cage: true } },
        criteria_values: { compliance_code: 'NF E85-016', material_finish: 'anodized' },
        modifier_values: {}, primitive_input: 9200, property_values: { rungs: { spacing: 280 } },
      },
      {
        id: 'tko-guardrail', name: 'East elevation guardrail', system_id: 'sys-guardrail', model_id: 'mdl-guardrail-coastal',
        // pins var-ss316 @ v1; the library variant is now v2 → "review needed" (stale snapshot)
        variant_choice: { source_ref: { kind: 'library', variant_id: 'var-ss316', pinned_version: 1 }, snapshot_version: 1, attributes: { material_finish: 'ss316' } },
        criteria_values: { compliance_code: 'EN_ISO_14122-3', material_finish: 'ss316' },
        modifier_values: {}, primitive_input: { mode: 'single', total: 24000 }, property_values: {},
      },
      {
        id: 'tko-anchors', name: 'Roof anchor points', system_id: 'sys-anchors', model_id: 'mdl-anchors-ss',
        variant_choice: { source_ref: { kind: 'local', name: 'Standard', attributes: {} }, attributes: {} },
        criteria_values: { substrate: 'concrete', compliance_code: 'EN_795' },
        modifier_values: {}, primitive_input: 12, property_values: {},
      },
    ],
  },
];

export const seed = { projects, systems, materials, variants, subAssemblies, inventory };
