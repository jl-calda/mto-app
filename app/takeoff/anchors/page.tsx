import { Shell } from '@/components/chrome';
import { AnchorsTakeoff } from '@/components/takeoff/anchors-takeoff';
import { getRepo } from '@/lib/repo';
import type { VariantSnapshot } from '@/lib/types';

export default async function AnchorsTakeoffPage() {
  const repo = getRepo();
  const system = await repo.getSystem('sys-anchors');
  const models = await repo.listModels('sys-anchors');
  const materials = await repo.listMaterials();
  const model = models[0];

  if (!system || !model) {
    return (
      <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }]}>
        <div className="p-10 text-[13px] text-ink-3">Anchors system not seeded.</div>
      </Shell>
    );
  }

  const variant: VariantSnapshot = {
    source_ref: { kind: 'local', name: 'Standard', attributes: {} },
    attributes: {},
  };
  const criteria: Record<string, string> = { substrate: 'concrete', compliance_code: 'EN_795' };

  return (
    <Shell
      navActive="projects"
      crumbs={[{ label: 'Projects', href: '/' }, { label: 'Roof anchor points · live' }]}
    >
      <AnchorsTakeoff
        system={system}
        model={model}
        materials={materials}
        variant={variant}
        criteria={criteria}
        title="Roof anchor points"
        persist={{ takeoffId: 'tko-anchors', projectId: 'prj-westfield' }}
      />
    </Shell>
  );
}
