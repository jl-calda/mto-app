import Link from 'next/link';

/** On-brand placeholder for resource routes whose screens land in a later brief.
 *  Uses Tailwind utilities mapped to the design tokens via `@theme`. */
export function ResourcePlaceholder({
  title,
  count,
  note,
}: {
  title: string;
  count: number;
  note: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <div className="uc mb-2">workspace · {count} seeded</div>
      <h1 className="m-0 text-[22px] font-semibold text-ink">{title}</h1>
      <p className="mx-auto mt-2.5 max-w-md text-[13px] leading-relaxed text-ink-3">{note}</p>
      <Link href="/takeoff/ladder" className="btn primary mt-4">
        Open the ladder take-off
      </Link>
    </div>
  );
}
