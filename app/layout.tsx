import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Take-off · Plant access ladder · MTO',
  description: 'MTO — construction take-off engine. Material Take-Off for safety-and-access systems.',
};

// Render at device width (was missing → phones rendered the desktop layout
// zoomed out). No maximum-scale, so pinch-zoom stays available for a11y.
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

// Render every route per request. The app reads from the repository (Supabase
// when configured, else the in-memory seed); with default static prerendering
// Next would resolve the repo at build time and freeze a snapshot, so live DB
// rows + mutations (and the runtime env) would never surface. This cascades to
// all nested segments. (Route segment config — Next App Router.)
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
