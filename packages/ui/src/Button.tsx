import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-glow hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:brightness-95',
  secondary:
    'bg-surface-raised text-ink border border-line-strong shadow-soft hover:border-brand-300 hover:text-brand-700',
  ghost: 'text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-white/5',
  gold: 'bg-gold-gradient text-brand-950 shadow-soft hover:brightness-105 hover:-translate-y-px',
  inverse: 'bg-white text-brand-800 shadow-lift hover:-translate-y-px',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] gap-2',
  lg: 'h-14 px-8 text-base gap-2.5',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(
    'inline-flex shrink-0 select-none items-center whitespace-nowrap justify-center rounded-full font-semibold tracking-tight',
    'transition-all duration-200 ease-out',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({ variant, size, className, loading, icon, iconRight, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading ? <Spinner /> : icon}
      {children}
      {iconRight}
    </button>
  );
}
