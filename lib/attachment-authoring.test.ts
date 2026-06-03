import { describe, it, expect } from 'vitest';
import { blankConnectionPoint, blankConstraint, blankPresetTarget, makeBlankAttachment } from '@/lib/attachment-authoring';
import { resolveTakeoff } from '@/lib/engine';
import { seed } from '@/lib/repo/seed';
import { createMemoryRepo } from '@/lib/repo/memory-repo';
import type { Model, System, VariantSnapshot } from '@/lib/types';

describe('attachment authoring builders', () => {
  it('blankConnectionPoint carries the kind-specific field', () => {
    expect(blankConnectionPoint('head')).toEqual({ kind: 'head' });
    expect(blankConnectionPoint('segment_end')).toEqual({ kind: 'segment_end', segment_index: 0 });
    expect(blankConnectionPoint('position')).toEqual({ kind: 'position', value: 0 });
  });

  it('blankConstraint / blankPresetTarget produce valid union members', () => {
    expect(blankConstraint('alignment')).toEqual({ kind: 'alignment', axis: 'x' });
    expect(blankConstraint('clearance')).toEqual({ kind: 'clearance', min: 0 });
    expect(blankPresetTarget('property_input')).toEqual({ kind: 'property_input', property: 'property', input: 'input' });
    expect(blankPresetTarget('variant')).toEqual({ kind: 'variant' });
  });

  it('makeBlankAttachment is a minimal valid attachment', () => {
    const a = makeBlankAttachment('att-1', 'sys-x');
    expect(a.id).toBe('att-1');
    expect(a.attached_system_id).toBe('sys-x');
    expect(a.connection.from_point).toEqual({ kind: 'head' });
    expect(a.optional).toBe(false);
    expect(a.default_included).toBe(true);
  });
});

describe('authored attachment round-trips through the repo and engine', () => {
  it('saving an attachment onto the ladder system persists and still resolves a take-off', async () => {
    const repo = createMemoryRepo();
    const ladder = (await repo.getSystem('sys-vectaladder'))!;
    const att = makeBlankAttachment('att-test', 'sys-evo-guardrail');
    att.model_binding = { kind: 'pinned', model_id: 'mdl-evo-fs' };
    att.connection.constraints = [blankConstraint('height_match')];
    att.presets = [{ target: blankPresetTarget('modifier'), value: 'straight', locked: true }];

    await repo.saveSystem({ ...ladder, attachments: [...(ladder.attachments ?? []), att] });
    const reread = (await repo.getSystem('sys-vectaladder'))!;
    expect(reread.attachments?.some((a) => a.id === 'att-test')).toBe(true);

    // the engine still resolves a take-off of that system (attachment not included → no throw)
    const model = (await repo.listModels('sys-vectaladder'))[0] as Model;
    const sysById = new Map(seed.systems.map((s) => [s.id, s] as const));
    const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Cage ladder', attributes: {} }, attributes: { has_cage: true, exit_type: 'exit_landing' } };
    const r = resolveTakeoff({
      system: reread as System, model, variant: v, materials: seed.materials,
      resolveAttachedSystem: (id) => sysById.get(id),
      input: { criteria_values: {}, modifier_values: {}, primitive_input: 9450, property_values: {} },
    });
    expect(r.mto.length).toBeGreaterThan(0);
  });
});
