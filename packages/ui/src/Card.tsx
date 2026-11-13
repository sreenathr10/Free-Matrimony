import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'default' | 'glass' | 'interactive' | 'sunken' | 'feature';

const variants: Record<Variant, string> = {
  default: 'bg-surface-raised border border-line shadow-soft',
  glass: 'glass border border-white/40 shadow-lift dark:border-white/10',
  interactive:
    'bg-surface-raised border border-line shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift hover:border-brand-200',
  sunken: 'bg-surface-sunken border border-line',
  feature: 'bg-surface-raised border border-line shadow-soft relative overflow-clip',
};

export function Card({ className, variant = 'default', ...props }: HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return <div className={cn('rounded-card p-6', variants[variant], className)} {...props} />;
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface-sunken/60 px-6 py-14 text-center">
      {icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40">{icon}</div>}
      <h3 className="font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />;
}
