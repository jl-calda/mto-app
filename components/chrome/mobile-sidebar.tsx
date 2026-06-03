'use client';

// The off-canvas mobile navigation drawer: a dimmed backdrop + a left slide-in
// panel that reuses the exact same <SidebarContent> as the desktop rail (no
// duplicated nav markup). Hidden entirely at ≥1024px (lg) where the static
// Sidebar rail is shown instead. State comes from useMobileNav().

import { Logo, Icon, SidebarContent, type RecentItem } from '../chrome';
import { useMobileNav } from './mobile-nav-context';
import { useBodyScrollLock } from './use-body-scroll-lock';

export function MobileSidebarDrawer(props: {
  active?: string;
  counts?: Record<string, number>;
  recent?: RecentItem[];
  source?: 'supabase' | 'memory';
}) {
  const { open, close } = useMobileNav();
  useBodyScrollLock(open);

  return (
    <div className="lg:hidden" aria-hidden={!open}>
      {/* backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20,19,14,.4)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 160ms ease',
        }}
      />
      {/* panel */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 70,
          height: '100dvh', width: 260, maxWidth: '85vw',
          background: 'var(--panel-2)', borderRight: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 180ms ease',
          boxShadow: open ? 'var(--shadow-pop)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'var(--h-topbar)', padding: '0 8px 0 12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size={20} />
            <span style={{ fontWeight: 700, letterSpacing: '0.04em', fontSize: 14 }}>MTO</span>
          </span>
          <button type="button" className="btn ghost sm" onClick={close} aria-label="Close navigation"><Icon.X /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <SidebarContent {...props} />
        </div>
      </aside>
    </div>
  );
}
