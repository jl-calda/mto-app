'use client';

// Renders the scrollable <main> plus the Guide. On desktop (lg+) the Guide is a
// collapsible flex-sibling <aside> that takes 400px and pushes main (the natural
// flex consequence). Below lg that would crush a phone, so the Guide instead
// renders as a fixed right-side overlay drawer with a dimmed backdrop, leaving
// main full-width. Both share one <HelpPanel> (mounted only when open); only one
// is ever display-visible at a time.

import type { ReactNode } from 'react';
import { useHelp } from './help-context';
import { HelpPanel } from './help-panel';
import { useBodyScrollLock } from '@/components/chrome/use-body-scroll-lock';

export function HelpLayout({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { open, close } = useHelp();
  useBodyScrollLock(open); // mobile-only (no-op ≥lg, so the desktop push panel keeps main scrollable)
  return (
    <>
      <main style={{ flex: 1, minWidth: 0, maxWidth: '100vw', overflow: scroll ? 'auto' : 'hidden', background: 'var(--bg)' }}>
        {children}
      </main>

      {/* desktop: push panel */}
      <aside
        aria-hidden={!open}
        className="hidden lg:block"
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

      {/* mobile: fixed overlay drawer + backdrop */}
      <div className="lg:hidden" aria-hidden={!open}>
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20,19,14,.4)',
            opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 160ms ease',
          }}
        />
        <aside
          style={{
            position: 'fixed', top: 'var(--h-topbar)', right: 0, bottom: 0, zIndex: 70,
            width: 'min(400px, 100vw)',
            background: 'var(--panel-2)', borderLeft: '1px solid var(--line)',
            overflow: 'hidden',
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 180ms ease',
            boxShadow: open ? 'var(--shadow-pop)' : 'none',
          }}
        >
          {open && <HelpPanel />}
        </aside>
      </div>
    </>
  );
}
