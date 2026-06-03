'use client';

// Client state for the Guide panel: open/closed (persisted across navigations via
// localStorage) and the active "topic" (which concept a trigger deep-linked to).
// The provider is rendered inside the server <Shell> and receives page content as
// `children`, so client (i) buttons anywhere in the tree can consume useHelp().

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ConceptId } from '@/lib/help/content';

const KEY = 'mto.help.open';

type HelpCtx = {
  open: boolean;
  topic: ConceptId | null;
  openTopic: (t: ConceptId) => void;
  toggle: () => void;
  close: () => void;
};

const Ctx = createContext<HelpCtx | null>(null);

export function HelpProvider({ children, defaultTopic = null }: { children: ReactNode; defaultTopic?: ConceptId | null }) {
  // Deterministic first render (server + first client render agree) → no hydration
  // mismatch; the persisted value is applied after mount.
  const [open, setOpen] = useState(false);
  // Seeded from the active tab so the guide focuses on the relevant concept; an
  // (i) button can still override via openTopic. Re-seeds per navigation (Shell
  // remounts), so an open guide refocuses as you switch tabs.
  const [topic, setTopic] = useState<ConceptId | null>(defaultTopic);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === '1') setOpen(true);
    } catch {
      /* ignore unavailable storage */
    }
  }, []);

  const persist = (v: boolean) => {
    try {
      window.localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const openTopic = useCallback((t: ConceptId) => {
    setTopic(t);
    setOpen(true);
    persist(true);
  }, []);
  const toggle = useCallback(() => setOpen((o) => { persist(!o); return !o; }), []);
  const close = useCallback(() => { setOpen(false); persist(false); }, []);

  return <Ctx.Provider value={{ open, topic, openTopic, toggle, close }}>{children}</Ctx.Provider>;
}

export function useHelp(): HelpCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useHelp must be used within HelpProvider');
  return c;
}
