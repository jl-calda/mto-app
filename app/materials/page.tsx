import { Shell } from '@/components/chrome';
import { ResourcePlaceholder } from '@/components/placeholder';
import { getRepo } from '@/lib/repo';

export default async function MaterialsPage() {
  const materials = await getRepo().listMaterials();
  return (
    <Shell navActive="materials" crumbs={[{ label: 'Materials' }]}>
      <ResourcePlaceholder
        title="Materials"
        count={materials.length}
        note="The global SKU catalogue. Browse and CRUD — including the cuttable stock-option fields the engine reads — arrive in Brief 03."
      />
    </Shell>
  );
}
