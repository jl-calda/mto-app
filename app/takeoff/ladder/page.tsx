import { Shell } from '@/components/chrome';
import { PrimitiveTakeoff } from '@/components/takeoff/primitive-takeoff';
import { getRepo } from '@/lib/repo';

// Rewired from the original static port to the real engine (Brief 06/07/08/09):
// height primitive → auto-split flights, spacing (rungs/brackets), threshold (cage
// hoops), pack_stock (stiles), derived rest-platforms, the wall-bracket sub-assembly
// inlined, and the top-walkway attachment resolved recursively — all computed live.
export default async function LadderTakeoffPage() {
  const repo = getRepo();
  const system = await repo.getSystem('sys-ladder');
  const models = await repo.listModels('sys-ladder');
  const materials = await repo.listMaterials();
  const subAssemblies = await repo.listSubAssemblies();
  const allSystems = await repo.listSystems();
  const model = models[0];

  if (!system || !model) {
    return (
      <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }]}>
        <div className="p-10 text-[13px] text-ink-3">Ladder system not seeded.</div>
      </Shell>
    );
  }

  const criteria: Record<string, string> = {
    compliance_code: 'NF E85-016',
    material_finish: 'anodized',
    load_class: '1',
  };

  // systems this ladder can attach (resolved by the engine recursively)
  const attachIds = new Set((system.attachments ?? []).map((a) => a.attached_system_id));
  const attachableSystems = allSystems.filter((s) => attachIds.has(s.id));

  return (
    <Shell
      navActive="projects"
      crumbs={[
        { label: 'Projects', href: '/' },
        { label: 'Westfield Sky Garden L08', href: '/projects/prj-westfield' },
        { label: 'Plant access ladder · L1→L4' },
      ]}
    >
      <PrimitiveTakeoff
        system={system}
        model={model}
        materials={materials}
        criteria={criteria}
        title="Plant access ladder · L1→L4"
        primitive="height"
        initial={9200}
        initialVariant={1}
        iconName="ladder"
        subAssemblies={subAssemblies}
        attachableSystems={attachableSystems}
      />
    </Shell>
  );
}
