'use client';

// Renders the scrollable <main> plus the collapsible Guide <aside> as flex
// siblings. When the panel opens, the aside takes 400px and main reflows — the
// "push" is the natural flex consequence. The aside mirrors the Sidebar's sticky
// full-height pattern so it scrolls independently and the topbar stays put.

import type { ReactNode } from 'react';
import { useHelp } from './help-context';
import { HelpPanel } from './help-panel';

export function HelpLayout({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { open } = useHelp();
  return (
    <>
      <main style={{ flex: 1, minWidth: 0, overflow: scroll ? 'auto' : 'hidden', background: 'var(--bg)' }}>
        {children}
      </main>
      <aside
        aria-hidden={!open}
        style={{
          width: open ? 400 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          borderLeft: open ? '1px solid var(--line)' : 'none',
          background: 'var(--panel-2)',
          position: 'sticky',
          top: 'var(--h-topbar)',
          height: 'calc(100vh - var(--h-topbar))',
          transition: 'width 160ms ease',
        }}
      >
        {open && <HelpPanel />}
      </aside>
    </>
  );
}
