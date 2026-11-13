'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from './cn';

/** Segmented tabs with a sliding indicator. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  id = 'tabs',
}: {
  tabs: readonly { id: T; label: string; icon?: ReactNode; count?: number }[];
  active: T;
  onChange: (t: T) => void;
  id?: string;
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto rounded-2xl bg-surface-sunken p-1 [scrollbar-width:none]" role="tablist">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn('relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors', on ? 'text-ink' : 'text-ink-muted hover:text-ink')}
          >
            {on && (
              <motion.span
                layoutId={`${id}-indicator`}
                className="absolute inset-0 rounded-xl bg-surface-raised shadow-soft"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {t.icon}
              {t.label}
              {t.count ? <span className="rounded-full bg-brand-gradient px-1.5 text-[0.7rem] text-white">{t.count}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
