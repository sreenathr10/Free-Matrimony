'use client';

import { Bell, Menu, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Avatar } from './Avatar';
import { cn } from './cn';
import { Logo } from './Logo';

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

function Sidebar({ portal, nav, active, onNavigate }: { portal: string; nav: NavItem[]; active?: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-8 pt-2">
        <Logo size={34} subtitle={portal} className="text-[15px]" />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const on = item.href === active;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                on ? 'bg-brand-gradient text-white shadow-glow' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
            >
              <span className={cn('[&>svg]:h-[18px] [&>svg]:w-[18px]', on ? 'text-white' : 'text-ink-faint group-hover:text-brand-600')}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && (
                <span className={cn('rounded-full px-2 py-0.5 text-[0.7rem]', on ? 'bg-white/25' : 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300')}>
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>
      <div className="mt-6 rounded-2xl border border-line bg-surface-sunken p-3">
        <div className="flex items-center gap-3">
          <Avatar name="Staff Member" size={36} />
          <div className="min-w-0 text-sm">
            <div className="truncate font-semibold">Staff member</div>
            <div className="truncate text-xs text-ink-muted">Sign-in arrives in M3</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Layout for the staff portals: sidebar navigation, a top bar with search, and the page. */
export function StaffShell({ portal, nav, active, title, actions, children }: { portal: string; nav: NavItem[]; active?: string; title?: string; actions?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-surface-sunken">
      <aside className="fixed inset-y-0 left-0 hidden w-68 border-r border-line bg-surface-raised p-4 lg:block">
        <Sidebar portal={portal} nav={nav} active={active} />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-raised p-4 shadow-lift lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
            >
              <button className="absolute right-4 top-5 text-ink-muted" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              <Sidebar portal={portal} nav={nav} active={active} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-68">
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4 md:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              placeholder="Search members, profiles, tickets…"
              className="h-10 w-full rounded-full border border-line bg-surface-sunken pl-10 pr-4 text-sm outline-none transition focus:border-brand-300 focus:bg-surface-raised focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-surface-raised" />
            </button>
            <Avatar name="Staff Member" size={34} />
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          {(title || actions) && (
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              {title && <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>}
              {actions}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

type Tone = 'brand' | 'gold' | 'verified' | 'neutral';
const toneClass: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300',
  gold: 'bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300',
  verified: 'bg-verified-soft text-verified dark:bg-verified/15',
  neutral: 'bg-surface-sunken text-ink-muted',
};

export function StatTile({ label, value, hint, icon, tone = 'brand' }: { label: string; value: string; hint?: string; icon?: ReactNode; tone?: Tone }) {
  return (
    <div className="group rounded-card border border-line bg-surface-raised p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-ink-muted">{label}</div>
        {icon && <div className={cn('grid h-10 w-10 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5', toneClass[tone])}>{icon}</div>}
      </div>
      <div className="mt-3 font-display text-4xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}
