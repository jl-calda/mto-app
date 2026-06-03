// Pure, serializable model for the Guide's Inputs/Outputs dependency graph, plus
// builders that derive it from real data. No React — testable in isolation.
// Groups render as columns; each group's subgroups are boxes; each subgroup holds
// its real items as chips/rows.

import type { PropertyInstance, System, SystemVariantRef } from '@/lib/types';
import { CONCEPT_BY_ID, type ConceptId } from './content';

export interface TreeItem {
  label: string;
  detail?: string;
  chips?: string[];
}
export interface SubGroup {
  id: string;
  label: string;
  kind?: ConceptId; // → deep-links to the glossary card + colours the dot
  items: TreeItem[];
}
export interface TreeGroup {
  id: 'inputs' | 'outputs';
  label: string;
  subgroups: SubGroup[];
}
export interface TreeModel {
  title?: string;
  subtitle?: string;
  groups: TreeGroup[];
}

function rowName(r: SystemVariantRef): string {
  return r.kind === 'local' ? r.name : r.variant_id;
}
function scopeLabel(p: PropertyInstance): string {
  return typeof p.scope === 'string' ? p.scope : `per_span:${p.scope.span_name}`;
}
function gatingChips(p: PropertyInstance, variantNames: string[]): string[] {
  const g = p.applies_to_variants;
  if (!g || g.length === 0 || (variantNames.length > 0 && g.length === variantNames.length)) return ['all variants'];
  return g;
}

/** Derive the Inputs/Outputs graph from a System (data-driven, reflects real items). */
export function buildSystemTree(system: System): TreeModel {
  const variantNames = system.variants.rows.map(rowName);
  return {
    title: system.name,
    subtitle: `${system.primitive.kind} system`,
    groups: [
      {
        id: 'inputs',
        label: 'Inputs',
        subgroups: [
          {
            id: 'measurement', label: 'Measurement', kind: 'system',
            items: [{ label: system.primitive.kind, detail: system.primitive.kind === 'length' && system.primitive.segmentable ? 'segmentable' : undefined }],
          },
          {
            id: 'variants', label: 'Variants', kind: 'variant',
            items: system.variants.rows.map((r) => ({
              label: rowName(r),
              chips: r.kind === 'local' ? Object.entries(r.attributes).map(([k, v]) => `${k}: ${String(v)}`) : undefined,
            })),
          },
          {
            id: 'modifiers', label: 'Modifiers', kind: 'modifier',
            items: system.modifiers.map((m) => ({
              label: m.name,
              detail: `${m.group} · ${m.type.kind}${m.default_value != null ? ` · default ${String(m.default_value)}` : ''}`,
            })),
          },
          {
            id: 'criteria', label: 'Criteria', kind: 'criterion',
            items: system.criteria.map((c) => ({ label: c.library_id, detail: c.default_value != null ? `default ${String(c.default_value)}` : undefined })),
          },
          {
            id: 'properties', label: 'Properties', kind: 'property',
            items: system.properties.map((p) => ({ label: p.name, detail: `${p.archetype} · ${scopeLabel(p)}`, chips: gatingChips(p, variantNames) })),
          },
        ],
      },
      {
        id: 'outputs',
        label: 'Outputs',
        subgroups: [
          {
            id: 'models', label: 'Models', kind: 'model',
            items: system.models.map((m) => ({ label: m.name, detail: `${m.materials.length} material${m.materials.length === 1 ? '' : 's'}` })),
          },
          {
            id: 'mto', label: 'MTO', kind: 'mto',
            items: [{ label: 'bill of materials', detail: 'SKUs · quantities · cut plans' }],
          },
        ],
      },
    ],
  };
}

/** Concept-level fallback when no specific entity is in focus. */
const blurb = (id: ConceptId): TreeItem[] => [{ label: CONCEPT_BY_ID[id].oneLiner }];
export const GENERIC_TREE: TreeModel = {
  subtitle: 'how a system produces an MTO',
  groups: [
    {
      id: 'inputs',
      label: 'Inputs',
      subgroups: [
        { id: 'measurement', label: 'Measurement', kind: 'system', items: [{ label: 'what you measure (the primitive)' }] },
        { id: 'variants', label: 'Variants', kind: 'variant', items: blurb('variant') },
        { id: 'modifiers', label: 'Modifiers', kind: 'modifier', items: blurb('modifier') },
        { id: 'criteria', label: 'Criteria', kind: 'criterion', items: blurb('criterion') },
        { id: 'properties', label: 'Properties', kind: 'property', items: blurb('property') },
      ],
    },
    {
      id: 'outputs',
      label: 'Outputs',
      subgroups: [
        { id: 'models', label: 'Models', kind: 'model', items: blurb('model') },
        { id: 'mto', label: 'MTO', kind: 'mto', items: blurb('mto') },
      ],
    },
  ],
};
