'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Visual } from '@/components/visual';
import { PrimitiveBadge } from '@/components/chrome';
import { createTakeoffAction } from '@/app/takeoff/actions';
import type { PrimitiveKind, System } from '@/lib/types';

const BADGEABLE: PrimitiveKind[] = ['length', 'height', 'count'];

export function NewTakeoffPicker({ projectId, projectName, systems }: { projectId: string; projectName: string; systems: System[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  async function pick(systemId: string) {
    setBusy(systemId);
    setError(undefined);
    const res = await createTakeoffAction(projectId, systemId);
    if (res.ok) router.push(`/takeoff/${res.id}`);
    else { setBusy(undefined); setError(res.error ?? 'create failed'); }
  }

  return (
    <div className="mx-auto max-w-[900px] px-5 pt-[18px]">
      <h1 className="m-0 border-b border-line pb-3.5 text-[22px] font-semibold">New take-off · {projectName}</h1>
      <div className="py-4">
        <div className="uc mb-2">Pick a system to take off from</div>
        {error && <div className="mono mb-2 text-[11px] text-err">{error}</div>}
        <div className="grid grid-cols-2 gap-2.5">
          {systems.map((s) => {
            const k = s.primitive.kind;
            return (
              <button key={s.id} onClick={() => pick(s.id)} disabled={!!busy} className="flex items-center gap-3 rounded-md border border-line bg-panel p-3 text-left hover:bg-panel-hover" style={{ opacity: busy && busy !== s.id ? 0.5 : 1 }}>
                <Visual visual={s.visual} name={s.name} size={32} rounded={5} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{s.name}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{s.models.length} model{s.models.length === 1 ? '' : 's'}</div>
                </div>
                {BADGEABLE.includes(k) ? <PrimitiveBadge kind={k as 'length' | 'height' | 'count'} mini /> : <span className="tag">{k}</span>}
                {busy === s.id && <span className="mono text-[10px] text-accent">…</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
