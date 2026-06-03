import type { ReactNode } from 'react';
import { TopBar, Sidebar, type Crumb, type RecentItem } from './chrome';
import { HelpProvider } from './help/help-context';
import { HelpLayout } from './help/help-layout';
import { GuideButton } from './help/guide-button';
import { getRepo, getRepoSource } from '@/lib/repo';
import { topicForNav } from '@/lib/help/content';

// The data-aware app frame: a server component that reads real nav counts + recent
// take-offs from the repo and composes the presentational TopBar / Sidebar.

function takeoffHref(kind?: string): string {
  return kind === 'height' ? '/takeoff/ladder' : kind === 'count' ? '/takeoff/anchors' : kind === 'length' ? '/takeoff/guardrail' : kind === 'area' || kind === 'volume' ? '/takeoff/area' : '#';
}
const DOT: Record<string, string> = { height: 'var(--prim-height)', count: 'var(--prim-count)', length: 'var(--prim-length)' };

export async function Shell({
  crumbs,
  navActive,
  topRight,
  sidebar = true,
  children,
  scroll = true,
}: {
  crumbs?: Crumb[];
  navActive?: string;
  topRight?: ReactNode;
  sidebar?: boolean;
  children?: ReactNode;
  scroll?: boolean;
}) {
  let counts: Record<string, number> | undefined;
  let recent: RecentItem[] | undefined;
  if (sidebar) {
    const repo = getRepo();
    const [projects, systems, variants, subs, materials, inventory] = await Promise.all([
      repo.listProjects(), repo.listSystems(), repo.listVariants(), repo.listSubAssemblies(), repo.listMaterials(), repo.listInventory(),
    ]);
    counts = {
      projects: projects.length, systems: systems.length, variants: variants.length,
      subassemblies: subs.length, materials: materials.length, inventory: inventory.length,
    };
    const kindBySys = new Map(systems.map((s) => [s.id, s.primitive.kind]));
    recent = projects.flatMap((p) => p.takeoffs).slice(0, 4).map((t) => {
      const k = kindBySys.get(t.system_id);
      return { label: t.name, href: takeoffHref(k), color: DOT[k ?? ''] ?? 'var(--ink-4)' };
    });
    recent.push({ label: 'Roof sheet cladding', href: '/takeoff/area', color: '#5A8F2A', tag: 'v3' });
  }

  return (
    <HelpProvider defaultTopic={topicForNav(navActive)}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar crumbs={crumbs} right={<><GuideButton />{topRight}</>} env={process.env.VERCEL_ENV ?? 'dev'} />
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {sidebar && <Sidebar active={navActive} counts={counts} recent={recent} source={getRepoSource()} />}
          <HelpLayout scroll={scroll}>{children}</HelpLayout>
        </div>
      </div>
    </HelpProvider>
  );
}
