import { describe, it, expect } from 'vitest';
import { buildSystemGraph, buildGenericGraph, type GraphModel } from '@/lib/help/graph';
import { MAP_NODES } from '@/lib/help/content';
import { seed } from '@/lib/repo/seed';
import type { System } from '@/lib/types';

const inc = (g: GraphModel, target: string) => g.edges.filter((e) => e.target === target);
const out = (g: GraphModel, source: string) => g.edges.filter((e) => e.source === source);
const hasNode = (g: GraphModel, id: string) => g.nodes.some((n) => n.id === id);

describe('buildSystemGraph', () => {
  const ladder = seed.systems.find((s) => s.id === 'sys-vectaladder') as System;
  const evo = seed.systems.find((s) => s.id === 'sys-evo-guardrail') as System;

  it('emits a node per declared input + each material, with meas and no MTO node', () => {
    const g = buildSystemGraph(ladder, seed.materials); // single-model system
    const count = (k: string) => g.nodes.filter((n) => n.kind === k).length;
    expect(count('variant')).toBe(ladder.variants.rows.length);
    expect(count('modifier')).toBe(ladder.modifiers.length);
    expect(count('criterion')).toBe(ladder.criteria.length);
    expect(count('property')).toBe(ladder.properties.length);
    expect(count('material')).toBe(ladder.models.reduce((n, m) => n + m.materials.length, 0));
    expect(hasNode(g, 'meas')).toBe(true);
    expect(hasNode(g, 'mto')).toBe(false); // MTO node removed
    // single model → surfaced as the header, not a node, and materials are terminal
    expect(count('model')).toBe(0);
    expect(g.modelName).toBe(ladder.models[0].name);
    expect(g.edges.some((e) => e.role === 'feeds')).toBe(false);
    expect(g.title).toBe(ladder.name);
  });

  it('never produces a dangling edge (every endpoint is a real node)', () => {
    const g = buildSystemGraph(evo, seed.materials);
    const idset = new Set(g.nodes.map((n) => n.id));
    expect(g.edges.every((e) => idset.has(e.source) && idset.has(e.target))).toBe(true);
  });

  it('traces a material back to the variant + criterion that gate it', () => {
    const g = buildSystemGraph(evo, seed.materials);
    // counterweight z2 is gated by variant Freestanding + criterion wind_zone=2
    const gates = inc(g, 'mat:em-cw-z2').filter((e) => e.role === 'gate');
    expect(gates.map((e) => e.source)).toEqual(expect.arrayContaining(['var:Freestanding', 'crit:wind_zone']));
    expect(gates.find((e) => e.source === 'crit:wind_zone')!.label).toBe('2');
    // straight upright is gated by the upright_angle modifier
    const upr = inc(g, 'mat:em-upr').filter((e) => e.role === 'gate');
    const um = upr.find((e) => e.source === 'mod:upright_angle')!;
    expect(um).toBeTruthy();
    expect(um.label).toBe('straight');
  });

  it('draws sku edges from the inputs that key a material SKU lookup', () => {
    const g = buildSystemGraph(ladder, seed.materials);
    const sku = inc(g, 'mat:vm-bracket').filter((e) => e.role === 'sku');
    expect(sku.map((e) => e.source)).toEqual(expect.arrayContaining(['mod:wall_offset', 'mod:substrate']));
    expect(sku.every((e) => e.label === 'SKU')).toBe(true);
  });

  it('draws a qty edge from the property that drives a material quantity', () => {
    const g = buildSystemGraph(ladder, seed.materials);
    expect(g.edges.some((e) => e.role === 'qty' && e.source === 'prop:rungs' && e.target === 'mat:vm-rung')).toBe(true);
  });

  it('groups a multi-model system under terminal model nodes, with no MTO', () => {
    const g = buildSystemGraph(evo, seed.materials); // EVO has 2 models
    expect(g.modelName).toBeUndefined();
    expect(hasNode(g, 'mto')).toBe(false);
    expect(g.nodes.filter((n) => n.kind === 'model').length).toBe(evo.models.length);
    for (const m of g.nodes.filter((n) => n.kind === 'material')) {
      const feeds = out(g, m.id).filter((e) => e.role === 'feeds');
      expect(feeds.length).toBe(1);
      expect(feeds[0].target).toBe(`model:${m.model}`);
    }
    // model nodes are now terminal (no model → MTO)
    for (const model of g.nodes.filter((n) => n.kind === 'model')) {
      expect(out(g, model.id).length).toBe(0);
    }
  });

  it('includes an input that only keys a SKU (gates nothing) as a node', () => {
    const g = buildSystemGraph(ladder, seed.materials);
    expect(hasNode(g, 'mod:wall_offset')).toBe(true);
    const e = out(g, 'mod:wall_offset');
    expect(e.some((x) => x.role === 'sku')).toBe(true);
    expect(e.some((x) => x.role === 'gate')).toBe(false);
  });

  it('is pure/deterministic', () => {
    expect(buildSystemGraph(ladder, seed.materials)).toEqual(buildSystemGraph(ladder, seed.materials));
  });
});

describe('buildGenericGraph', () => {
  it('renders the concept map (System → Model → Take-off → MTO) as feeds edges', () => {
    const g = buildGenericGraph();
    expect(g.nodes.length).toBe(MAP_NODES.length);
    expect(g.nodes.some((n) => n.kind === 'system')).toBe(true);
    expect(g.nodes.some((n) => n.kind === 'mto')).toBe(true);
    expect(g.edges.length).toBeGreaterThan(0);
    expect(g.edges.every((e) => e.role === 'feeds')).toBe(true);
    const idset = new Set(g.nodes.map((n) => n.id));
    expect(g.edges.every((e) => idset.has(e.source) && idset.has(e.target))).toBe(true);
  });
});
