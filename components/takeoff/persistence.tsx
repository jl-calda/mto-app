'use client';

// Shared take-off persistence: debounced autosave + manual save, behind one
// Server Action. Used by both PrimitiveTakeoff and AnchorsTakeoff.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Takeoff } from '@/lib/types';
import { saveTakeoffAction } from '@/app/takeoff/actions';

export type PersistTarget = { takeoffId: string; projectId: string };
export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function useTakeoffPersistence(
  persist: PersistTarget | undefined,
  build: () => Takeoff,
  /** A stable string that changes whenever a persisted input changes. */
  signature: string,
) {
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const first = useRef(true);
  const buildRef = useRef(build);
  buildRef.current = build;

  const saveNow = useCallback(async () => {
    if (!persist) return;
    setState('saving');
    const res = await saveTakeoffAction(persist.projectId, buildRef.current());
    if (res.ok) {
      setState('saved');
      setSavedAt(res.savedAt);
    } else {
      setState('error');
    }
  }, [persist]);

  useEffect(() => {
    if (!persist) return;
    // skip the initial render — only autosave after a real edit
    if (first.current) {
      first.current = false;
      return;
    }
    setState('dirty');
    const t = setTimeout(() => void saveNow(), 800);
    return () => clearTimeout(t);
  }, [signature, persist, saveNow]);

  return { state, savedAt, saveNow };
}

export function SaveStatus({ state, savedAt, onSave }: { state: SaveState; savedAt: number | null; onSave: () => void }) {
  const label =
    state === 'saving' ? 'saving…'
    : state === 'dirty' ? 'unsaved'
    : state === 'error' ? 'save failed'
    : state === 'saved' && savedAt ? `saved ${new Date(savedAt).toLocaleTimeString()}`
    : 'saved';
  const color =
    state === 'error' ? 'var(--err)'
    : state === 'saving' || state === 'dirty' ? 'var(--warn)'
    : 'var(--ok)';
  return (
    <div className="flex items-center gap-2">
      <span className="mono text-[10px]" style={{ color }}>● {label}</span>
      <button className="btn sm" onClick={onSave} disabled={state === 'saving'}>Save</button>
    </div>
  );
}
