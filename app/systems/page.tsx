import { Shell } from '@/components/shell';
import { SystemsBrowser } from '@/components/systems/systems-browser';
import { getRepo } from '@/lib/repo';

export default async function SystemsPage() {
  const systems = await getRepo().listSystems();
  return (
    <Shell navActive="systems" crumbs={[{ label: 'Systems' }]}>
      <SystemsBrowser systems={systems} />
    </Shell>
  );
}
