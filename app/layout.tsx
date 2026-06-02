import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Take-off · Plant access ladder · MTO',
  description: 'MTO — construction take-off engine. Material Take-Off for safety-and-access systems.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
