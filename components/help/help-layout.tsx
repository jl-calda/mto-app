'use client';

// Renders the scrollable <main> plus the Guide. Three presentations, but <HelpPanel>
// (which hosts the React Flow canvas) mounts in exactly ONE of them at a time:
//   • desktop push panel — a 400px sticky flex sibling that pushes main (Glossary,
//     or the Tree tab without a system in focus);
//   • desktop wide overlay — when the Tree tab is open for a system, the Guide
//     grows to min(960px,92vw) as a fixed elevated overlay floating over main
//     ("overflow into the main content") with no reflow jank;
//   • mobile drawer — a fixed right overlay + backdrop below lg.
// `isDesktop` (matchMedia) picks the single host. Safe vs hydration: the panel is
// gated on `open`, which is false on the server + first client render, so the
// panel never renders during SSR/hydration regardless of `isDesktop`.

import { useEffect, useState, type ReactNode } from 'react';
import { useHelp } from './help-context';
import { HelpPanel } from './help-panel';
import { useBodyScrollLock } from '@/components/chrome/use-body-scroll-lock';

function useIsDesktop(): boolean {
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setD(mq.matches);
    mq.addEventListener('change', on);
    setD(mq.matches);
    return () => mq.removeEventListener('change', on);
  }, []);
  return d;
}

export function HelpLayout({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { open, close, view, subject } = useHelp();
  const isDesktop = useIsDesktop();
  useBodyScrollLock(open); // mobile-only (no-op ≥lg, so the desktop push panel keeps main scrollable)

  // Desktop Tree tab with a system in focus → widen into an overlay over main.
  const wide = open && isDesktop && view === 'tree' && !!subject;

  return (
    <>
      <main style={{ flex: 1, minWidth: 0, maxWidth: '100vw', overflow: scroll ? 'auto' : 'hidden', background: 'var(--bg)' }}>
        {children}
      </main>

      {/* desktop: push panel (collapses to 0 when the wide overlay takes over) */}
      <aside
        aria-hidden={!open}
        className="hidden lg:block"
        style={{
          width: open && !wide ? 400 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          borderLeft: open && !wide ? '1px solid var(--line)' : 'none',
          background: 'var(--panel-2)',
          position: 'sticky',
          top: 'var(--h-topbar)',
          height: 'calc(100vh - var(--h-topbar))',
          transition: 'width 160ms ease',
        }}
      >
        {isDesktop && open && !wide && <HelpPanel />}
      </aside>

      {/* desktop: wide Tree overlay — fixed, floats over main (no push/reflow) */}
      {isDesktop && wide && (
        <aside
          className="hidden lg:block"
          style={{
            position: 'fixed', top: 'var(--h-topbar)', right: 0, bottom: 0, zIndex: 65,
            width: 'min(960px, 92vw)',
            background: 'var(--panel-2)', borderLeft: '1px solid var(--line)',
            boxShadow: 'var(--shadow-pop)',
            animation: 'help-slide-in 160ms ease',
          }}
        >
          <HelpPanel />
        </aside>
      )}

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
          {!isDesktop && open && <HelpPanel />}
        </aside>
      </div>
    </>
  );
}
