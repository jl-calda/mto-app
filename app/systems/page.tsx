import { Shell } from '@/components/chrome';
import { ResourcePlaceholder } from '@/components/placeholder';
import { getRepo } from '@/lib/repo';

export default async function SystemsPage() {
  const systems = await getRepo().listSystems();
  return (
    <Shell navActive="systems" crumbs={[{ label: 'Systems' }]}>
      <ResourcePlaceholder
        title="Systems"
        count={systems.length}
        note="Global input contracts — what to measure and which design choices to offer. Browse, detail, and the 4-step authoring wizard arrive in Brief 04."
      />
    </Shell>
  );
}
