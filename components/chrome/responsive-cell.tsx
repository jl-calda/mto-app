import type { ReactNode } from 'react';

// A secondary table cell that, on mobile, prefixes its value with a small
// uppercase label (so a stacked card stays self-describing), and on desktop
// (lg+) renders just the value as a bare grid cell — identical to before.
// Used inside the browsers' row grids, whose secondary columns become a
// wrapped chip row on phones.
export function Cell({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 lg:block lg:gap-0 ${className}`}>
      <span className="uc lg:hidden">{label}</span>
      {children}
    </div>
  );
}
