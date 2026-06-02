import { Shell } from '@/components/chrome';
import { ResourcePlaceholder } from '@/components/placeholder';
import { getRepo } from '@/lib/repo';

export default async function VariantsPage() {
  const variants = await getRepo().listVariants();
  return (
    <Shell navActive="variants" crumbs={[{ label: 'Variants' }]}>
      <ResourcePlaceholder
        title="Variants"
        count={variants.length}
        note="Global design-family alternatives, versioned with snapshot semantics. CRUD lands in Brief 03; version history, diff, and pin policy in Brief 10."
      />
    </Shell>
  );
}
