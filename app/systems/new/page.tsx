import { Shell } from '@/components/chrome';
import { SystemWizard } from '@/components/system-wizard/SystemWizard';
import type { System } from '@/lib/types';

export default function NewSystemPage() {
  const blank: System = {
    id: `sys-${crypto.randomUUID().slice(0, 8)}`,
    name: 'Untitled system',
    description: '',
    primitive: { kind: 'length', segmentable: false },
    modifiers: [],
    variants: { attribute_columns: [], rows: [{ kind: 'local', name: 'Standard', attributes: {} }] },
    criteria: [],
    properties: [],
    models: [],
  };
  return (
    <Shell navActive="systems" crumbs={[{ label: 'Systems', href: '/systems' }, { label: 'New system' }]}>
      <SystemWizard initial={blank} isNew />
    </Shell>
  );
}
