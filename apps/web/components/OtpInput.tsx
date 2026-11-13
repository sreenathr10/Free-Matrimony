'use client';

import { useRef } from 'react';
import { cn } from '@fm/ui';

/** Six separate boxes for a one-time code, with paste and backspace support. */
export function OtpInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  function set(i: number, d: string) {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').slice(0, 6));
  }

  return (
    <div
      className="flex justify-between gap-2"
      onPaste={(e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (text) {
          e.preventDefault();
          onChange(text);
          refs.current[Math.min(text.length, 5)]?.focus();
        }
      }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-label={`Digit ${i + 1}`}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          maxLength={1}
          value={d}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            set(i, v);
            if (v) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i]) refs.current[i - 1]?.focus();
          }}
          className={cn(
            'h-14 w-full min-w-0 rounded-2xl border bg-surface-raised text-center font-display text-2xl font-semibold outline-none transition-all',
            'focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15',
            d ? 'border-brand-300' : 'border-line-strong',
          )}
        />
      ))}
    </div>
  );
}
