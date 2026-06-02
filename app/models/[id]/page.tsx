import { notFound } from 'next/navigation';
import { Shell } from '@/components/shell';
import { ModelEditor } from '@/components/model/model-editor';
import { getRepo } from '@/lib/repo';

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const model = await repo.getModel(id);
  if (!model) notFound();
  const system = await repo.getSystem(model.system_id);
  if (!system) notFound();
  const materials = await repo.listMaterials();

  return (
    <Shell
      navActive="systems"
      crumbs={[
        { label: 'Systems', href: '/systems' },
        { label: system.name, href: `/systems/${system.id}` },
        { label: model.name },
      ]}
    >
      <ModelEditor system={system} model={model} materials={materials} />
    </Shell>
  );
}
