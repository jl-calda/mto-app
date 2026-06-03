import { describe, it, expect } from 'vitest';
import { COMPARE_ROWS, CONCEPTS, CONCEPT_BY_ID, MAP_EDGES, MAP_NODES, type ConceptId } from '@/lib/help/content';

const ALL_IDS: ConceptId[] = ['system', 'variant', 'modifier', 'criterion', 'property', 'model', 'subassembly', 'takeoff', 'mto'];

describe('help content', () => {
  it('defines every concept id with complete copy', () => {
    for (const id of ALL_IDS) {
      const c = CONCEPT_BY_ID[id];
      expect(c, id).toBeDefined();
      for (const field of ['label', 'color', 'oneLiner', 'differs', 'example', 'feedsMto'] as const) {
        expect(c[field]?.length, `${id}.${field}`).toBeGreaterThan(0);
      }
    }
    expect(CONCEPTS).toHaveLength(ALL_IDS.length);
  });

  it('comparison table fills all four columns on every row', () => {
    expect(COMPARE_ROWS.length).toBeGreaterThan(0);
    for (const r of COMPARE_ROWS) {
      for (const col of ['variant', 'modifier', 'criterion', 'property'] as const) {
        expect(r[col]?.length, `${r.aspect}.${col}`).toBeGreaterThan(0);
      }
    }
  });

  it('map nodes/edges reference real concepts', () => {
    const ids = new Set(MAP_NODES.map((n) => n.id));
    for (const id of ids) expect(CONCEPT_BY_ID[id]).toBeDefined();
    for (const e of MAP_EDGES) {
      expect(ids.has(e.from), `edge from ${e.from}`).toBe(true);
      expect(ids.has(e.to), `edge to ${e.to}`).toBe(true);
    }
  });
});
