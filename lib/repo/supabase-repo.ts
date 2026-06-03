import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  InventoryItem,
  Material,
  Model,
  Project,
  SubAssembly,
  System,
  Takeoff,
  Variant,
} from '@/lib/types';
import type { Repository } from './types';

// Every row stores the full domain object in `payload`; relational columns exist
// for querying/FKs. Reads therefore just return the payload. The loader keeps the
// child tables (model, takeoff, *_version) in sync for relational queries.
export function createSupabaseRepo(db: SupabaseClient): Repository {
  async function listPayloads<T>(table: string): Promise<T[]> {
    const { data, error } = await db.from(table).select('payload');
    if (error) throw new Error(`${table}: ${error.message}`);
    return (data ?? []).map((r) => (r as { payload: T }).payload);
  }
  async function getPayload<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await db.from(table).select('payload').eq('id', id).maybeSingle();
    if (error) throw new Error(`${table}#${id}: ${error.message}`);
    return data ? (data as { payload: T }).payload : null;
  }
  async function listPayloadsWhere<T>(table: string, col: string, val?: string): Promise<T[]> {
    let q = db.from(table).select('payload');
    if (val) q = q.eq(col, val);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    return (data ?? []).map((r) => (r as { payload: T }).payload);
  }

  return {
    listProjects: () => listPayloads<Project>('project'),
    getProject: (id) => getPayload<Project>('project', id),
    async saveProject(project) {
      const { error } = await db.from('project').upsert({
        id: project.id, name: project.name, client: project.client, location: project.location ?? null, payload: project,
      });
      if (error) throw new Error(`project#${project.id}: ${error.message}`);
      return project;
    },
    async deleteProject(id) {
      // take-offs FK to the project; drop them first to avoid orphan rows
      await db.from('takeoff').delete().eq('project_id', id);
      const { error } = await db.from('project').delete().eq('id', id);
      if (error) throw new Error(`project#${id}: ${error.message}`);
    },
    listSystems: () => listPayloads<System>('system'),
    getSystem: (id) => getPayload<System>('system', id),
    async saveSystem(system) {
      const { error } = await db.from('system').upsert({
        id: system.id,
        name: system.name,
        description: system.description ?? null,
        primitive_kind: system.primitive.kind,
        payload: system,
      });
      if (error) throw new Error(`system#${system.id}: ${error.message}`);
      return system;
    },
    async deleteSystem(id) {
      // nested models live in their own table too — cascade within the aggregate
      await db.from('model').delete().eq('system_id', id);
      const { error } = await db.from('system').delete().eq('id', id);
      if (error) throw new Error(`system#${id}: ${error.message}`);
    },
    listModels: (systemId) => listPayloadsWhere<Model>('model', 'system_id', systemId),
    getModel: (id) => getPayload<Model>('model', id),
    async saveModel(model) {
      const { error } = await db.from('model').upsert({
        id: model.id, system_id: model.system_id, name: model.name, status: model.status,
        current_version: model.current_version ?? null, payload: model,
      });
      if (error) throw new Error(`model#${model.id}: ${error.message}`);
      // keep the parent system payload's models[] in step (getSystem reads the payload)
      const sys = await getPayload<System>('system', model.system_id);
      if (sys) {
        const models = sys.models ?? [];
        const i = models.findIndex((m) => m.id === model.id);
        const next = i >= 0 ? models.map((m) => (m.id === model.id ? model : m)) : [...models, model];
        await db.from('system').upsert({ id: sys.id, name: sys.name, description: sys.description ?? null, primitive_kind: sys.primitive.kind, payload: { ...sys, models: next } });
      }
      return model;
    },
    async deleteModel(id) {
      const model = await getPayload<Model>('model', id);
      const { error } = await db.from('model').delete().eq('id', id);
      if (error) throw new Error(`model#${id}: ${error.message}`);
      // keep the parent system payload's models[] in step (getSystem reads the payload)
      if (model) {
        const sys = await getPayload<System>('system', model.system_id);
        if (sys) {
          const next = (sys.models ?? []).filter((m) => m.id !== id);
          await db.from('system').upsert({ id: sys.id, name: sys.name, description: sys.description ?? null, primitive_kind: sys.primitive.kind, payload: { ...sys, models: next } });
        }
      }
    },
    listMaterials: () => listPayloads<Material>('material'),
    getMaterial: (id) => getPayload<Material>('material', id),
    async saveMaterial(material) {
      const { error } = await db.from('material').upsert({
        id: material.id, sku: material.sku, name: material.name, vendor: material.vendor,
        unit: material.unit, category: material.category ?? null, is_cuttable: material.is_cuttable,
        payload: material,
      });
      if (error) throw new Error(`material#${material.id}: ${error.message}`);
      return material;
    },
    async deleteMaterial(id) {
      const { error } = await db.from('material').delete().eq('id', id);
      if (error) throw new Error(`material#${id}: ${error.message}`);
    },
    listVariants: () => listPayloads<Variant>('variant'),
    getVariant: (id) => getPayload<Variant>('variant', id),
    async saveVariant(variant) {
      const { error } = await db.from('variant').upsert({
        id: variant.id, name: variant.name, status: variant.status,
        current_version: variant.current_version, payload: variant,
      });
      if (error) throw new Error(`variant#${variant.id}: ${error.message}`);
      return variant;
    },
    async deleteVariant(id) {
      const { error } = await db.from('variant').delete().eq('id', id);
      if (error) throw new Error(`variant#${id}: ${error.message}`);
    },
    listSubAssemblies: () => listPayloads<SubAssembly>('sub_assembly'),
    getSubAssembly: (id) => getPayload<SubAssembly>('sub_assembly', id),
    async saveSubAssembly(sa) {
      const { error } = await db.from('sub_assembly').upsert({
        id: sa.id, name: sa.name, category: sa.category ?? null, status: sa.status,
        current_version: sa.current_version, payload: sa,
      });
      if (error) throw new Error(`sub_assembly#${sa.id}: ${error.message}`);
      return sa;
    },
    listInventory: () => listPayloads<InventoryItem>('inventory_item'),
    async saveInventoryItem(item) {
      const { error } = await db.from('inventory_item').upsert({
        id: item.id, material_id: item.material_id, length: item.length ?? null,
        quantity: item.quantity ?? null, status: item.status, payload: item,
      });
      if (error) throw new Error(`inventory_item#${item.id}: ${error.message}`);
      return item;
    },
    listTakeoffs: (projectId) => listPayloadsWhere<Takeoff>('takeoff', 'project_id', projectId),
    getTakeoff: (id) => getPayload<Takeoff>('takeoff', id),
    async saveTakeoff(projectId, takeoff) {
      const { error } = await db.from('takeoff').upsert({
        id: takeoff.id,
        project_id: projectId,
        system_id: takeoff.system_id,
        model_id: takeoff.model_id,
        payload: takeoff,
      });
      if (error) throw new Error(`takeoff#${takeoff.id}: ${error.message}`);
      // keep the parent project payload's takeoffs[] in step (getProject reads the payload)
      await syncProjectTakeoffs(projectId, (ts) => {
        const i = ts.findIndex((t) => t.id === takeoff.id);
        return i >= 0 ? ts.map((t) => (t.id === takeoff.id ? takeoff : t)) : [...ts, takeoff];
      });
      return takeoff;
    },
    async deleteTakeoff(projectId, id) {
      const { error } = await db.from('takeoff').delete().eq('id', id);
      if (error) throw new Error(`takeoff#${id}: ${error.message}`);
      await syncProjectTakeoffs(projectId, (ts) => ts.filter((t) => t.id !== id));
    },
  };

  async function syncProjectTakeoffs(projectId: string, update: (ts: Takeoff[]) => Takeoff[]) {
    const project = await getPayload<Project>('project', projectId);
    if (!project) return;
    const next = update(project.takeoffs ?? []);
    await db.from('project').upsert({
      id: project.id, name: project.name, client: project.client, location: project.location ?? null,
      payload: { ...project, takeoffs: next },
    });
  }
}
