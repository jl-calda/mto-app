'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Visual } from '@/components/visual';
import { Stat } from '@/components/chrome';
import type { Project } from '@/lib/types';

const COLS = 'grid grid-cols-[28px_minmax(0,1fr)_160px_140px_80px] items-center gap-2.5';

export function ProjectsBrowser({ projects }: { projects: Project[] }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return projects.filter((p) => !n || `${p.name} ${p.client} ${p.location ?? ''}`.toLowerCase().includes(n));
  }, [projects, q]);

  const takeoffs = projects.reduce((s, p) => s + p.takeoffs.length, 0);
  const systems = new Set(projects.flatMap((p) => p.takeoffs.map((t) => t.system_id))).size;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">Projects</h1>
          <div className="mt-1 text-[12px] text-ink-3">Workspaces where take-offs happen and MTOs are produced.</div>
        </div>
        <div className="flex border-l border-line">
          <Stat k="projects" v={projects.length} />
          <Stat k="take-offs" v={takeoffs} />
          <Stat k="systems used" v={systems} />
        </div>
      </div>

      <div className="py-4">
        <div className="mb-3 flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="input w-[280px]"
            style={{ fontFamily: 'var(--font-sans)' }}
          />
          <span className="flex-1" />
          <button className="btn primary sm">New project</button>
        </div>

        <div className="overflow-hidden rounded-md border border-line bg-panel">
          <div className={`${COLS} border-b border-line bg-panel-2 px-3.5 py-2`}>
            {['', 'project', 'client', 'location', 'take-offs'].map((h, i) => (
              <div key={i} className="uc">{h}</div>
            ))}
          </div>
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={`${COLS} border-b border-line px-3.5 py-2.5 last:border-b-0 hover:bg-panel-hover`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Visual visual={p.visual} name={p.name} size={26} rounded={4} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{p.name}</div>
                <div className="mono truncate text-[10px] text-ink-3">{p.id}</div>
              </div>
              <div className="truncate text-[12px] text-ink-2">{p.client}</div>
              <div className="truncate text-[12px] text-ink-2">{p.location ?? '—'}</div>
              <div className="mono text-[13px]">{p.takeoffs.length}</div>
            </Link>
          ))}
          {rows.length === 0 && (
            <div className="px-3.5 py-10 text-center text-[12px] text-ink-3">No projects match.</div>
          )}
        </div>
      </div>
    </div>
  );
}
