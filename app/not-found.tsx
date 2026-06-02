'use client';

import Link from 'next/link';
import { Shell } from '@/components/chrome';

// Most of the app's nav points to screens beyond this deliverable
// (the take-off-ladder screen). Render an on-brand placeholder rather
// than a bare 404 so the chrome stays navigable.
export default function NotFound() {
  return (
    <Shell crumbs={[{ label: 'Projects', href: '/' }]}>
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="uc" style={{ marginBottom: 8 }}>not built yet</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>This screen isn&apos;t part of this build</h1>
        <p style={{ marginTop: 10, color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>
          The implemented deliverable is the <span className="mono">Plant access ladder</span> take-off.
          Other workspace screens are designed but not yet wired up.
        </p>
        <div style={{ marginTop: 18 }}>
          <Link href="/takeoff/ladder" className="btn primary">Go to the ladder take-off</Link>
        </div>
      </div>
    </Shell>
  );
}
