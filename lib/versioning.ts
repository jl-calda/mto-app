// Pure version-diff helpers shared by the variant + sub-assembly publish flows.

import type { AttrValue, VersionDiff } from '@/lib/types';

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function diffAttributes(prev: Record<string, AttrValue>, next: Record<string, AttrValue>): VersionDiff {
  const added: Record<string, AttrValue> = {};
  const modified: Record<string, { from: AttrValue; to: AttrValue }> = {};
  const removed: string[] = [];
  for (const k of Object.keys(next)) {
    if (!(k in prev)) added[k] = next[k];
    else if (!eq(prev[k], next[k])) modified[k] = { from: prev[k], to: next[k] };
  }
  for (const k of Object.keys(prev)) if (!(k in next)) removed.push(k);
  return { added, modified, removed };
}

/** Diff two name lists into the same VersionDiff shape (added/removed; no modify). */
export function diffNames(prev: string[], next: string[]): VersionDiff {
  const added: Record<string, AttrValue> = {};
  const removed: string[] = [];
  for (const n of next) if (!prev.includes(n)) added[n] = true;
  for (const n of prev) if (!next.includes(n)) removed.push(n);
  return { added, modified: {}, removed };
}

export function diffCount(d?: VersionDiff): number {
  if (!d) return 0;
  return Object.keys(d.added).length + Object.keys(d.modified).length + d.removed.length;
}
