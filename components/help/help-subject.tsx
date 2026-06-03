'use client';

// Publishes the current System into the Guide panel so its dependency tree is
// data-driven. Drop into a (server) page; it renders nothing. Clears on unmount /
// navigation so other pages fall back to the generic tree.

import { useEffect } from 'react';
import type { System } from '@/lib/types';
import { useHelp } from './help-context';
import { buildSystemTree } from '@/lib/help/tree';

export function HelpSubjectSystem({ system }: { system: System }) {
  const { setSubject } = useHelp();
  useEffect(() => {
    setSubject(buildSystemTree(system));
    return () => setSubject(null);
  }, [system, setSubject]);
  return null;
}
