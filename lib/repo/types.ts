// Repository interface — async-shaped from day one so the Supabase implementation
// drops in behind it without changing call sites. Models are queried via their
// parent System; take-offs via their parent Project.

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

export interface Repository {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;

  listSystems(): Promise<System[]>;
  getSystem(id: string): Promise<System | null>;
  /** Upsert a system (authored via the wizard). */
  saveSystem(system: System): Promise<System>;

  listModels(systemId?: string): Promise<Model[]>;
  getModel(id: string): Promise<Model | null>;

  listMaterials(): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | null>;

  listVariants(): Promise<Variant[]>;
  getVariant(id: string): Promise<Variant | null>;

  listSubAssemblies(): Promise<SubAssembly[]>;
  getSubAssembly(id: string): Promise<SubAssembly | null>;

  listInventory(): Promise<InventoryItem[]>;

  listTakeoffs(projectId?: string): Promise<Takeoff[]>;
  getTakeoff(id: string): Promise<Takeoff | null>;
  /** Upsert a take-off into a project (denormalized VariantSnapshot — a correctness law). */
  saveTakeoff(projectId: string, takeoff: Takeoff): Promise<Takeoff>;
}
