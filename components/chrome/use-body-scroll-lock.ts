'use client';

// Locks <body> scroll while a mobile overlay drawer is open, so the page behind
// the backdrop doesn't scroll. No-ops at ≥1024px (lg) where the nav/Guide are
// push/sticky panels rather than overlays — otherwise an open desktop Guide
// (the common case, persisted) would freeze the main column.

import { useEffect } from 'react';

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 1023.98px)').matches) return; // desktop → don't lock
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}
