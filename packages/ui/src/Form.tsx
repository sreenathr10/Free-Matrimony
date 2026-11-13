import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

const control =
  'w-full rounded-xl border border-line bg-surface px-4 text-base outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:opacity-60';

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-sm text-brand-600">{error}</span> : hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-12', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-28 py-3', className)} {...props} />;
}

export function Select({
  options,
  placeholder,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: readonly { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select className={cn(control, 'h-12 appearance-none', className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Pill toggles for picking several values from a short list. */
export function ChipPicker({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-ink-muted hover:border-brand-200',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: readonly { id: T; label: string }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            t.id === active ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
