'use client';
// Visual identifier system — the universal <Visual> display component.
// Ported from the design bundle's visuals.jsx (display half).
// Renders image / emoji / built-in icon, or a hash-colored first-letter placeholder.

import type { CSSProperties } from 'react';
import type { Visual as VisualType } from '@/lib/types';

// -------- icon library (built-in pictograms) --------
export const ICON_LIBRARY: Record<string, string> = {
  bolt: 'M14 2L4 14h6l-2 8 10-12h-6l2-8z',
  bracket: 'M4 6h12v4H4zM6 10v8M14 10v8M3 18h14',
  rail: 'M2 8h20M2 16h20M5 8v8M19 8v8M12 8v8',
  hook: 'M12 3v6a4 4 0 0 1-4 4H4M4 13v6h6',
  screw: 'M9 3h6l-1 3-1 2-1 2-1 2-1 2-1 2v3h-2v-3l-1-2-1-2-1-2-1-2-1-2-1-3z',
  plate: 'M4 4h16v16H4zM8 8l8 8M16 8l-8 8',
  cage: 'M6 3v18M12 3v18M18 3v18M3 6h18M3 12h18M3 18h18',
  ladder: 'M7 2v20M17 2v20M7 6h10M7 10h10M7 14h10M7 18h10',
  post: 'M12 2v20M8 5h8M10 22h4',
  anchor: 'M12 3a2 2 0 0 0-2 2v3h4V5a2 2 0 0 0-2-2zm-2 5v13M5 14v3a7 7 0 0 0 14 0v-3M3 14h4M17 14h4',
  drum: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3v12c0 1.7-3.6 3-8 3s-8-1.3-8-3zM4 6v0c0 1.7 3.6 3 8 3s8-1.3 8-3',
  sealant: 'M9 2h6v6l3 4v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8l3-4z',
  building: 'M4 22V4l8-2 8 2v18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 22v-4h4v4',
  wrench: 'M14 2a5 5 0 0 1 4 8.5L21 14l-3 3-3.5-3L6 21l-3-3 8.5-8.5A5 5 0 0 1 14 2z',
  box: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
  grid: 'M4 4h16v16H4zM4 12h16M12 4v16',
  sheet: 'M4 3h12l4 4v14H4zM16 3v4h4',
  ruler: 'M2 12 L22 12 M5 10v4 M9 9v6 M13 10v4 M17 9v6 M21 10v4',
  file: 'M4 3h10l6 6v12H4zM14 3v6h6',
  flag: 'M5 3v18M5 4h14l-3 5 3 5H5',
};

// -------- emoji set (curated for safety access) --------
export const EMOJI_CATEGORIES: Record<string, string[]> = {
  Structure: ['🪜', '🛤', '🏗', '🏢', '🏭', '🧱', '🔩', '⚙️', '🔧', '🪛'],
  Surfaces: ['🟫', '⬜', '◻️', '▦', '🗺', '🪟', '🚪'],
  Signs: ['⚠️', '🚧', '🔴', '🟡', '🟢', '🔵', '🆘', '⛔', '📋', '🏷'],
  Misc: ['📦', '🪝', '🧷', '🔗', '🪢', '📏', '📐', '🧭', '🛠', '💡'],
};

// -------- hash-based placeholder color (stable per name) --------
export function hashColor(str: string): [string, string] {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  const colors: [string, string][] = [
    ['#FBE9D6', '#8E5A14'], // bronze
    ['#DCEAEB', '#1C6E73'], // teal
    ['#E6ECF7', '#2755A8'], // blue
    ['#E8DEF5', '#663AAB'], // purple
    ['#E5EFE4', '#2E7A3A'], // green
    ['#F5DDD0', '#C44A20'], // red
    ['#F5E5C0', '#A77512'], // amber
    ['#DDE7F8', '#1F5BC4'], // accent
  ];
  return colors[Math.abs(h) % colors.length];
}

// -------- the Visual component (display only) --------
export function Visual({
  visual,
  name = '?',
  size = 24,
  rounded = 4,
}: {
  visual?: VisualType;
  name?: string;
  size?: number;
  rounded?: number;
}) {
  const v = visual || { kind: 'none' };
  const dims: CSSProperties = { width: size, height: size };
  const radius = rounded;

  if (v.kind === 'image') {
    return (
      <div
        style={{
          ...dims,
          borderRadius: radius,
          overflow: 'hidden',
          background: '#fff',
          border: '1px solid var(--line)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={v.url}
          alt={v.alt || name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  if (v.kind === 'emoji') {
    return (
      <div
        aria-hidden="true"
        style={{
          ...dims,
          borderRadius: radius,
          background: 'var(--bg-2)',
          border: '1px solid var(--line)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.6,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {v.char}
      </div>
    );
  }
  if (v.kind === 'icon') {
    const path = ICON_LIBRARY[v.name] || ICON_LIBRARY.box;
    const [bg, fg] = hashColor(v.name);
    return (
      <div
        style={{
          ...dims,
          borderRadius: radius,
          background: bg,
          border: '1px solid ' + fg + '40',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          aria-hidden="true"
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          stroke={fg}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={path} />
        </svg>
      </div>
    );
  }
  // placeholder
  const [bg, fg] = hashColor(name);
  return (
    <div
      aria-hidden="true"
      style={{
        ...dims,
        borderRadius: radius,
        background: bg,
        border: '1px solid ' + fg + '40',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: fg,
        fontWeight: 600,
        fontSize: size * 0.45,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
      }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}
