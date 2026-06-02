import { notFound } from 'next/navigation';
import { Shell } from '@/components/shell';
import { ModelEditor } from '@/components/model/model-editor';
import { getRepo } from '@/lib/repo';
import type { Model } from '@/lib/types';

export default async function NewModelPage({ searchParams }: { searchParams: Promise<{ system?: string }> }) {
  const { system: systemId } = await searchParams;
  const repo = getRepo();
  const system = systemId ? await repo.getSystem(systemId) : null;
  if (!system) notFound();
  const materials = await repo.listMaterials();
  const blank: Model = {
    id: `mdl-${crypto.randomUUID().slice(0, 8)}`,
    name: 'Untitled model', system_id: system.id, status: 'draft',
    modifier_defaults: {}, materials: [], sub_assembly_uses: [], sku_lookups: [], criteria_driven_defaults: [],
  };
  return (
    <Shell navActive="systems" crumbs={[{ label: 'Systems', href: '/systems' }, { label: system.name, href: `/systems/${system.id}` }, { label: 'New model' }]}>
      <ModelEditor system={system} model={blank} materials={materials} isNew />
    </Shell>
  );
}
