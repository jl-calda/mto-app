import { notFound } from 'next/navigation';
import { Shell } from '@/components/shell';
import { SystemWizard } from '@/components/system-wizard/SystemWizard';
import { getRepo } from '@/lib/repo';

export default async function EditSystemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const system = await repo.getSystem(id);
  if (!system) notFound();
  const materials = await repo.listMaterials();
  return (
    <Shell navActive="systems" crumbs={[{ label: 'Systems', href: '/systems' }, { label: system.name, href: `/systems/${system.id}` }, { label: 'Edit' }]}>
      <SystemWizard initial={system} materials={materials} />
    </Shell>
  );
}
