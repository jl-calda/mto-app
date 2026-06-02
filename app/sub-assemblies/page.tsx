import { Shell } from '@/components/chrome';
import { SubAssembliesBrowser, type Usage } from '@/components/subassemblies/subassemblies-browser';
import { getRepo } from '@/lib/repo';

export default async function SubAssembliesPage() {
  const repo = getRepo();
  const [subs, materials, systems] = await Promise.all([
    repo.listSubAssemblies(),
    repo.listMaterials(),
    repo.listSystems(),
  ]);

  // compute "used in": which models reference each sub-assembly
  const usedIn: Record<string, Usage[]> = {};
  for (const sys of systems) {
    for (const model of sys.models) {
      for (const use of model.sub_assembly_uses ?? []) {
        (usedIn[use.sub_assembly_id] ??= []).push({ model_id: model.id, model_name: model.name, system_name: sys.name });
      }
    }
  }

  return (
    <Shell navActive="subassemblies" crumbs={[{ label: 'Sub-assemblies' }]}>
      <SubAssembliesBrowser subs={subs} materials={materials} usedIn={usedIn} />
    </Shell>
  );
}
