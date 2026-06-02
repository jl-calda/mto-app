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
    listModels: (systemId) => listPayloadsWhere<Model>('model', 'system_id', systemId),
    getModel: (id) => getPayload<Model>('model', id),
    listMaterials: () => listPayloads<Material>('material'),
    getMaterial: (id) => getPayload<Material>('material', id),
    listVariants: () => listPayloads<Variant>('variant'),
    getVariant: (id) => getPayload<Variant>('variant', id),
    listSubAssemblies: () => listPayloads<SubAssembly>('sub_assembly'),
    getSubAssembly: (id) => getPayload<SubAssembly>('sub_assembly', id),
    listInventory: () => listPayloads<InventoryItem>('inventory_item'),
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
      return takeoff;
    },
  };
}
