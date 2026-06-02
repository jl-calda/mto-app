'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { PrimitiveKind, System } from '@/lib/types';
import { Card, Toggle } from './parts';

const PRIMS: { kind: PrimitiveKind; label: string; desc: string; v3?: boolean }[] = [
  { kind: 'length', label: 'Length', desc: 'linear runs — guardrail, handrail' },
  { kind: 'height', label: 'Height', desc: 'vertical climbs — ladders (auto-split into flights)' },
  { kind: 'count', label: 'Count', desc: 'discrete items — anchor points' },
  { kind: 'area', label: 'Area', desc: 'roof sheet, cladding', v3: true },
  { kind: 'volume', label: 'Volume', desc: 'fill, insulation', v3: true },
];

export function Step1Primitive({ system, setSystem }: { system: System; setSystem: Dispatch<SetStateAction<System>> }) {
  const cur = system.primitive.kind;
  const segmentable = system.primitive.kind === 'length' && !!system.primitive.segmentable;
  return (
    <Card title="Primitive — what this system measures">
      <div className="grid grid-cols-3 gap-2.5">
        {PRIMS.map((p) => {
          const on = cur === p.kind;
          return (
            <button
              key={p.kind}
              type="button"
              disabled={p.v3}
              onClick={() =>
                setSystem((s) => ({
                  ...s,
                  primitive: p.kind === 'length' ? { kind: 'length', segmentable } : { kind: p.kind },
                }))
              }
              className="rounded border p-3 text-left"
              style={{
                borderColor: on ? 'var(--accent)' : 'var(--line-2)',
                background: on ? 'var(--selected)' : p.v3 ? 'var(--bg-2)' : 'var(--panel)',
                boxShadow: on ? '0 0 0 1px var(--accent)' : undefined,
                opacity: p.v3 ? 0.5 : 1,
                cursor: p.v3 ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="flex items-center gap-1.5 text-[13px] font-medium">
                {p.label}
                {p.v3 && <span className="tag" style={{ color: 'var(--annotation)' }}>v3</span>}
              </div>
              <div className="mt-1 text-[10px] text-ink-3">{p.desc}</div>
            </button>
          );
        })}
      </div>
      {cur === 'length' && (
        <div className="mt-3 rounded border border-line p-2.5">
          <Toggle
            on={segmentable}
            label="Allow segmentation — multi-segment runs with junctions (corners, splices)"
            onChange={(v) => setSystem((s) => ({ ...s, primitive: { kind: 'length', segmentable: v } }))}
          />
        </div>
      )}
    </Card>
  );
}
