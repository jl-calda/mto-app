import { Shell } from '@/components/chrome';
import { PrimitiveTakeoff } from '@/components/takeoff/primitive-takeoff';
import { getRepo } from '@/lib/repo';

export default async function GuardrailTakeoffPage() {
  const repo = getRepo();
  const system = await repo.getSystem('sys-guardrail');
  const models = await repo.listModels('sys-guardrail');
  const materials = await repo.listMaterials();
  const model = models[0];

  if (!system || !model) {
    return (
      <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }]}>
        <div className="p-10 text-[13px] text-ink-3">Guardrail system not seeded.</div>
      </Shell>
    );
  }

  const criteria: Record<string, string> = { compliance_code: 'EN_ISO_14122-3', material_finish: 'ss316' };

  return (
    <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }, { label: 'East elev. guardrail · live' }]}>
      <PrimitiveTakeoff
        system={system}
        model={model}
        materials={materials}
        criteria={criteria}
        title="East elevation guardrail"
        primitive="length"
        initial={24000}
        iconName="post"
        persist={{ takeoffId: 'tko-guardrail', projectId: 'prj-westfield' }}
      />
    </Shell>
  );
}
