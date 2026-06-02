import { Shell } from '@/components/shell';
import { MaterialsBrowser } from '@/components/materials/materials-browser';
import { getRepo } from '@/lib/repo';

export default async function MaterialsPage() {
  const materials = await getRepo().listMaterials();
  return (
    <Shell navActive="materials" crumbs={[{ label: 'Materials' }]}>
      <MaterialsBrowser materials={materials} />
    </Shell>
  );
}
