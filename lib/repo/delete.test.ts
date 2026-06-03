import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '@/lib/repo/memory-repo';
import { modelDeleteBlock, systemDeleteBlock } from '@/lib/repo/guards';
import type { Model, Project, System, Takeoff } from '@/lib/types';

const makeSystem = (id: string, models: Model[] = []): System => ({
  id, name: id, primitive: { kind: 'count' }, modifiers: [],
  variants: { attribute_columns: [], rows: [] }, criteria: [], properties: [], models,
});
const makeModel = (id: string, systemId: string): Model => ({
  id, name: id, system_id: systemId, status: 'draft', modifier_defaults: {},
  materials: [], sub_assembly_uses: [], sku_lookups: [], criteria_driven_defaults: [],
});
const makeTakeoff = (id: string, systemId: string, modelId: string): Takeoff => ({
  id, name: id, system_id: systemId, model_id: modelId,
  variant_choice: { source_ref: { kind: 'local', name: 'v', attributes: {} }, attributes: {} },
  criteria_values: {}, modifier_values: {}, primitive_input: 0, property_values: {},
});
const makeProject = (id: string, takeoffs: Takeoff[] = []): Project => ({
  id, name: id, client: 'c', created_at: 0, takeoffs,
});

describe('memory repo deletes', () => {
  it('deleteProject removes the project', async () => {
    const repo = createMemoryRepo();
    await repo.saveProject(makeProject('prj-del-1'));
    expect(await repo.getProject('prj-del-1')).not.toBeNull();
    await repo.deleteProject('prj-del-1');
    expect(await repo.getProject('prj-del-1')).toBeNull();
  });

  it('deleteSystem removes the system and its nested models cascade out of listModels', async () => {
    const repo = createMemoryRepo();
    await repo.saveSystem(makeSystem('sys-del-1', [makeModel('mdl-del-1', 'sys-del-1')]));
    expect(await repo.getModel('mdl-del-1')).not.toBeNull();
    await repo.deleteSystem('sys-del-1');
    expect(await repo.getSystem('sys-del-1')).toBeNull();
    expect(await repo.getModel('mdl-del-1')).toBeNull();
  });

  it('deleteModel removes only the model from its parent system', async () => {
    const repo = createMemoryRepo();
    await repo.saveSystem(makeSystem('sys-del-2', [makeModel('mdl-a', 'sys-del-2'), makeModel('mdl-b', 'sys-del-2')]));
    await repo.deleteModel('mdl-a');
    const sys = await repo.getSystem('sys-del-2');
    expect(sys?.models.map((m) => m.id)).toEqual(['mdl-b']);
  });

  it('deleteTakeoff removes the take-off from its project', async () => {
    const repo = createMemoryRepo();
    await repo.saveProject(makeProject('prj-del-2'));
    await repo.saveTakeoff('prj-del-2', makeTakeoff('tko-del-1', 'sys-x', 'mdl-x'));
    expect(await repo.getTakeoff('tko-del-1')).not.toBeNull();
    await repo.deleteTakeoff('prj-del-2', 'tko-del-1');
    expect(await repo.getTakeoff('tko-del-1')).toBeNull();
  });
});

describe('delete guards (referential integrity)', () => {
  it('blocks a system delete when a take-off references it, allows it otherwise', () => {
    const sys = makeSystem('sys-g1');
    expect(systemDeleteBlock(sys, [])).toBeNull();
    expect(systemDeleteBlock(sys, [makeTakeoff('t', 'sys-g1', 'm')])).toMatch(/in use by 1 take-off/i);
    // a take-off on a different system doesn't block
    expect(systemDeleteBlock(sys, [makeTakeoff('t', 'sys-other', 'm')])).toBeNull();
  });

  it('blocks a model delete when a take-off references it, allows it otherwise', () => {
    expect(modelDeleteBlock('mdl-g1', [])).toBeNull();
    expect(modelDeleteBlock('mdl-g1', [makeTakeoff('t', 's', 'mdl-g1')])).toMatch(/in use by 1 take-off/i);
    expect(modelDeleteBlock('mdl-g1', [makeTakeoff('t', 's', 'mdl-other')])).toBeNull();
  });
});
