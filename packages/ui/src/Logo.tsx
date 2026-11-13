import { useId } from 'react';
import { cn } from './cn';

/** The brand mark: two interlocking rings with a spark above. */
export function LogoMark({ size = 32, className, mono }: { size?: number; className?: string; mono?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}r`} x1="10" y1="22" x2="40" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0567A" />
          <stop offset="1" stopColor="#A81C42" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="26" y1="22" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8D57A" />
          <stop offset="1" stopColor="#CF8E14" />
        </linearGradient>
      </defs>
      <circle cx="25" cy="38" r="13" stroke={mono ? 'currentColor' : `url(#${id}r)`} strokeWidth="5" />
      <circle cx="39" cy="38" r="13" stroke={mono ? 'currentColor' : `url(#${id}g)`} strokeWidth="5" />
      <path d="M27.26 25.2A13 13 0 0 1 35.65 30.54" stroke={mono ? 'currentColor' : `url(#${id}r)`} strokeWidth="5" />
      <path d="M32 8l4.5 6L32 20l-4.5-6z" fill={mono ? 'currentColor' : `url(#${id}g)`} />
    </svg>
  );
}

/** Mark + wordmark. */
export function Logo({ size = 32, className, subtitle }: { size?: number; className?: string; subtitle?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.2em] font-semibold tracking-tight">
          Free<span className="text-gradient">Matrimony</span>
        </span>
        {subtitle && <span className="mt-1 text-[0.62em] font-semibold uppercase tracking-[0.18em] text-ink-muted">{subtitle}</span>}
      </span>
    </span>
  );
}
