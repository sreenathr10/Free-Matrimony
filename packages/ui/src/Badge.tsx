import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'brand' | 'verified' | 'warning';

const tones: Record<Tone, string> = {
  neutral: 'bg-line/60 text-ink-muted',
  brand: 'bg-brand-100 text-brand-700',
  verified: 'bg-verified/10 text-verified',
  warning: 'bg-gold-400/20 text-gold-500',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}
