// Worked examples from the "MTO App — Worked Examples Guide": three real
// safety-access products modelled on the engine abstraction. Catalogue refs are
// illustrative. Merged into the seed by ./index.ts.

import type { Material, SubAssembly, System } from '@/lib/types';

// ── materials ───────────────────────────────────────────
export const exampleMaterials: Material[] = [
  // Securope
  { id: 'mat-sec-cable', sku: 'LDV-CABLE-8', name: 'SS316 7×19 cable Ø8', vendor: 'FallProtec', unit: 'm', category: 'Lifeline', attributes: {}, is_cuttable: true, stock_options: [50000], cut_allowance: 0 },
  { id: 'mat-sec-neo', sku: 'LDV043', name: 'NEO intermediate anchor', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-end', sku: 'LDV054', name: 'End anchor', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-tensioner', sku: 'LDV134', name: 'Energy-absorbing tensioner', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-tensioner-plain', sku: 'LDV134-P', name: 'Plain tensioner', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-turnbuckle', sku: 'LDV138', name: 'Turnbuckle (closed loop)', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-crimp', sku: 'LDV008', name: 'Crimping ring 100 mm', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-corner', sku: 'LDV-CORNER', name: 'Corner plate + cable guide', vendor: 'FallProtec', unit: 'set', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-trav-open', sku: '13627', name: 'Openable traveller', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-trav-captive', sku: '13687', name: 'Captive traveller', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-idplate', sku: 'LDV-IDP', name: 'Identification plate', vendor: 'FallProtec', unit: 'ea', category: 'Lifeline', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-deckbracket', sku: 'LDV-MDB', name: 'Metal-deck fixing bracket', vendor: 'FallProtec', unit: 'ea', category: 'Fixing', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-concanchor', sku: 'LDV-CON', name: 'Concrete anchor set', vendor: 'FallProtec', unit: 'set', category: 'Fixing', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-seamclamp', sku: 'LDV-SEAM', name: 'Standing-seam clamp', vendor: 'FallProtec', unit: 'ea', category: 'Fixing', attributes: {}, is_cuttable: false },
  { id: 'mat-sec-epdm', sku: 'LDV-EPDM', name: 'EPDM sealing tape', vendor: 'FallProtec', unit: 'ea', category: 'Fixing', attributes: {}, is_cuttable: false },

  // Vectaladder
  { id: 'mat-vl-rung', sku: 'RUNG-30x30-AL', name: 'Non-slip rung 30×30', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-stile', sku: 'STILE-AL', name: 'Upright 65×24 (stock)', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: true, stock_options: [2521, 3081, 3641, 4201, 4761, 5321, 5881, 6441], cut_allowance: 0 },
  { id: 'mat-vl-splice', sku: 'SPLICE-AL', name: 'Splice kit', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-bracket', sku: 'BRK-AL', name: 'Wall bracket pair', vendor: 'ALSOLU', unit: 'pr', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-cage-hoop', sku: 'CAGE-HOOP-AL', name: 'Cage hoop', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-cage-band', sku: 'CAGE-BAND-AL', name: 'Cage longitudinal band', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-exit', sku: 'EXIT-LANDING', name: 'Exit landing', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-gate', sku: '02770', name: 'Safety door', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-restplatform', sku: 'REST-PLATFORM', name: 'Change-of-flight platform', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-deckfix', sku: '03177', name: 'Metal-deck fixation plate', vendor: 'ALSOLU', unit: 'ea', category: 'Fixing', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-plate', sku: 'VL-PLATE', name: 'Compliance plate', vendor: 'ALSOLU', unit: 'ea', category: 'Compliance', attributes: {}, is_cuttable: false },
  { id: 'mat-vl-jointkit', sku: '03008', name: 'Ladder/guardrail joint kit', vendor: 'ALSOLU', unit: 'ea', category: 'Ladder', attributes: {}, is_cuttable: false },

  // EVO guardrail
  { id: 'mat-evo-upr-str', sku: 'UPR-STR-AL', name: 'Straight upright', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-upr-30', sku: 'UPR-30-AL', name: '30° inclined upright', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-handrail', sku: 'RAIL-45-AL', name: 'Handrail Ø45 (3 m)', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: true, stock_options: [3000], cut_allowance: 0 },
  { id: 'mat-evo-kneerail', sku: 'RAIL-35-AL', name: 'Knee rail Ø35 (3 m)', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: true, stock_options: [3000], cut_allowance: 0 },
  { id: 'mat-evo-base', sku: 'BASE-AL', name: 'Guardrail base', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-cw', sku: '03468', name: 'Counterweight 12.5 kg', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-corner', sku: 'EVO-CORNER', name: 'Corner kit', vendor: 'ALSOLU', unit: 'set', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-endcap', sku: 'CAP-AL', name: 'Rail end cap', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-toeboard', sku: 'TOE-150-AL', name: 'Toeboard H150 (3 m)', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: true, stock_options: [3000], cut_allowance: 0 },
  { id: 'mat-evo-toecorner', sku: '08869', name: 'Toeboard corner kit', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-toebracket', sku: '08637', name: 'Toeboard bracket', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-gate', sku: '0733603', name: 'Safety gate H580', vendor: 'ALSOLU', unit: 'ea', category: 'Guardrail', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-zscrew', sku: 'Z-SCREW', name: 'Z-plate screw set', vendor: 'ALSOLU', unit: 'set', category: 'Fixing', attributes: {}, is_cuttable: false },
  { id: 'mat-evo-wpcap', sku: 'WP-CAP', name: 'Waterproofing cap', vendor: 'ALSOLU', unit: 'ea', category: 'Fixing', attributes: {}, is_cuttable: false },
];

// ── sub-assemblies ──────────────────────────────────────
const aw = { variants: [], criteria: {} };
export const exampleSubAssemblies: SubAssembly[] = [
  {
    id: 'sa-sec-fixing', name: 'Securope anchor fixing', category: 'Fixing',
    description: 'Per-intermediate substrate fixing: bracket/clamp/anchor + optional EPDM seal.',
    current_version: 1, status: 'active',
    parameters: [
      { name: 'count', type: { kind: 'integer' }, required: true },
      { name: 'sealing', type: { kind: 'bool' }, required: false, default: true },
    ],
    materials: [
      { id: 'saf-deck', material_id: 'mat-sec-deckbracket', rule: { qty_kind: 'per', per: { kind: 'parameter', name: 'count' }, applies_when: { variants: [], criteria: {}, modifiers: { substrate: ['metal_deck'] } } } },
      { id: 'saf-conc', material_id: 'mat-sec-concanchor', rule: { qty_kind: 'per', per: { kind: 'parameter', name: 'count' }, applies_when: { variants: [], criteria: {}, modifiers: { substrate: ['concrete'] } } } },
      { id: 'saf-seam', material_id: 'mat-sec-seamclamp', rule: { qty_kind: 'per', per: { kind: 'parameter', name: 'count' }, applies_when: { variants: [], criteria: {}, modifiers: { substrate: ['standing_seam'] } } } },
      { id: 'saf-epdm', material_id: 'mat-sec-epdm', rule: { qty_kind: 'per', per: { kind: 'parameter', name: 'count' }, applies_when: { variants: [], criteria: { environment: ['coastal', 'inland'] } } } },
    ],
    versions: [{ version: 1, published_at: 0, changelog: 'Initial', parameters: [], materials: [] }],
  },
  {
    id: 'sa-evo-zfix', name: 'EVO Z-plate fixing', category: 'Fixing',
    description: 'Per-upright Z-plate fixing: screws + waterproofing cap.',
    current_version: 1, status: 'active',
    parameters: [{ name: 'count', type: { kind: 'integer' }, required: true }],
    materials: [
      { id: 'zf-screw', material_id: 'mat-evo-zscrew', rule: { qty_kind: 'per', per: { kind: 'parameter', name: 'count' }, applies_when: aw } },
      { id: 'zf-cap', material_id: 'mat-evo-wpcap', rule: { qty_kind: 'per', per: { kind: 'parameter', name: 'count' }, applies_when: aw } },
    ],
    versions: [{ version: 1, published_at: 0, changelog: 'Initial', parameters: [], materials: [] }],
  },
];

// ── systems ─────────────────────────────────────────────
export const exampleSystems: System[] = [
  // 1 — Securope horizontal lifeline (length, segmentable)
  {
    id: 'sys-securope', name: 'Securope horizontal lifeline', description: 'EN 795:2012 Type C cable lifeline.',
    primitive: { kind: 'length', segmentable: true },
    modifiers: [
      { name: 'configuration', group: 'mounting', type: { kind: 'enum', values: ['floor', 'wall', 'overhead'] }, enabled: true, default_value: 'floor' },
      { name: 'substrate', group: 'mounting', type: { kind: 'enum', values: ['concrete', 'standing_seam', 'metal_deck', 'steel_beam'] }, enabled: true, default_value: 'metal_deck' },
      { name: 'support_grid', group: 'mounting', type: { kind: 'support_grid' }, enabled: true, default_value: null },
      { name: 'max_span', group: 'stock', type: { kind: 'distance' }, enabled: true, default_value: 10000 },
    ],
    variants: {
      attribute_columns: [{ name: 'traveller_type', type: { kind: 'enum', values: ['captive', 'openable'] } }],
      rows: [
        { kind: 'local', name: 'Standard restraint', attributes: { traveller_type: 'captive', absorber: 'plain' } },
        { kind: 'local', name: 'Fall-arrest', attributes: { traveller_type: 'openable', absorber: 'energy' } },
        { kind: 'local', name: 'Overhead fall-arrest', attributes: { traveller_type: 'openable', absorber: 'inline' } },
      ],
    },
    criteria: [{ library_id: 'compliance_code', default_value: 'EN_795_C' }, { library_id: 'environment', default_value: 'coastal' }],
    properties: [
      { catalog_id: 'intermediate_anchor', name: 'intermediate_anchor', archetype: 'count', inputs: [], scope: 'per_mount_surface', placement_rules: { max_spacing: 10000 } },
      { catalog_id: 'users', name: 'users', archetype: 'count', inputs: [{ name: 'count', label: 'Simultaneous users', type: { kind: 'integer' }, required: true, default: 1 }], scope: 'set_level' },
    ],
    models: [
      {
        id: 'mdl-securope-fa', name: 'Securope SS316 — fall arrest', system_id: 'sys-securope', status: 'published',
        modifier_defaults: {}, sku_lookups: [], criteria_driven_defaults: [],
        sub_assembly_uses: [
          { id: 'su-sec-fix', sub_assembly_id: 'sa-sec-fixing', pinned_version: 1, scope: 'per_mount_surface', parameter_bindings: { count: { kind: 'algorithm_output_ref', algorithm: 'place_supports', field: 'supports' }, sealing: { kind: 'literal', value: true } } },
        ],
        materials: [
          { id: 'sm-cable', material_id: 'mat-sec-cable', rule: { qty_kind: 'per_length', qty: 1, unit: 'm', applies_when: aw } },
          { id: 'sm-neo', material_id: 'mat-sec-neo', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'place_supports', inputs: {} }, applies_when: aw } },
          { id: 'sm-end', material_id: 'mat-sec-end', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'free_ends_count' }, applies_when: aw } },
          { id: 'sm-tens', material_id: 'mat-sec-tensioner', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'free_ends_count' }, applies_when: { variants: ['Fall-arrest', 'Overhead fall-arrest'], criteria: {} } } },
          { id: 'sm-tens-p', material_id: 'mat-sec-tensioner-plain', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'free_ends_count' }, applies_when: { variants: ['Standard restraint'], criteria: {} } } },
          { id: 'sm-turn', material_id: 'mat-sec-turnbuckle', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'is_loop' }, applies_when: aw } },
          { id: 'sm-crimp-end', material_id: 'mat-sec-crimp', rule: { qty_kind: 'per', qty: 2, per: { kind: 'derived', name: 'free_ends_count' }, applies_when: aw } },
          { id: 'sm-crimp-cnr', material_id: 'mat-sec-crimp', rule: { qty_kind: 'per', qty: 1, per: { kind: 'derived', name: 'junction_corner' }, applies_when: aw } },
          { id: 'sm-corner', material_id: 'mat-sec-corner', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'junction_corner' }, applies_when: aw } },
          { id: 'sm-trav', material_id: 'mat-sec-trav-open', rule: { qty_kind: 'per', per: { kind: 'property', name: 'users' }, applies_when: { variants: ['Fall-arrest', 'Overhead fall-arrest'], criteria: {} } } },
          { id: 'sm-trav-c', material_id: 'mat-sec-trav-captive', rule: { qty_kind: 'per', per: { kind: 'property', name: 'users' }, applies_when: { variants: ['Standard restraint'], criteria: {} } } },
          { id: 'sm-idp', material_id: 'mat-sec-idplate', rule: { qty_kind: 'fixed', qty: 1, applies_when: aw } },
        ],
      },
    ],
  },

  // 2 — Vectaladder cage ladder (height) — with a top-walkway attachment to EVO
  {
    id: 'sys-vectaladder', name: 'Vectaladder cage ladder', description: 'EN ISO 14122-4 / NF E85-016 fixed ladder.',
    primitive: { kind: 'height' },
    modifiers: [
      { name: 'wall_offset', group: 'mounting', type: { kind: 'banded_distance', bands: [{ range: [205, 470], sku_key: '205-470' }, { range: [471, 750], sku_key: '471-750' }] }, enabled: true, default_value: 210 },
      { name: 'substrate', group: 'mounting', type: { kind: 'enum', values: ['concrete', 'metal_deck', 'steel'] }, enabled: true, default_value: 'concrete' },
      { name: 'support_grid', group: 'mounting', type: { kind: 'support_grid' }, enabled: true, default_value: null },
      { name: 'flight_max_height', group: 'compliance', type: { kind: 'distance' }, enabled: true, default_value: 8000 },
    ],
    variants: {
      attribute_columns: [{ name: 'has_cage', type: { kind: 'bool' } }],
      rows: [
        { kind: 'local', name: 'Plain ladder', attributes: { has_cage: false, exit_type: 'none' } },
        { kind: 'local', name: 'Cage ladder', attributes: { has_cage: true, exit_type: 'exit_landing' } },
        { kind: 'local', name: 'Side-exit cage', attributes: { has_cage: true, exit_type: 'side_exit' } },
      ],
    },
    criteria: [{ library_id: 'compliance_code', default_value: 'NF_E85-016' }, { library_id: 'material_grade', default_value: 'aluminium' }],
    properties: [
      { catalog_id: 'rungs', name: 'rungs', archetype: 'spacing', inputs: [{ name: 'spacing', label: 'Spacing', type: { kind: 'distance' }, required: true, default: 280 }], scope: 'per_segment' },
      { catalog_id: 'cage_hoops', name: 'cage_hoops', archetype: 'threshold', inputs: [{ name: 'threshold', label: 'Threshold', type: { kind: 'distance' }, required: true, default: 3000 }, { name: 'hoop_spacing', label: 'Hoop spacing', type: { kind: 'distance' }, required: true, default: 300 }], scope: { kind: 'per_span', span_name: 'cage_zone' } },
      { catalog_id: 'brackets', name: 'brackets', archetype: 'count', inputs: [], scope: 'per_mount_surface', placement_rules: { max_spacing: 2000, end_clearance_foot: { max: 300 }, end_clearance_head: { max: 300 }, min_count_in_region: [{ from: 'head', distance: 2000, min: 2 }] } },
      { catalog_id: 'landing_width', name: 'landing_width', archetype: 'count', inputs: [{ name: 'width', label: 'Landing width', type: { kind: 'integer' }, required: true, default: 800 }], scope: 'set_level' },
    ],
    spans: [{ name: 'cage_zone', start: { kind: 'segment_foot', segment_index: 0, offset: 3000 }, end: { kind: 'segment_head', segment_index: 0 }, enabled: true }],
    attachments: [
      {
        id: 'att-vl-walkway', role_label: 'Top walkway + guardrail', attached_system_id: 'sys-evo-guardrail',
        model_binding: { kind: 'pinned', model_id: 'mdl-evo-fs' },
        connection: { from_point: { kind: 'head' }, to_point: { kind: 'start' }, constraints: [{ kind: 'height_match', from_field: 'chain.adjusted', to_field: 'deck_height' }] },
        presets: [], derived_bindings: [],
        suppressions: [],
        optional: true, default_included: false,
      },
    ],
    models: [
      {
        id: 'mdl-vectaladder', name: 'Vectaladder VL-Standard', system_id: 'sys-vectaladder', status: 'published',
        modifier_defaults: {}, sub_assembly_uses: [], criteria_driven_defaults: [],
        connection_materials: [
          { attachment_id: 'att-vl-walkway', material_id: 'mat-vl-jointkit', rule: { qty_kind: 'fixed', qty: 1, applies_when: aw } },
        ],
        sku_lookups: [
          { table_name: 'bracket', columns: ['band', 'substrate'], rows: [
            { keys: ['205-470', 'concrete'], sku: 'BRK-205-CON' }, { keys: ['205-470', 'metal_deck'], sku: 'BRK-205-MD' },
            { keys: ['471-750', 'concrete'], sku: 'BRK-471-CON' }, { keys: ['471-750', 'metal_deck'], sku: 'BRK-471-MD' },
          ], fallback: { sku: 'BRK-AL' } },
          { table_name: 'exit_landing', columns: ['width'], rows: [
            { keys: ['600'], sku: '02415' }, { keys: ['800'], sku: '02662' }, { keys: ['1000'], sku: '02663' },
          ], fallback: { sku: 'EXIT-LANDING' } },
        ],
        materials: [
          { id: 'vm-rung', material_id: 'mat-vl-rung', rule: { qty_kind: 'per', per: { kind: 'property', name: 'rungs' }, applies_when: aw } },
          { id: 'vm-stile', material_id: 'mat-vl-stile', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: aw } },
          { id: 'vm-splice', material_id: 'mat-vl-splice', rule: { qty_kind: 'per', qty: 2, per: { kind: 'algorithm_output', algorithm: 'pack_stock', field: 'joints' }, applies_when: aw } },
          { id: 'vm-bracket', material_id: 'mat-vl-bracket', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'place_supports', inputs: {} }, sku_lookup: { table: 'bracket', keys: [{ kind: 'modifier_band', name: 'wall_offset' }, { kind: 'modifier', name: 'substrate' }] }, applies_when: aw } },
          { id: 'vm-cage', material_id: 'mat-vl-cage-hoop', rule: { qty_kind: 'per', per: { kind: 'property', name: 'cage_hoops' }, applies_when: { variants: ['Cage ladder', 'Side-exit cage'], criteria: {} } } },
          { id: 'vm-band', material_id: 'mat-vl-cage-band', rule: { qty_kind: 'per', qty: 5, per: { kind: 'derived', name: 'flights' }, applies_when: { variants: ['Cage ladder', 'Side-exit cage'], criteria: {} } } },
          { id: 'vm-exit', material_id: 'mat-vl-exit', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'free_head_count' }, sku_lookup: { table: 'exit_landing', keys: [{ kind: 'property_input', property: 'landing_width', input: 'width' }] }, applies_when: { variants: ['Cage ladder'], criteria: {} } } },
          { id: 'vm-gate', material_id: 'mat-vl-gate', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'free_head_count' }, applies_when: { variants: ['Cage ladder', 'Side-exit cage'], criteria: {} } } },
          { id: 'vm-rest', material_id: 'mat-vl-restplatform', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'rest_platforms' }, applies_when: aw } },
          { id: 'vm-deckfix', material_id: 'mat-vl-deckfix', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'place_supports', inputs: {} }, applies_when: { variants: [], criteria: {}, modifiers: { substrate: ['metal_deck'] } } } },
          { id: 'vm-plate', material_id: 'mat-vl-plate', rule: { qty_kind: 'fixed', qty: 1, applies_when: aw } },
        ],
      },
    ],
  },

  // 3 — Vectaco EVO guardrail (length, segmentable) — two models
  {
    id: 'sys-evo-guardrail', name: 'Vectaco EVO guardrail', description: 'EN ISO 14122-3 / NF E85-015 collective guardrail.',
    primitive: { kind: 'length', segmentable: true },
    modifiers: [
      { name: 'upright_angle', group: 'geometric', type: { kind: 'enum', values: ['straight', 'inclined_30', 'inclined_15', 'curved', 'folding'] }, enabled: true, default_value: 'straight' },
      { name: 'base_type', group: 'mounting', type: { kind: 'enum', values: ['floor', 'wall', 'z_plate', 'freestanding'] }, enabled: true, default_value: 'freestanding' },
      { name: 'deck_height', group: 'environmental', type: { kind: 'distance' }, enabled: true, default_value: 0 },
      { name: 'support_grid', group: 'mounting', type: { kind: 'support_grid' }, enabled: true, default_value: null },
    ],
    variants: {
      attribute_columns: [{ name: 'base', type: { kind: 'enum', values: ['floor', 'wall', 'z_plate', 'freestanding'] } }],
      rows: [
        { kind: 'local', name: 'Floor-fixed', attributes: { base: 'floor' } },
        { kind: 'local', name: 'Wall-fixed', attributes: { base: 'wall' } },
        { kind: 'local', name: 'Z-plate parapet', attributes: { base: 'z_plate' } },
        { kind: 'local', name: 'Freestanding', attributes: { base: 'freestanding' } },
      ],
    },
    criteria: [{ library_id: 'compliance_code', default_value: 'NF_E85-015' }, { library_id: 'wind_zone', default_value: '1' }],
    properties: [
      { catalog_id: 'uprights', name: 'uprights', archetype: 'count', inputs: [], scope: 'per_mount_surface', placement_rules: { max_spacing: 1500, end_clearance_foot: { max: 150 }, end_clearance_head: { max: 150 }, per_segment: true } },
      { catalog_id: 'include_toeboard', name: 'include_toeboard', archetype: 'count', inputs: [{ name: 'on', label: 'Toeboard', type: { kind: 'bool' }, required: false, default: false }], scope: 'set_level' },
      { catalog_id: 'gates', name: 'gates', archetype: 'count', inputs: [{ name: 'count', label: 'Gates', type: { kind: 'integer' }, required: false, default: 0 }], scope: 'set_level' },
    ],
    models: [
      {
        id: 'mdl-evo-fs', name: 'EVO Freestanding — aluminium', system_id: 'sys-evo-guardrail', status: 'published',
        modifier_defaults: { deck_height: 1100 }, sub_assembly_uses: [], criteria_driven_defaults: [],
        sku_lookups: [{ table_name: 'base', columns: ['base'], rows: [
          { keys: ['floor'], sku: 'BASE-FLOOR' }, { keys: ['wall'], sku: 'BASE-WALL' }, { keys: ['z_plate'], sku: 'BASE-Z' }, { keys: ['freestanding'], sku: 'BASE-FS' },
        ], fallback: { sku: 'BASE-AL' } }],
        materials: [
          { id: 'em-upr', material_id: 'mat-evo-upr-str', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'place_supports', inputs: {} }, applies_when: { variants: [], criteria: {}, modifiers: { upright_angle: ['straight'] } } } },
          { id: 'em-upr30', material_id: 'mat-evo-upr-30', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'place_supports', inputs: {} }, applies_when: { variants: [], criteria: {}, modifiers: { upright_angle: ['inclined_30'] } } } },
          { id: 'em-rail', material_id: 'mat-evo-handrail', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: aw } },
          { id: 'em-knee', material_id: 'mat-evo-kneerail', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: aw } },
          { id: 'em-base', material_id: 'mat-evo-base', rule: { qty_kind: 'per', per: { kind: 'algorithm_output', algorithm: 'place_supports', field: 'supports' }, sku_lookup: { table: 'base', keys: [{ kind: 'modifier', name: 'base_type' }] }, applies_when: aw } },
          // counterweights per upright scale with the wind zone (2 / 3 / 4 per leg)
          { id: 'em-cw', material_id: 'mat-evo-cw', rule: { qty_kind: 'per', qty: 2, per: { kind: 'algorithm_output', algorithm: 'place_supports', field: 'supports' }, applies_when: { variants: ['Freestanding'], criteria: { wind_zone: ['1'] } } } },
          { id: 'em-cw-z2', material_id: 'mat-evo-cw', rule: { qty_kind: 'per', qty: 3, per: { kind: 'algorithm_output', algorithm: 'place_supports', field: 'supports' }, applies_when: { variants: ['Freestanding'], criteria: { wind_zone: ['2'] } } } },
          { id: 'em-cw-z3', material_id: 'mat-evo-cw', rule: { qty_kind: 'per', qty: 4, per: { kind: 'algorithm_output', algorithm: 'place_supports', field: 'supports' }, applies_when: { variants: ['Freestanding'], criteria: { wind_zone: ['3'] } } } },
          { id: 'em-cw-end', material_id: 'mat-evo-cw', rule: { qty_kind: 'per', qty: 1, per: { kind: 'derived', name: 'free_ends_count' }, applies_when: { variants: ['Freestanding'], criteria: {} } } },
          { id: 'em-corner', material_id: 'mat-evo-corner', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'junction_corner' }, applies_when: aw } },
          { id: 'em-cap', material_id: 'mat-evo-endcap', rule: { qty_kind: 'per', qty: 2, per: { kind: 'derived', name: 'free_ends_count' }, applies_when: aw } },
          { id: 'em-toe', material_id: 'mat-evo-toeboard', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: aw } },
          { id: 'em-toecnr', material_id: 'mat-evo-toecorner', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'junction_corner' }, applies_when: aw } },
          { id: 'em-toebrk', material_id: 'mat-evo-toebracket', rule: { qty_kind: 'per', per: { kind: 'algorithm_output', algorithm: 'place_supports', field: 'supports' }, applies_when: aw } },
          { id: 'em-gate', material_id: 'mat-evo-gate', rule: { qty_kind: 'per', per: { kind: 'property', name: 'gates' }, applies_when: aw } },
        ],
      },
      {
        id: 'mdl-evo-zplate', name: 'EVO Z-plate parapet — aluminium', system_id: 'sys-evo-guardrail', status: 'published',
        modifier_defaults: { base_type: 'z_plate' }, criteria_driven_defaults: [],
        sub_assembly_uses: [{ id: 'eu-zfix', sub_assembly_id: 'sa-evo-zfix', pinned_version: 1, scope: 'per_mount_surface', parameter_bindings: { count: { kind: 'algorithm_output_ref', algorithm: 'place_supports', field: 'supports' } } }],
        sku_lookups: [{ table_name: 'base', columns: ['base'], rows: [{ keys: ['z_plate'], sku: 'BASE-Z' }], fallback: { sku: 'BASE-AL' } }],
        materials: [
          { id: 'ez-upr', material_id: 'mat-evo-upr-str', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'place_supports', inputs: {} }, applies_when: aw } },
          { id: 'ez-rail', material_id: 'mat-evo-handrail', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: aw } },
          { id: 'ez-knee', material_id: 'mat-evo-kneerail', rule: { qty_kind: 'algorithm', algorithm_config: { algorithm: 'pack_stock', inputs: {} }, applies_when: aw } },
          { id: 'ez-base', material_id: 'mat-evo-base', rule: { qty_kind: 'per', per: { kind: 'algorithm_output', algorithm: 'place_supports', field: 'supports' }, sku_lookup: { table: 'base', keys: [{ kind: 'modifier', name: 'base_type' }] }, applies_when: aw } },
          { id: 'ez-corner', material_id: 'mat-evo-corner', rule: { qty_kind: 'per', per: { kind: 'derived', name: 'junction_corner' }, applies_when: aw } },
          { id: 'ez-cap', material_id: 'mat-evo-endcap', rule: { qty_kind: 'per', qty: 2, per: { kind: 'derived', name: 'free_ends_count' }, applies_when: aw } },
        ],
      },
    ],
  },
];
