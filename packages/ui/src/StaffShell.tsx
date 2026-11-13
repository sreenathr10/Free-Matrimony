import type { ReactNode } from 'react';

export interface NavItem {
  href: string;
  label: string;
}

/** Layout for the staff portals: a sidebar with the portal's sections and a content area. */
export function StaffShell({
  portal,
  nav,
  active,
  children,
}: {
  portal: string;
  nav: NavItem[];
  active?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface-raised p-4 md:block">
        <div className="mb-8 px-2">
          <div className="font-display text-lg font-semibold text-brand-600">Free Matrimony</div>
          <div className="text-xs uppercase tracking-wide text-ink-muted">{portal}</div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={
                item.href === active
                  ? 'rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700'
                  : 'rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-brand-50 hover:text-ink'
              }
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-raised p-5">
      <div className="text-sm text-ink-muted">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}
