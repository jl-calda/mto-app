import type { Repository } from './types';
import { seed } from './seed';

const allModels = () => seed.systems.flatMap((s) => s.models);
const allTakeoffs = () => seed.projects.flatMap((p) => p.takeoffs);

/** Synchronous seed behind the async Repository interface (v1). */
export function createMemoryRepo(): Repository {
  return {
    async listProjects() {
      return seed.projects;
    },
    async getProject(id) {
      return seed.projects.find((p) => p.id === id) ?? null;
    },
    async listSystems() {
      return seed.systems;
    },
    async getSystem(id) {
      return seed.systems.find((s) => s.id === id) ?? null;
    },
    async listModels(systemId) {
      const all = allModels();
      return systemId ? all.filter((m) => m.system_id === systemId) : all;
    },
    async getModel(id) {
      return allModels().find((m) => m.id === id) ?? null;
    },
    async listMaterials() {
      return seed.materials;
    },
    async getMaterial(id) {
      return seed.materials.find((m) => m.id === id) ?? null;
    },
    async listVariants() {
      return seed.variants;
    },
    async getVariant(id) {
      return seed.variants.find((v) => v.id === id) ?? null;
    },
    async listSubAssemblies() {
      return seed.subAssemblies;
    },
    async getSubAssembly(id) {
      return seed.subAssemblies.find((s) => s.id === id) ?? null;
    },
    async listInventory() {
      return seed.inventory;
    },
    async listTakeoffs(projectId) {
      return projectId
        ? (seed.projects.find((p) => p.id === projectId)?.takeoffs ?? [])
        : allTakeoffs();
    },
    async getTakeoff(id) {
      return allTakeoffs().find((t) => t.id === id) ?? null;
    },
  };
}
