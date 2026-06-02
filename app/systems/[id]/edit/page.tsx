import { notFound } from 'next/navigation';
import { Shell } from '@/components/chrome';
import { SystemWizard } from '@/components/system-wizard/SystemWizard';
import { getRepo } from '@/lib/repo';

export default async function EditSystemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const system = await getRepo().getSystem(id);
  if (!system) notFound();
  return (
    <Shell navActive="systems" crumbs={[{ label: 'Systems', href: '/systems' }, { label: system.name, href: `/systems/${system.id}` }, { label: 'Edit' }]}>
      <SystemWizard initial={system} />
    </Shell>
  );
}
