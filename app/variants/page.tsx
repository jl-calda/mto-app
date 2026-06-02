import { Shell } from '@/components/shell';
import { VariantsBrowser } from '@/components/variants/variants-browser';
import { getRepo } from '@/lib/repo';

export default async function VariantsPage() {
  const variants = await getRepo().listVariants();
  return (
    <Shell navActive="variants" crumbs={[{ label: 'Variants' }]}>
      <VariantsBrowser variants={variants} />
    </Shell>
  );
}
