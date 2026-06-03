'use client';

// Client state for the mobile off-canvas navigation drawer. Deliberately NOT
// persisted (a drawer must never reopen itself) and seeded `false` so the server
// and first client render agree — no hydration mismatch. Closes automatically on
// every route change so picking a destination dismisses the drawer.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type MobileNavCtx = { open: boolean; toggle: () => void; close: () => void };

const Ctx = createContext<MobileNavCtx | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  return <Ctx.Provider value={{ open, toggle, close }}>{children}</Ctx.Provider>;
}

export function useMobileNav(): MobileNavCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMobileNav must be used within MobileNavProvider');
  return c;
}
