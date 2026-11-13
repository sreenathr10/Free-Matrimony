import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'brand' | 'verified' | 'warning' | 'gold';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-muted ring-line-strong',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800',
  verified: 'bg-verified-soft text-verified ring-verified/20 dark:bg-verified/15',
  warning: 'bg-gold-100 text-gold-600 ring-gold-300/60 dark:bg-gold-500/15 dark:text-gold-300',
  gold: 'bg-gold-gradient text-brand-950 ring-gold-400/40',
};

export function Badge({ tone = 'neutral', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
