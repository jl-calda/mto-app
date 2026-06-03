'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/types';
import { Card, Field, TextInput } from '@/components/system-wizard/parts';
import { VisualEditor } from '@/components/visual-editor';
import { saveProjectAction } from '@/app/projects/actions';
import type { Visual } from '@/lib/types';

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [visual, setVisual] = useState<Visual | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function create() {
    setBusy(true);
    setError(undefined);
    const project: Project = {
      id: `prj-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(), client: client.trim(), location: location.trim() || undefined,
      visual, created_at: Date.now(), takeoffs: [],
    };
    const res = await saveProjectAction(project);
    if (res.ok) router.push(`/projects/${res.id}`);
    else { setBusy(false); setError(res.error ?? 'create failed'); }
  }

  return (
    <div className="mx-auto max-w-[640px] px-5 pt-[18px]">
      <h1 className="m-0 border-b border-line pb-3.5 text-[22px] font-semibold">New project</h1>
      <div className="py-4">
        <Card title="Project details">
          <div className="flex flex-col gap-2.5">
            <Field label="visual"><VisualEditor value={visual} name={name || 'project'} onChange={setVisual} /></Field>
            <Field label="name"><TextInput value={name} onChange={setName} placeholder="e.g. Westfield Sky Garden L09" /></Field>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="client"><TextInput value={client} onChange={setClient} /></Field>
              <Field label="location"><TextInput value={location} onChange={setLocation} /></Field>
            </div>
            {error && <div className="mono text-[11px] text-err">{error}</div>}
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn sm" onClick={() => router.push('/')}>Cancel</button>
              <button className="btn primary sm" onClick={create} disabled={busy || !name.trim() || !client.trim()}>{busy ? 'Creating…' : 'Create project'}</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
