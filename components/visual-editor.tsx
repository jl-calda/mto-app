'use client';

import { useEffect, useRef, useState } from 'react';
import type { Visual as VisualType } from '@/lib/types';
import { Visual, ICON_LIBRARY, EMOJI_CATEGORIES } from '@/components/visual';
import { uploadVisualFile } from '@/lib/visuals';

type Mode = 'none' | 'emoji' | 'icon' | 'upload';

function modeFor(v?: VisualType): Mode {
  return v?.kind === 'image' ? 'upload' : v?.kind === 'emoji' ? 'emoji' : v?.kind === 'icon' ? 'icon' : 'none';
}

export function VisualEditor({ value, name = '?', onChange }: { value?: VisualType; name?: string; onChange: (v: VisualType) => void }) {
  const [mode, setMode] = useState<Mode>(modeFor(value));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('not an image'); return; }
    setError(undefined);
    const prev = value;
    const objectUrl = URL.createObjectURL(file);
    onChange({ kind: 'image', url: objectUrl, alt: name }); // optimistic — instant preview
    setUploading(true);
    try {
      const url = await uploadVisualFile(file);
      onChange({ kind: 'image', url, alt: name });
    } catch (e) {
      onChange(prev ?? { kind: 'none' }); // rollback
      setError(e instanceof Error ? e.message : 'upload failed');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  // clipboard paste while the Upload tab is open
  useEffect(() => {
    if (mode !== 'upload') return;
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) { e.preventDefault(); void handleFile(file); }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, value, name]);

  const TABS: Mode[] = ['none', 'emoji', 'icon', 'upload'];

  return (
    <div className="rounded border border-line p-2.5">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Visual visual={value} name={name} size={52} rounded={8} />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[8px]" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <span className="mono text-[9px] text-accent" style={{ animation: 'pulse 1s infinite' }}>…</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button key={t} onClick={() => setMode(t)} className="rounded px-2 py-0.5 text-[11px]" style={{ background: mode === t ? 'var(--selected)' : 'var(--bg-2)', color: mode === t ? 'var(--accent)' : 'var(--ink-2)' }}>{t}</button>
              ))}
            </div>
            {value && value.kind !== 'none' && (
              <button className="btn sm" onClick={() => { onChange({ kind: 'none' }); setMode('none'); }}>Clear</button>
            )}
          </div>

          {mode === 'none' && <div className="text-[11px] text-ink-3">No visual — a hash-coloured initial of the name is shown. Pick a tab to set one.</div>}

          {mode === 'emoji' && (
            <div className="flex max-h-[140px] flex-col gap-1.5 overflow-y-auto">
              {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => (
                <div key={cat}>
                  <div className="uc mb-0.5">{cat}</div>
                  <div className="flex flex-wrap gap-1">
                    {list.map((char) => (
                      <button key={char} onClick={() => onChange({ kind: 'emoji', char })} className="flex h-7 w-7 items-center justify-center rounded border text-[16px]" style={{ borderColor: value?.kind === 'emoji' && value.char === char ? 'var(--accent)' : 'var(--line)' }}>{char}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {mode === 'icon' && (
            <div className="flex max-h-[140px] flex-wrap gap-1 overflow-y-auto">
              {Object.keys(ICON_LIBRARY).map((n) => (
                <button key={n} onClick={() => onChange({ kind: 'icon', name: n })} title={n} className="rounded border p-0.5" style={{ borderColor: value?.kind === 'icon' && value.name === n ? 'var(--accent)' : 'var(--line)' }}>
                  <Visual visual={{ kind: 'icon', name: n }} name={n} size={26} rounded={4} />
                </button>
              ))}
            </div>
          )}

          {mode === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f); }}
              onClick={() => fileInput.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded border border-dashed py-3 text-center"
              style={{ borderColor: dragOver ? 'var(--accent)' : 'var(--line-2)', background: dragOver ? 'var(--selected)' : 'var(--panel-2)' }}
            >
              <div className="text-[11px] text-ink-2">Drop, paste, or click to upload</div>
              <div className="mono mt-0.5 text-[10px] text-ink-4">PNG · JPG · SVG</div>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }} />
            </div>
          )}

          {error && <div className="mono mt-1 text-[10px] text-err">{error}</div>}
        </div>
      </div>
    </div>
  );
}
