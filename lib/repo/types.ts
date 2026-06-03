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
  saveProject(project: Project): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  listSystems(): Promise<System[]>;
  getSystem(id: string): Promise<System | null>;
  /** Upsert a system (authored via the wizard). */
  saveSystem(system: System): Promise<System>;
  /** Delete a system and its nested models (cascade within the aggregate). */
  deleteSystem(id: string): Promise<void>;

  listModels(systemId?: string): Promise<Model[]>;
  getModel(id: string): Promise<Model | null>;
  /** Upsert a model into its parent system. */
  saveModel(model: Model): Promise<Model>;
  /** Remove a model from its parent system. */
  deleteModel(id: string): Promise<void>;

  listMaterials(): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | null>;
  saveMaterial(material: Material): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;

  listVariants(): Promise<Variant[]>;
  getVariant(id: string): Promise<Variant | null>;
  saveVariant(variant: Variant): Promise<Variant>;
  deleteVariant(id: string): Promise<void>;

  listSubAssemblies(): Promise<SubAssembly[]>;
  getSubAssembly(id: string): Promise<SubAssembly | null>;
  saveSubAssembly(sa: SubAssembly): Promise<SubAssembly>;

  listInventory(): Promise<InventoryItem[]>;
  saveInventoryItem(item: InventoryItem): Promise<InventoryItem>;

  listTakeoffs(projectId?: string): Promise<Takeoff[]>;
  getTakeoff(id: string): Promise<Takeoff | null>;
  /** Upsert a take-off into a project (denormalized VariantSnapshot — a correctness law). */
  saveTakeoff(projectId: string, takeoff: Takeoff): Promise<Takeoff>;
  /** Remove a take-off from its project. */
  deleteTakeoff(projectId: string, id: string): Promise<void>;
}
