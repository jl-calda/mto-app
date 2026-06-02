import { Shell } from '@/components/chrome';
import { ResourcePlaceholder } from '@/components/placeholder';
import { getRepo } from '@/lib/repo';

export default async function InventoryPage() {
  const inventory = await getRepo().listInventory();
  return (
    <Shell navActive="inventory" crumbs={[{ label: 'Inventory' }]}>
      <ResourcePlaceholder
        title="Inventory"
        count={inventory.length}
        note="Cross-project stock & offcut pool with the reservation lifecycle. Arrives in Brief 11 (v3)."
      />
    </Shell>
  );
}
