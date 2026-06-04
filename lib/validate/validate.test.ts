import { describe, it, expect } from 'vitest';
import { seed } from '@/lib/repo/seed';
import { validateSystem, validateModel, affected, byAffected } from '@/lib/validate';
import type { Model, System, Warning } from '@/lib/types';

// Fresh structuredClone per access so a test mutating one fixture never leaks.
const sysById = new Map(seed.systems.map((s) => [s.id, s]));
const sys = (id: string): System => structuredClone(sysById.get(id)!);
const modelOf = (s: System, id: string): Model => s.models.find((m) => m.id === id)!;

const evo = () => sys('sys-evo-guardrail');
const vecta = () => sys('sys-vectaladder');
const securope = () => sys('sys-securope');

const notInfo = (ws: Warning[]) => ws.filter((x) => x.level !== 'info');
const infos = (ws: Warning[]) => ws.filter((x) => x.level === 'info');

describe('seed-good silence — the worked-example systems/models are clean', () => {
  it('validateSystem is silent on EVO / Vectaladder / Securope', () => {
    expect(validateSystem(evo())).toEqual([]);
    expect(validateSystem(vecta())).toEqual([]);
    expect(validateSystem(securope())).toEqual([]);
  });

  it('validateModel is silent on the Vectaladder + Securope models', () => {
    expect(validateModel(vecta(), modelOf(vecta(), 'mdl-vectaladder'))).toEqual([]);
    expect(validateModel(securope(), modelOf(securope(), 'mdl-securope-fa'))).toEqual([]);
  });

  it('mdl-evo-fs: no warnings/errors, exactly the one wind_zone coverage info', () => {
    const ws = validateModel(evo(), modelOf(evo(), 'mdl-evo-fs'));
    expect(notInfo(ws)).toEqual([]);
    expect(infos(ws)).toHaveLength(1);
    const cov = ws[0];
    expect(cov).toMatchObject({ level: 'info', source: 'validation' });
    expect(cov.message).toMatch(/wind_zone/);
    expect(cov.message).toMatch(/1.*2.*3/);
    expect(cov.affected_fields).toEqual(
      expect.arrayContaining([affected.crit('wind_zone'), affected.mm('em-cw'), affected.mm('em-cw-z2'), affected.mm('em-cw-z3')]),
    );
  });

  it('the seed derived counters (junction_corner, free_head_count, is_loop) raise no info', () => {
    // mdl-evo-fs uses junction_corner + free_ends_count; mdl-securope-fa uses is_loop + free_head_count.
    expect(infos(validateModel(securope(), modelOf(securope(), 'mdl-securope-fa')))).toEqual([]);
  });

  it('is deterministic — same input, equal output across fresh clones', () => {
    const a = validateModel(evo(), modelOf(evo(), 'mdl-evo-fs'));
    const b = validateModel(evo(), modelOf(evo(), 'mdl-evo-fs'));
    expect(a).toEqual(b);
  });
});

describe('model cross-reference checks (warning) — dangling rule references', () => {
  it('flags a gate on an undeclared variant', () => {
    const s = evo();
    const m = modelOf(s, 'mdl-evo-fs');
    m.materials.find((x) => x.id === 'em-cw')!.rule.applies_when.variants = ['Freestandng'];
    const hit = byAffected(validateModel(s, m), affected.mm('em-cw')).find((x) => x.affected_fields?.includes(affected.variant('Freestandng')));
    expect(hit?.level).toBe('warning');
  });

  it('flags a gate on an undeclared criterion key', () => {
    const s = evo();
    const m = modelOf(s, 'mdl-evo-fs');
    m.materials.find((x) => x.id === 'em-cw')!.rule.applies_when.criteria = { wind_zone: ['1'], wnd_zone: ['x'] };
    expect(byAffected(validateModel(s, m), affected.crit('wnd_zone'))).toHaveLength(1);
  });

  it('flags a gate on an undeclared modifier key', () => {
    const s = evo();
    const m = modelOf(s, 'mdl-evo-fs');
    m.materials.find((x) => x.id === 'em-upr')!.rule.applies_when.modifiers = { upright_angl: ['straight'] };
    expect(byAffected(validateModel(s, m), affected.mod('upright_angl'))).toHaveLength(1);
  });

  it('flags per-property counting against an undeclared property', () => {
    const s = evo();
    const m = modelOf(s, 'mdl-evo-fs');
    m.materials.find((x) => x.id === 'em-gate')!.rule.per = { kind: 'property', name: 'gatez' };
    expect(byAffected(validateModel(s, m), affected.prop('gatez'))).toHaveLength(1);
  });

  it('flags an undeclared sku_lookup table', () => {
    const s = evo();
    const m = modelOf(s, 'mdl-evo-fs');
    m.materials.find((x) => x.id === 'em-base')!.rule.sku_lookup!.table = 'basez';
    expect(byAffected(validateModel(s, m), affected.skuLookup('basez'))).toHaveLength(1);
  });

  it('flags a modifier_band SKU key whose modifier is not banded', () => {
    const s = evo();
    const m = modelOf(s, 'mdl-evo-fs');
    m.materials.find((x) => x.id === 'em-base')!.rule.sku_lookup!.keys = [{ kind: 'modifier_band', name: 'base_type' }];
    const hit = byAffected(validateModel(s, m), affected.mod('base_type')).find((x) => /banded_distance/.test(x.message));
    expect(hit?.level).toBe('warning');
  });

  it('flags a property_input SKU key referencing a non-existent input', () => {
    const s = vecta();
    const m = modelOf(s, 'mdl-vectaladder');
    m.materials.find((x) => x.id === 'vm-exit')!.rule.sku_lookup!.keys = [{ kind: 'property_input', property: 'landing_width', input: 'widthz' }];
    const hit = byAffected(validateModel(s, m), affected.prop('landing_width')).find((x) => /widthz/.test(x.message));
    expect(hit?.level).toBe('warning');
  });
});

describe('info-level checks', () => {
  it('per:{derived} outside the allow-list resolves-to-0 (info)', () => {
    const s = evo();
    const m = modelOf(s, 'mdl-evo-fs');
    m.materials.find((x) => x.id === 'em-corner')!.rule.per = { kind: 'derived', name: 'unicorns' };
    const ws = byAffected(validateModel(s, m), affected.mm('em-corner'));
    expect(ws.some((x) => x.level === 'info' && /unicorns/.test(x.message))).toBe(true);
  });

  it('a sku_lookup table with no fallback (info)', () => {
    const s = vecta();
    const m = modelOf(s, 'mdl-vectaladder');
    delete m.sku_lookups.find((t) => t.table_name === 'bracket')!.fallback;
    const ws = byAffected(validateModel(s, m), affected.skuLookup('bracket'));
    expect(ws.some((x) => x.level === 'info' && /fallback/.test(x.message))).toBe(true);
  });
});

describe('system checks', () => {
  it('flags a property gated to an undeclared variant (warning)', () => {
    const s = evo();
    s.properties.find((p) => p.name === 'uprights')!.applies_to_variants = ['Ghost'];
    const hit = byAffected(validateSystem(s), affected.variant('Ghost'));
    expect(hit[0]?.level).toBe('warning');
  });

  it('flags a per_span scope referencing an undeclared span (warning)', () => {
    const s = vecta();
    s.spans![0].name = 'renamed_zone'; // cage_hoops still points at cage_zone
    const hit = byAffected(validateSystem(s), affected.span('cage_zone'));
    expect(hit[0]?.level).toBe('warning');
  });

  it('flags overlapping banded-modifier bands (warning)', () => {
    const s = vecta();
    const wo = s.modifiers.find((m) => m.name === 'wall_offset')!;
    if (wo.type.kind === 'banded_distance') wo.type.bands = [{ range: [205, 500], sku_key: 'a' }, { range: [471, 750], sku_key: 'b' }];
    const hit = byAffected(validateSystem(s), affected.mod('wall_offset'));
    expect(hit.some((x) => /overlap/.test(x.message))).toBe(true);
  });

  it('flags a gap between banded-modifier bands (warning)', () => {
    const s = vecta();
    const wo = s.modifiers.find((m) => m.name === 'wall_offset')!;
    if (wo.type.kind === 'banded_distance') wo.type.bands = [{ range: [205, 470], sku_key: 'a' }, { range: [600, 750], sku_key: 'b' }];
    const hit = byAffected(validateSystem(s), affected.mod('wall_offset'));
    expect(hit.some((x) => /gap/.test(x.message))).toBe(true);
  });

  it('flags placement_rules on a non-count archetype (info)', () => {
    const s = evo();
    s.properties.find((p) => p.name === 'uprights')!.archetype = 'spacing';
    const hit = byAffected(validateSystem(s), affected.placement('uprights'));
    expect(hit[0]?.level).toBe('info');
  });

  it('flags a stock/rate property with no length_basis (info)', () => {
    const s = evo();
    const p = s.properties.find((x) => x.name === 'include_toeboard')!;
    p.archetype = 'stock';
    delete p.length_basis;
    const hit = byAffected(validateSystem(s), affected.prop('include_toeboard'));
    expect(hit.some((x) => x.level === 'info' && /length_basis/.test(x.message))).toBe(true);
  });
});
