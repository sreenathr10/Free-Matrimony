import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

const control = cn(
  'w-full rounded-[var(--radius-field)] border border-line-strong bg-surface-raised px-4 text-[0.95rem] text-ink',
  'placeholder:text-ink-faint shadow-[inset_0_1px_2px_rgb(68_5_26/0.04)] outline-none transition-all duration-200',
  'hover:border-brand-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15',
  'disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-brand-500',
);

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? (
        <span className="text-sm font-medium text-brand-600">{error}</span>
      ) : (
        hint && <span className="text-xs text-ink-muted">{hint}</span>
      )}
    </label>
  );
}

export function Input({ className, icon, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  if (!icon) return <input className={cn(control, 'h-12', className)} {...props} />;
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint">{icon}</span>
      <input className={cn(control, 'h-12 pl-11', className)} {...props} />
    </span>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-32 resize-y py-3 leading-relaxed', className)} {...props} />;
}

export function Select({
  options,
  placeholder,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: readonly { value: string; label: string }[]; placeholder?: string }) {
  return (
    <span className="relative block">
      <select className={cn(control, 'h-12 cursor-pointer appearance-none pr-10', className)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
      </svg>
    </span>
  );
}

/** Pill toggles for picking several values from a list. */
export function ChipPicker({ options, value, onChange }: { options: readonly { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
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
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
              on
                ? 'border-transparent bg-brand-gradient text-white shadow-glow'
                : 'border-line-strong bg-surface-raised text-ink-muted hover:border-brand-300 hover:text-ink',
            )}
          >
            {on && (
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" />
              </svg>
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Large selectable option, for single-choice questions. */
export function ChoiceCard({ selected, onClick, icon, title, description }: { selected: boolean; onClick: () => void; icon?: ReactNode; title: string; description?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200',
        selected
          ? 'border-brand-400 bg-brand-50/70 shadow-[0_0_0_4px_rgb(238_63_104/0.12)] dark:bg-brand-950/30'
          : 'border-line-strong bg-surface-raised hover:-translate-y-px hover:border-brand-200 hover:shadow-soft',
      )}
    >
      {icon && (
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors', selected ? 'bg-brand-gradient text-white' : 'bg-surface-sunken text-brand-600')}>
          {icon}
        </span>
      )}
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        {description && <span className="block text-sm text-ink-muted">{description}</span>}
      </span>
      <span className={cn('grid h-5 w-5 place-items-center rounded-full border-2 transition-colors', selected ? 'border-brand-600 bg-brand-600' : 'border-line-strong')}>
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-line', className)} role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400 transition-all duration-700 ease-out" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 rounded-full transition-colors duration-200', checked ? 'bg-brand-gradient' : 'bg-line-strong')}
      >
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200', checked ? 'left-6' : 'left-1')} />
      </button>
    </label>
  );
}
