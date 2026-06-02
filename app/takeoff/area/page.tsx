import { Shell } from '@/components/chrome';
import { AreaTakeoff } from '@/components/takeoff/area-takeoff';

// Area primitive take-off (Brief 11 · item 40) — 2D sheet nesting via pack_stock_2d.
export default function AreaTakeoffPage() {
  return (
    <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }, { label: 'Roof sheet cladding · area' }]}>
      <AreaTakeoff title="Roof sheet cladding" />
    </Shell>
  );
}
