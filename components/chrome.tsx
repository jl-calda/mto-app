'use client';
// Shared app chrome — top bar, breadcrumb, sidebar nav, footer, small bits.
// Ported from the design bundle's chrome.jsx. Expects globals.css (tokens) loaded.

import Link from 'next/link';
import type { CSSProperties, ReactNode, SVGProps } from 'react';
import { Fragment } from 'react';
import { useMobileNav } from './chrome/mobile-nav-context';

type IconProps = SVGProps<SVGSVGElement>;

// ---- inline SVG icons (no font deps) ----
export const Icon = {
  Folder: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h2.79a1 1 0 0 1 .7.29l.92.92a1 1 0 0 0 .7.29h4.39a1 1 0 0 1 1 1V11a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V3.5Z" stroke="currentColor" strokeWidth="1.25" /></svg>
  ),
  Box: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M7 1.5l5 2.5v5L7 12 2 9V4l5-2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /><path d="M2 4l5 2.5L12 4M7 6.5V12" stroke="currentColor" strokeWidth="1.25" /></svg>
  ),
  Layers: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M7 1.5l5.5 2.75L7 7 1.5 4.25 7 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /><path d="M1.5 7L7 9.75 12.5 7M1.5 9.75L7 12.5l5.5-2.75" stroke="currentColor" strokeWidth="1.25" /></svg>
  ),
  Bolt: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M8 1.5L2 8h4l-1 4.5L11 6H7l1-4.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /></svg>
  ),
  Plus: (p: IconProps) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...p}><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  ),
  Menu: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Chev: (p: IconProps) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...p}><path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  ChevDown: (p: IconProps) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...p}><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  Dot: (p: IconProps) => (
    <svg width="6" height="6" viewBox="0 0 6 6" {...p}><circle cx="3" cy="3" r="2" fill="currentColor" /></svg>
  ),
  Search: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.25" /><path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Settings: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.25" /><path d="M7 1v1.5M7 11.5V13M13 7h-1.5M2.5 7H1M11 11l-1-1M4 4L3 3M11 3l-1 1M4 10l-1 1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Info: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.25" /><path d="M7 6.5v3M7 4.5v.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Warn: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M7 2l5.5 9.5h-11L7 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /><path d="M7 6v2.5M7 10v.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Check: (p: IconProps) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...p}><path d="M2.5 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  X: (p: IconProps) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...p}><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  ),
  Drag: (p: IconProps) => (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" {...p}><circle cx="3" cy="3" r="1" /><circle cx="7" cy="3" r="1" /><circle cx="3" cy="7" r="1" /><circle cx="7" cy="7" r="1" /><circle cx="3" cy="11" r="1" /><circle cx="7" cy="11" r="1" /></svg>
  ),
  Expand: (p: IconProps) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...p}><path d="M2 5V2h3M10 5V2H7M2 7v3h3M10 7v3H7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Branch: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><circle cx="3" cy="3" r="1.4" stroke="currentColor" strokeWidth="1.25" /><circle cx="3" cy="11" r="1.4" stroke="currentColor" strokeWidth="1.25" /><circle cx="11" cy="7" r="1.4" stroke="currentColor" strokeWidth="1.25" /><path d="M3 4.5v5M4.5 3h2.5a2 2 0 0 1 2 2v0a2 2 0 0 0 2 2H10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Stack: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><rect x="1.5" y="3.5" width="11" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.25" /><rect x="1.5" y="7.5" width="11" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.25" /></svg>
  ),
  Bin: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M2 3.5h10M3.5 3.5l.5 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8M5.5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Users: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.25" /><path d="M1.5 12c0-1.9 1.6-3.5 3.5-3.5S8.5 10.1 8.5 12" stroke="currentColor" strokeWidth="1.25" /><circle cx="10" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.25" /><path d="M9 8.5h1c1.4 0 2.5 1.1 2.5 2.5" stroke="currentColor" strokeWidth="1.25" /></svg>
  ),
  Cube: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M7 1.5l5 2.5v6L7 12.5 2 10V4l5-2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /><path d="M2 4l5 2.5L12 4M7 6.5V12.5" stroke="currentColor" strokeWidth="1.25" /></svg>
  ),
  Square: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><rect x="2" y="2" width="10" height="10" stroke="currentColor" strokeWidth="1.25" /></svg>
  ),
  History: (p: IconProps) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M7 2.5a4.5 4.5 0 1 0 4.5 4.5h-1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /><path d="M11.5 2v3h-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 4.5V7l1.5 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
  ),
  Lock: (p: IconProps) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...p}><rect x="2" y="5.5" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" /><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" stroke="currentColor" strokeWidth="1.25" /></svg>
  ),
};

// Logo mark — engineering-drawing style crosshair-in-square
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <rect x="2.5" y="2.5" width="19" height="19" stroke="#14130E" strokeWidth="1.5" />
      <path d="M12 5.5V18.5M5.5 12H18.5" stroke="#14130E" strokeWidth="1" />
      <circle cx="12" cy="12" r="3" stroke="#C44A20" strokeWidth="1.5" fill="#fff" />
      <circle cx="12" cy="12" r="0.8" fill="#C44A20" />
    </svg>
  );
}

export type Crumb = { label: string; href?: string };

// Hamburger — opens the off-canvas mobile nav drawer. Mobile-only (lg:hidden);
// the desktop rail is always visible so no toggle is needed there.
export function NavToggleButton() {
  const { toggle } = useMobileNav();
  return (
    <button
      type="button"
      onClick={toggle}
      className="btn ghost sm lg:hidden"
      aria-label="Open navigation"
      style={{ padding: '0 6px' }}
    >
      <Icon.Menu />
    </button>
  );
}

// ----- TOP BAR -----
export function TopBar({
  crumbs = [],
  right = null,
  env = 'dev',
  showNavToggle = false,
}: {
  crumbs?: Crumb[];
  right?: ReactNode;
  env?: string;
  showNavToggle?: boolean;
}) {
  return (
    <header style={tbStyles.bar}>
      <div style={tbStyles.left}>
        {showNavToggle && <NavToggleButton />}
        <Link href="/" style={tbStyles.brand}>
          <Logo size={20} />
          <span style={tbStyles.brandName}>MTO</span>
          <span style={tbStyles.brandSub} className="mono">// take-off engine</span>
        </Link>
        <div style={tbStyles.sep} />
        <nav style={tbStyles.crumbs}>
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              {i > 0 && <span style={tbStyles.crumbSep}><Icon.Chev /></span>}
              {c.href ? (
                <Link href={c.href} style={tbStyles.crumbLink}>{c.label}</Link>
              ) : (
                <span style={tbStyles.crumbCur}>{c.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
      </div>
      <div style={tbStyles.right}>
        {right}
        <div style={tbStyles.envTag} className="mono">env:{env}</div>
        <div style={tbStyles.user}>
          <div style={tbStyles.avatar}>M</div>
        </div>
      </div>
    </header>
  );
}

const tbStyles: Record<string, CSSProperties> = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 'var(--h-topbar)', padding: '0 12px 0 14px',
    background: 'var(--panel)', borderBottom: '1px solid var(--line-2)',
    position: 'sticky', top: 0, zIndex: 50,
  },
  left: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--ink)' },
  brandName: { fontWeight: 700, letterSpacing: '0.04em', fontSize: 14 },
  brandSub: { color: 'var(--ink-3)', fontSize: 11, fontWeight: 400 },
  sep: { width: 1, height: 20, background: 'var(--line-2)' },
  crumbs: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, minWidth: 0, flexWrap: 'nowrap', overflow: 'hidden' },
  crumbSep: { color: 'var(--ink-4)', display: 'flex', flexShrink: 0 },
  crumbLink: { color: 'var(--ink-2)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 },
  crumbCur: { color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  envTag: {
    fontSize: 10, color: 'var(--ink-3)',
    padding: '2px 6px', border: '1px solid var(--line)', borderRadius: 2,
  },
  user: { display: 'flex' },
  avatar: {
    width: 24, height: 24, borderRadius: 12, background: 'var(--ink)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600,
  },
};

type NavItem = { id: string; label: string; href: string; icon: ReactNode; tag?: string };
export type RecentItem = { label: string; href: string; color: string; tag?: string };

type SidebarProps = { active?: string; counts?: Record<string, number>; recent?: RecentItem[]; source?: 'supabase' | 'memory' };

// The nav body (items + recent + footer), shared verbatim by the desktop rail
// (<Sidebar>) and the mobile off-canvas drawer (<MobileSidebarDrawer>). Renders
// as a fragment so each shell supplies its own scrollable flex-column container.
export function SidebarContent({ active = 'projects', counts, recent, source = 'memory' }: SidebarProps) {
  const items: NavItem[] = [
    { id: 'projects', label: 'Projects', href: '/', icon: <Icon.Folder /> },
    { id: 'systems', label: 'Systems', href: '/systems', icon: <Icon.Layers /> },
    { id: 'variants', label: 'Variants', href: '/variants', icon: <Icon.Branch /> },
    { id: 'subassemblies', label: 'Sub-assemblies', href: '/sub-assemblies', icon: <Icon.Stack /> },
    { id: 'materials', label: 'Materials', href: '/materials', icon: <Icon.Box /> },
    { id: 'inventory', label: 'Inventory', href: '/inventory', icon: <Icon.Bin />, tag: 'v3' },
  ];
  return (
    <>
      <div style={sbStyles.section}>
        <div className="uc" style={{ padding: '8px 12px 4px' }}>Workspace</div>
        {items.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            style={{ ...sbStyles.item, ...(active === it.id ? sbStyles.itemActive : null) }}
          >
            <span style={sbStyles.itemIcon}>{it.icon}</span>
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.tag && <span style={sbStyles.itemTag} className="mono">{it.tag}</span>}
            {counts?.[it.id] != null && <span className="mono" style={sbStyles.itemCount}>{counts[it.id]}</span>}
          </Link>
        ))}
      </div>
      {recent && recent.length > 0 && (
        <div style={sbStyles.section}>
          <div className="uc" style={{ padding: '12px 12px 4px' }}>Recent</div>
          {recent.map((r, i) => (
            <Link key={i} href={r.href} style={sbStyles.itemSm}>
              <Icon.Dot style={{ color: r.color }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
              {r.tag && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--annotation)' }} className="mono">{r.tag}</span>}
            </Link>
          ))}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div style={sbStyles.foot}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
          mto · {source === 'supabase' ? 'supabase · live' : 'in-memory seed'}
        </div>
      </div>
    </>
  );
}

// ----- SIDEBAR (global nav, desktop rail) -----
// Hidden below lg, where <MobileSidebarDrawer> takes over.
export function Sidebar(props: SidebarProps) {
  return (
    <aside className="hidden lg:flex" style={sbStyles.bar}>
      <SidebarContent {...props} />
    </aside>
  );
}

const sbStyles: Record<string, CSSProperties> = {
  bar: {
    width: 220, background: 'var(--panel-2)', borderRight: '1px solid var(--line)',
    flexDirection: 'column', flexShrink: 0,
    position: 'sticky', top: 'var(--h-topbar)', height: 'calc(100vh - var(--h-topbar))',
  },
  section: { paddingBottom: 4 },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 12px', height: 28,
    fontSize: 13, color: 'var(--ink-2)', textDecoration: 'none',
    margin: '1px 6px', borderRadius: 4,
  },
  itemActive: { background: 'var(--selected)', color: 'var(--accent)', fontWeight: 500 },
  itemIcon: { display: 'flex', color: 'var(--ink-3)' },
  itemCount: { fontSize: 11, color: 'var(--ink-4)' },
  itemTag: {
    fontSize: 8, color: 'var(--annotation)', background: 'var(--annotation-soft)',
    padding: '0 4px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
  },
  itemSm: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 12px', height: 24,
    fontSize: 12, color: 'var(--ink-2)', textDecoration: 'none',
    margin: '0 6px', borderRadius: 4,
  },
  foot: { padding: 12, borderTop: '1px solid var(--line)' },
};

// Shell (the data-aware app frame) lives in components/shell.tsx (server) so it
// can read the repo for nav counts without dragging server-only into this client
// module. TopBar / Sidebar above are the presentational pieces it composes.

// ----- page header (inside main) -----
export function PageHeader({
  title,
  subtitle,
  actions,
  meta,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div style={phStyles.bar}>
      <div style={phStyles.left}>
        <h1 style={phStyles.title}>{title}</h1>
        {subtitle && <div style={phStyles.subtitle}>{subtitle}</div>}
        {meta && <div style={phStyles.meta}>{meta}</div>}
      </div>
      <div style={phStyles.actions}>{actions}</div>
    </div>
  );
}

const phStyles: Record<string, CSSProperties> = {
  bar: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    padding: '20px 24px 16px', gap: 16,
    borderBottom: '1px solid var(--line)',
  },
  left: { minWidth: 0 },
  title: { margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' },
  subtitle: { marginTop: 4, fontSize: 12, color: 'var(--ink-3)' },
  meta: { marginTop: 6, display: 'flex', gap: 8 },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },
};

// ----- small reusable bits -----
type PrimitiveKind = 'length' | 'segmented_length' | 'height' | 'count';

export function PrimitiveBadge({ kind, mini = false }: { kind: PrimitiveKind; mini?: boolean }) {
  const labels: Record<PrimitiveKind, string> = {
    length: 'length', segmented_length: 'segmented_length', height: 'height', count: 'count',
  };
  const cls = kind.replace('segmented_length', 'seglength');
  if (mini) {
    return (
      <span className="tag" style={{
        color: `var(--prim-${cls})`, background: 'transparent',
        border: '1px solid currentColor',
      }}>{labels[kind]}</span>
    );
  }
  return <span className={`chip ${cls} dot`}>{labels[kind]}</span>;
}

export function StatusDot({ status }: { status: 'ok' | 'warn' | 'err' | 'draft' }) {
  const colors: Record<string, string> = { ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)', draft: 'var(--ink-4)' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: colors[status] }} />;
}

// Stat — compact "label / value" pair used in page headers.
export function Stat({ k, v, highlight }: { k: string; v: ReactNode; highlight?: 'warn' | 'err' }) {
  const color = highlight === 'warn' ? 'var(--warn)' : highlight === 'err' ? 'var(--err)' : 'var(--ink)';
  return (
    <div style={{ padding: '4px 14px', borderRight: '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
    </div>
  );
}
