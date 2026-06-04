'use client';

// Shared, non-blocking surfacing of a Warning[] (validation OR engine): a compact
// count badge colored by the most severe level, and an expandable de-duplicated
// list. Used by the system wizard and the model editor. Tokens only — matches the
// CAD design system. Filtering to a row/field is done by `byAffected` (@/lib/validate).

import type { ReactNode } from 'react';
import type { Warning } from '@/lib/types';
import { Icon } from '@/components/chrome';

type Level = Warning['level'];
const RANK: Record<Level, number> = { info: 0, warning: 1, error: 2 };

const STYLE: Record<Level, { fg: string; soft: string; Glyph: typeof Icon.Info }> = {
  info: { fg: 'var(--accent)', soft: 'var(--accent-soft)', Glyph: Icon.Info },
  warning: { fg: 'var(--warn)', soft: 'var(--warn-soft)', Glyph: Icon.Warn },
  error: { fg: 'var(--err)', soft: 'var(--err-soft)', Glyph: Icon.Warn },
};

/** Most severe level present, or null when there are none. */
export function maxLevel(warnings: Warning[]): Level | null {
  let lvl: Level | null = null;
  for (const w of warnings) if (lvl === null || RANK[w.level] > RANK[lvl]) lvl = w.level;
  return lvl;
}

/** Compact count chip, colored by the most severe level. Renders nothing when empty. */
export function WarningBadge({ warnings, label, onClick }: { warnings: Warning[]; label?: ReactNode; onClick?: () => void }) {
  const lvl = maxLevel(warnings);
  if (!lvl) return null;
  const s = STYLE[lvl];
  const Glyph = s.Glyph;
  const cls = 'inline-flex items-center gap-1 rounded-full px-1.5 text-[11px] font-medium leading-none';
  const style = { color: s.fg, background: s.soft, height: 18 };
  const title = warnings.map((w) => `• ${w.message}`).join('\n');
  const body = (<><Glyph width={11} height={11} /><span className="mono">{warnings.length}</span>{label}</>);
  return onClick
    ? <button type="button" onClick={onClick} className={cls} style={style} title={title}>{body}</button>
    : <span className={cls} style={style} title={title}>{body}</span>;
}

/** Expanded, de-duplicated (by message) list. Optional OK empty-state. */
export function WarningList({ warnings, title, emptyOk }: { warnings: Warning[]; title?: string; emptyOk?: boolean }) {
  const seen = new Set<string>();
  const items = warnings.filter((w) => (seen.has(w.message) ? false : seen.add(w.message)));
  if (!items.length) {
    if (!emptyOk) return null;
    return (
      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ok)' }}>
        <Icon.Check width={12} height={12} /> No issues found.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {title && <div className="uc">{title} · {items.length}</div>}
      {items.map((w, i) => {
        const s = STYLE[w.level];
        const Glyph = s.Glyph;
        return (
          <div key={i} className="flex items-start gap-2 rounded-r p-1.5" style={{ background: 'var(--panel-2)', borderLeft: `2px solid ${s.fg}` }}>
            <span className="mt-px shrink-0" style={{ color: s.fg }}><Glyph width={12} height={12} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px]">{w.message}</div>
              {w.affected_fields?.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {w.affected_fields.map((f) => <span key={f} className="tag">{f}</span>)}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
