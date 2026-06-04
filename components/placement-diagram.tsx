'use client';

// Live preview of support placement for a property's PlacementRules — runs the
// SAME place() the engine uses, so the diagram is faithful (end clearances,
// max_spacing, forbidden zones, required positions). Authoring aid only; nothing
// here feeds the take-off. End supports render as filled brackets, intermediates
// as diamonds, with the first gap dimensioned (warn-tinted if a forbidden zone
// has pushed a gap past max_spacing).

import { useMemo } from 'react';
import type { PlacementRules } from '@/lib/types';
import { place } from '@/lib/engine/algorithms/place-supports';

export function PlacementDiagram({ rules, length, height = 116, label }: { rules: PlacementRules; length: number; height?: number; label?: string }) {
  const positions = useMemo(() => (length > 0 ? place(length, rules) : []), [rules, length]);

  if (length <= 0) return <div className="text-[11px] text-ink-3">Set a sample length to preview placement.</div>;

  const W = 720;
  const padX = 24;
  const top = 28;
  const line = 62;
  const x = (mm: number) => padX + (mm / length) * (W - 2 * padX);

  const gaps = positions.slice(1).map((p, i) => p - positions[i]);
  const maxGap = gaps.length ? Math.max(...gaps) : 0;
  const over = rules.max_spacing != null && maxGap > rules.max_spacing + 1;
  const bracketTone = over ? 'var(--warn)' : 'var(--ink-3)';

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" style={{ display: 'block' }} className="rounded border border-line bg-panel" role="img" aria-label={`placement preview · ${positions.length} supports`}>
        {/* length dimension */}
        <line x1={x(0)} y1={top} x2={x(length)} y2={top} stroke="var(--ink-4)" strokeWidth={1} />
        <text x={(x(0) + x(length)) / 2} y={top - 6} textAnchor="middle" fontSize={10} fill="var(--ink-2)" className="mono">{label ? `${label} · ` : ''}{length.toLocaleString()} mm</text>

        {/* forbidden zones */}
        {(rules.forbidden_zones ?? []).map((z, i) => (
          <rect key={`fz${i}`} x={x(z.start)} y={line - 14} width={Math.max(0, x(z.end) - x(z.start))} height={28} fill="var(--err-soft)" />
        ))}

        {/* run line + faint end-clearance ticks at the true ends */}
        <line x1={x(0)} y1={line} x2={x(length)} y2={line} stroke="var(--line-2)" strokeWidth={1.5} />
        <line x1={x(0)} y1={line - 6} x2={x(0)} y2={line + 6} stroke="var(--ink-4)" strokeWidth={1} />
        <line x1={x(length)} y1={line - 6} x2={x(length)} y2={line + 6} stroke="var(--ink-4)" strokeWidth={1} />

        {/* required positions (carets under the line) */}
        {(rules.required_positions ?? []).map((p, i) => (
          <path key={`rp${i}`} d={`M${x(p)} ${line + 9} l4 6 l-8 0 z`} fill="var(--prim-count)" />
        ))}

        {/* supports — ends filled, intermediates diamonds */}
        {positions.map((p, i) => {
          const isEnd = i === 0 || i === positions.length - 1;
          return isEnd
            ? <circle key={`s${i}`} cx={x(p)} cy={line} r={5} fill="var(--ink-2)" />
            : <path key={`s${i}`} d={`M${x(p)} ${line - 6} l6 6 l-6 6 l-6 -6 z`} fill="var(--accent)" stroke="var(--accent-line)" strokeWidth={1} />;
        })}

        {/* dimension the first gap */}
        {positions.length >= 2 && (
          <>
            <line x1={x(positions[0])} y1={line + 22} x2={x(positions[1])} y2={line + 22} stroke={bracketTone} strokeWidth={1} />
            <line x1={x(positions[0])} y1={line + 18} x2={x(positions[0])} y2={line + 26} stroke={bracketTone} strokeWidth={1} />
            <line x1={x(positions[1])} y1={line + 18} x2={x(positions[1])} y2={line + 26} stroke={bracketTone} strokeWidth={1} />
            <text x={(x(positions[0]) + x(positions[1])) / 2} y={line + 36} textAnchor="middle" fontSize={10} fill={bracketTone} className="mono">{gaps[0]?.toLocaleString()}</text>
          </>
        )}
      </svg>
      <div className="flex items-center justify-between text-[10px] text-ink-3">
        <span><span className="mono">{positions.length}</span> supports{rules.max_spacing ? <> · gaps ≤ <span className="mono">{rules.max_spacing.toLocaleString()}</span> mm</> : null}</span>
        {over && <span className="mono" style={{ color: 'var(--warn)' }}>max gap {maxGap.toLocaleString()} mm &gt; {rules.max_spacing?.toLocaleString()}</span>}
      </div>
    </div>
  );
}
