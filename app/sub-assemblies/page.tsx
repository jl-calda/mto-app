import { Shell } from '@/components/chrome';
import { ResourcePlaceholder } from '@/components/placeholder';
import { getRepo } from '@/lib/repo';

export default async function SubAssembliesPage() {
  const subs = await getRepo().listSubAssemblies();
  return (
    <Shell navActive="subassemblies" crumbs={[{ label: 'Sub-assemblies' }]}>
      <ResourcePlaceholder
        title="Sub-assemblies"
        count={subs.length}
        note="Parametric, reusable material bundles referenced by models. Browse and the draft-state authoring editor arrive in Brief 09."
      />
    </Shell>
  );
}
