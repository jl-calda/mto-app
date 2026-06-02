'use client';

import Link from 'next/link';
import { TopBar, Sidebar } from '@/components/chrome';

// The global not-found is client-bundled by Next, so it uses the presentational
// chrome directly (no repo-backed Shell, which is server-only).
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar crumbs={[{ label: 'Not found' }]} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto', background: 'var(--bg)' }}>
          <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
            <div className="uc" style={{ marginBottom: 8 }}>404</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Page not found</h1>
            <p style={{ marginTop: 10, color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>
              That route doesn&apos;t exist. Head back to your projects or systems.
            </p>
            <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Link href="/" className="btn primary">Projects</Link>
              <Link href="/systems" className="btn">Systems</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
