'use client';

// Shared version-history timeline (variants + sub-assemblies). Renders each
// version with its changelog + a diff summary against the previous version.

import type { VersionDiff } from '@/lib/types';
import { diffCount } from '@/lib/versioning';

export type TimelineVersion = {
  version: number;
  published_at: number;
  changelog: string;
  diff_from_previous?: VersionDiff;
};

function fmt(v: unknown): string {
  return Array.isArray(v) ? v.join(', ') : String(v);
}

export function VersionTimeline({ versions, current }: { versions: TimelineVersion[]; current: number }) {
  const ordered = [...versions].sort((a, b) => b.version - a.version);
  return (
    <div className="flex flex-col gap-2">
      {ordered.map((v) => {
        const d = v.diff_from_previous;
        const n = diffCount(d);
        return (
          <div key={v.version} className="rounded border border-line p-2.5" style={{ borderColor: v.version === current ? 'var(--accent-line)' : 'var(--line)' }}>
            <div className="mb-1 flex items-center gap-2">
              <span className="tag" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>v{v.version}</span>
              {v.version === current && <span className="tag" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }}>current</span>}
              <span className="flex-1 truncate text-[12px]">{v.changelog || '—'}</span>
              {v.published_at > 0 && <span className="mono text-[10px] text-ink-4">{new Date(v.published_at).toLocaleDateString()}</span>}
            </div>
            {d && n > 0 ? (
              <div className="flex flex-wrap gap-1">
                {Object.entries(d.added).map(([k, val]) => <span key={`a${k}`} className="tag" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }}>+ {k}: {fmt(val)}</span>)}
                {Object.entries(d.modified).map(([k, m]) => <span key={`m${k}`} className="tag" style={{ color: 'var(--warn)', background: 'var(--warn-soft)' }}>~ {k}: {fmt(m.from)}→{fmt(m.to)}</span>)}
                {d.removed.map((k) => <span key={`r${k}`} className="tag" style={{ color: 'var(--err)', background: 'var(--err-soft)' }}>− {k}</span>)}
              </div>
            ) : (
              <div className="mono text-[10px] text-ink-4">{v.version === 1 ? 'initial version' : 'no attribute changes'}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
