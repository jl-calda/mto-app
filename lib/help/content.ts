// Single source of truth for the in-app Guide panel. Pure data (no React) so it
// can be imported by server or client. The copy explains the app's core domain
// concepts and — crucially — what distinguishes the four similar per-system ones
// (variants / modifiers / criteria / properties).

export type ConceptId =
  | 'system'
  | 'variant'
  | 'modifier'
  | 'criterion'
  | 'property'
  | 'model'
  | 'subassembly'
  | 'takeoff'
  | 'mto';

export interface Concept {
  id: ConceptId;
  label: string;
  /** A CSS colour token, e.g. 'var(--accent)'. */
  color: string;
  /** Plain-English one-liner. */
  oneLiner: string;
  /** How it differs from the concepts it's easily confused with. */
  differs: string;
  /** A concrete example drawn from the seed data. */
  example: string;
  /** Its role on the path to the final MTO. */
  feedsMto: string;
}

export const CONCEPTS: Concept[] = [
  {
    id: 'system',
    label: 'System',
    color: 'var(--accent)',
    oneLiner: 'The product spec — a built object like a ladder or guardrail. It declares what gets measured and the whole menu of choices below.',
    differs: 'The container for everything else. A system holds variants, modifiers, criteria, properties and one or more models.',
    example: '“Vectaladder cage ladder” — measures a climb height and offers cage / side-exit options.',
    feedsMto: 'Defines the structure of the bill; you take a system off to produce an MTO.',
  },
  {
    id: 'variant',
    label: 'Variant',
    color: 'var(--prim-height)',
    oneLiner: 'A static design family you pick once per take-off (and it stays fixed).',
    differs: 'Unlike a modifier, it isn’t a numeric knob — it’s a whole design choice. Unlike a criterion, it’s about the product’s design, not outside context.',
    example: '“Cage ladder” (carries attributes like has_cage: true) vs “Plain ladder”.',
    feedsMto: 'Gates which materials appear — e.g. cage hoops only apply to the Cage variant.',
  },
  {
    id: 'modifier',
    label: 'Modifier',
    color: 'var(--prim-count)',
    oneLiner: 'A tunable knob (a distance, a band, an on/off, an enum) that fine-tunes the build.',
    differs: 'Unlike a variant, it’s adjustable and often numeric. Unlike a property, it tunes the design rather than counting things along the geometry. Has a default that the model or take-off can override.',
    example: '“wall_offset” — a banded distance whose band (e.g. 205–470 mm) picks the right bracket SKU.',
    feedsMto: 'Gates materials, selects SKUs by band/enum, and can drive quantities.',
  },
  {
    id: 'criterion',
    label: 'Criterion',
    color: 'var(--warn)',
    oneLiner: 'An external context condition supplied per take-off — compliance code, finish, substrate.',
    differs: 'Comes from outside the product (a standard, a site condition), not a design choice (variant) or a numeric knob (modifier).',
    example: '“compliance_code = NF E85-016” or “material_finish = anodized”.',
    feedsMto: 'Gates which materials are included and can key SKU lookups (e.g. the right certificate).',
  },
  {
    id: 'property',
    label: 'Property',
    color: 'var(--ok)',
    oneLiner: 'A user-entered quantity measured along the geometry — spacing, count, rate.',
    differs: 'Unlike the other three (which mostly gate what applies), a property drives how many. It’s scoped to part of the run (per segment, per span, …).',
    example: '“rungs” with spacing 280 mm → the engine computes how many rungs fit the climb.',
    feedsMto: 'Drives “per” quantity rules — 1 rung per 280 mm of ladder.',
  },
  {
    id: 'model',
    label: 'Model',
    color: 'var(--prim-seglength)',
    oneLiner: 'The material ruleset under a system: which materials, under what conditions, in what quantity, keyed to which SKUs.',
    differs: 'A system can have several models (rulesets); you pick exactly one per take-off. Sub-assemblies are reusable bundles a model pulls in.',
    example: '“Vectaladder VL-Standard” — ~10 material rules incl. a bracket rule with a SKU lookup table.',
    feedsMto: 'The blueprint the engine walks rule-by-rule to emit MTO lines.',
  },
  {
    id: 'subassembly',
    label: 'Sub-assembly',
    color: 'var(--prim-length)',
    oneLiner: 'A reusable, parametric bundle of materials (like a CAD assembly) that a model inlines.',
    differs: 'Lives globally and can be instantiated many times with different parameters; a model is the top-level ruleset that uses it.',
    example: '“Wall bracket assembly” — 1 bracket + 2 bolts + a cut L-bar, parameterised by count.',
    feedsMto: 'Its materials are inlined into the model’s shared cut pool and appear in the MTO.',
  },
  {
    id: 'takeoff',
    label: 'Take-off',
    color: 'var(--accent)',
    oneLiner: 'Your filled-in answer sheet: one variant + one model + criteria/modifier/property values + the measurement.',
    differs: 'The system is the blank form; the take-off is one completed instance of it, living inside a project.',
    example: '“Plant access ladder L1→L4” — Cage variant, NF E85-016, 9 200 mm climb, rung spacing 280.',
    feedsMto: 'The engine resolves it deterministically into the MTO.',
  },
  {
    id: 'mto',
    label: 'MTO',
    color: 'var(--ink-2)',
    oneLiner: 'The output — the material take-off / bill of materials.',
    differs: 'It’s the result, not an input. Produced by the engine from a take-off.',
    example: 'A list of SKUs with quantities, units and cutting plans for the ladder.',
    feedsMto: 'This is the deliverable everything above is building toward.',
  },
];

export const CONCEPT_BY_ID: Record<ConceptId, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c]),
) as Record<ConceptId, Concept>;

// ── the four-way comparison (the heart of the confusion) ──
export interface CompareRow {
  aspect: string;
  variant: string;
  modifier: string;
  criterion: string;
  property: string;
}

export const COMPARE_ROWS: CompareRow[] = [
  { aspect: 'What it is', variant: 'Design family', modifier: 'Tunable knob', criterion: 'Outside context', property: 'Measured quantity' },
  { aspect: 'Set by', variant: 'Picked once', modifier: 'Default → model → take-off', criterion: 'Filled per take-off', property: 'Entered per take-off' },
  { aspect: 'Gates materials?', variant: 'Yes', modifier: 'Yes', criterion: 'Yes', property: 'No' },
  { aspect: 'Picks SKU?', variant: 'Via attrs', modifier: 'Yes (bands/enums)', criterion: 'Yes', property: 'No' },
  { aspect: 'Drives qty?', variant: 'No', modifier: 'Sometimes', criterion: 'No', property: 'Yes' },
  { aspect: 'Scope', variant: 'Whole bill', modifier: 'Whole / per-rule', criterion: 'Whole bill', property: 'Per segment / span' },
];

// ── concept map (System → choices → Model → Take-off → MTO) ──
// col/row are grid coordinates the ConceptMap lays out on a small CSS grid.
export interface MapNode {
  id: ConceptId;
  label: string;
  col: number;
  row: number;
}
export interface MapEdge {
  from: ConceptId;
  to: ConceptId;
}

// Layout: 3 columns. Col 0 = the four choices (stacked), col 1 = System then
// Model then Take-off then MTO down the spine.
export const MAP_NODES: MapNode[] = [
  { id: 'variant', label: 'Variant', col: 0, row: 0 },
  { id: 'modifier', label: 'Modifier', col: 0, row: 1 },
  { id: 'criterion', label: 'Criterion', col: 0, row: 2 },
  { id: 'property', label: 'Property', col: 0, row: 3 },
  { id: 'system', label: 'System', col: 1, row: 0 },
  { id: 'model', label: 'Model', col: 1, row: 1 },
  { id: 'takeoff', label: 'Take-off', col: 1, row: 2 },
  { id: 'mto', label: 'MTO', col: 1, row: 3 },
];

export const MAP_EDGES: MapEdge[] = [
  { from: 'variant', to: 'system' },
  { from: 'modifier', to: 'system' },
  { from: 'criterion', to: 'system' },
  { from: 'property', to: 'system' },
  { from: 'system', to: 'model' },
  { from: 'model', to: 'takeoff' },
  { from: 'takeoff', to: 'mto' },
];

// Which concept the Guide should focus on for a given nav tab (Shell's navActive).
// Tabs without a matching core concept (materials, inventory) open the overview.
export function topicForNav(navActive?: string): ConceptId | null {
  switch (navActive) {
    case 'projects': return 'takeoff';
    case 'systems': return 'system';
    case 'variants': return 'variant';
    case 'subassemblies': return 'subassembly';
    default: return null; // materials, inventory, unknown → overview
  }
}
