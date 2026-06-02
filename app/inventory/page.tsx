import { Shell } from '@/components/shell';
import { InventoryBrowser } from '@/components/inventory/inventory-browser';
import { getRepo } from '@/lib/repo';

export default async function InventoryPage() {
  const repo = getRepo();
  const [inventory, materials] = await Promise.all([repo.listInventory(), repo.listMaterials()]);
  return (
    <Shell navActive="inventory" crumbs={[{ label: 'Inventory' }]}>
      <InventoryBrowser inventory={inventory} materials={materials} />
    </Shell>
  );
}
