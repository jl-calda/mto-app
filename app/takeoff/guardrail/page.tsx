import { Shell } from '@/components/shell';
import { PrimitiveTakeoff } from '@/components/takeoff/primitive-takeoff';
import { getRepo } from '@/lib/repo';
import { deriveCriteria, derivePrimitiveTotal, deriveVariantIndex } from '@/lib/takeoff-init';

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

  const takeoff = await repo.getTakeoff('tko-guardrail');
  const criteria = deriveCriteria(system, takeoff);

  return (
    <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }, { label: 'East elev. guardrail · live' }]}>
      <PrimitiveTakeoff
        system={system}
        model={model}
        materials={materials}
        criteria={criteria}
        title="East elevation guardrail"
        primitive="length"
        initial={derivePrimitiveTotal(takeoff) ?? 24000}
        initialVariant={deriveVariantIndex(system, takeoff)}
        iconName="post"
        initialProps={takeoff?.property_values}
        initialModifiers={takeoff?.modifier_values}
        persist={{ takeoffId: 'tko-guardrail', projectId: 'prj-westfield' }}
      />
    </Shell>
  );
}
