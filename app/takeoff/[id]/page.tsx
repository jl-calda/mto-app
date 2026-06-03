import { notFound } from 'next/navigation';
import { Shell } from '@/components/shell';
import { PrimitiveTakeoff } from '@/components/takeoff/primitive-takeoff';
import { AnchorsTakeoff } from '@/components/takeoff/anchors-takeoff';
import { getRepo } from '@/lib/repo';
import { deriveCriteria, derivePrimitiveTotal, deriveVariantIndex } from '@/lib/takeoff-init';
import type { Crumb } from '@/components/chrome';

// Generic take-off screen for any saved Takeoff (the static /takeoff/{ladder,...}
// routes still win for those words; this handles take-off ids like tko-…).
export default async function TakeoffByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const takeoff = await repo.getTakeoff(id);
  if (!takeoff) notFound();
  const system = await repo.getSystem(takeoff.system_id);
  const models = await repo.listModels(takeoff.system_id);
  const model = models.find((m) => m.id === takeoff.model_id) ?? models[0];
  if (!system || !model) notFound();
  const materials = await repo.listMaterials();
  const projects = await repo.listProjects();
  const project = projects.find((p) => p.takeoffs.some((t) => t.id === id));
  const persist = project ? { takeoffId: id, projectId: project.id } : undefined;
  const criteria = deriveCriteria(system, takeoff);
  const crumbs: Crumb[] = [
    { label: 'Projects', href: '/' },
    ...(project ? [{ label: project.name, href: `/projects/${project.id}` }] : []),
    { label: takeoff.name },
  ];
  const kind = system.primitive.kind;

  if (kind === 'count') {
    return (
      <Shell navActive="projects" crumbs={crumbs}>
        <AnchorsTakeoff system={system} model={model} materials={materials} variant={takeoff.variant_choice} criteria={criteria} title={takeoff.name} initial={derivePrimitiveTotal(takeoff) ?? 12} persist={persist} />
      </Shell>
    );
  }
  if (kind === 'length' || kind === 'height') {
    const [subAssemblies, allSystems, inventory] = await Promise.all([repo.listSubAssemblies(), repo.listSystems(), repo.listInventory()]);
    const attachIds = new Set((system.attachments ?? []).map((a) => a.attached_system_id));
    const attachableSystems = allSystems.filter((s) => attachIds.has(s.id));
    return (
      <Shell navActive="projects" crumbs={crumbs}>
        <PrimitiveTakeoff
          system={system} model={model} materials={materials} criteria={criteria} title={takeoff.name}
          primitive={kind} initial={derivePrimitiveTotal(takeoff) ?? (kind === 'height' ? 9450 : 24000)}
          initialVariant={deriveVariantIndex(system, takeoff)} iconName={kind === 'height' ? 'ladder' : 'post'}
          subAssemblies={subAssemblies} attachableSystems={attachableSystems} inventory={inventory} persist={persist}
          initialProps={takeoff.property_values}
        />
      </Shell>
    );
  }
  // area / volume take-offs use the bespoke /takeoff/area screen
  notFound();
}
