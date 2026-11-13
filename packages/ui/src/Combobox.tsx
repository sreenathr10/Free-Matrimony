'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from './cn';

export interface ComboOption {
  value: string;
  label: string;
  /** Shown under the label, e.g. sub-castes or other spellings. */
  hint?: string;
  /** Extra words that should match a search (aliases). */
  keywords?: readonly string[];
  group?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

function rank(options: readonly ComboOption[], query: string) {
  const q = norm(query);
  if (!q) return [...options];
  const score = (o: ComboOption) => {
    const label = norm(o.label);
    if (label.startsWith(q)) return 0;
    const words = [o.label, ...(o.keywords ?? [])].map(norm);
    if (words.some((w) => w.startsWith(q))) return 1;
    if (words.some((w) => w.includes(q))) return 2;
    if (o.hint && norm(o.hint).includes(q)) return 3;
    return 9;
  };
  return options
    .map((o, i) => ({ o, s: score(o), i }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.o);
}

const control = cn(
  'flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-[var(--radius-field)] border border-line-strong bg-surface-raised px-3 py-1.5 text-[0.95rem] text-ink',
  'shadow-[inset_0_1px_2px_rgb(68_5_26/0.04)] transition-all duration-200',
  'hover:border-brand-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/15',
);

const Check = () => (
  <svg
    className="h-4 w-4 shrink-0 text-brand-600"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" />
  </svg>
);

/**
 * Searchable picker for long lists (castes, denominations). Single value by default; `multiple` keeps a list of chips.
 * With `allowCustom`, the member can keep exactly what they typed when it isn't in the list.
 */
export function Combobox(
  props: {
    options: readonly ComboOption[];
    placeholder?: string;
    allowCustom?: boolean;
    /** Text for the custom row, given what was typed. */
    customLabel?: (typed: string) => string;
    disabled?: boolean;
    emptyText?: string;
    'aria-label'?: string;
  } & (
    | { multiple?: false; value: string; onChange: (v: string) => void }
    | { multiple: true; value: string[]; onChange: (v: string[]) => void }
  ),
) {
  const {
    options,
    placeholder,
    allowCustom,
    customLabel,
    disabled,
    emptyText = 'No matches',
  } = props;
  const selected = props.multiple ? props.value : props.value ? [props.value] : [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  const results = useMemo(() => rank(options, query).slice(0, 80), [options, query]);
  const typed = query.trim();
  const exact = results.some(
    (o) => norm(o.label) === norm(typed) || o.keywords?.some((k) => norm(k) === norm(typed)),
  );
  const showCustom = allowCustom && typed.length > 1 && !exact;
  const rows: { option: ComboOption; custom?: boolean }[] = [
    ...results.map((option) => ({ option })),
    ...(showCustom
      ? [
          {
            option: { value: typed, label: customLabel ? customLabel(typed) : `Use “${typed}”` },
            custom: true,
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  function pick(value: string) {
    if (props.multiple) {
      const on = props.value.includes(value);
      props.onChange(on ? props.value.filter((v) => v !== value) : [...props.value, value]);
      setQuery('');
      input.current?.focus();
    } else {
      props.onChange(value);
      setQuery('');
      setOpen(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && rows[active]) {
        e.preventDefault();
        pick(rows[active].option.value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Backspace' && !query && props.multiple && props.value.length) {
      props.onChange(props.value.slice(0, -1));
    }
  }

  let lastGroup: string | undefined;
  const showValueInInput = !props.multiple && !open && !!props.value;

  return (
    <div ref={root} className="relative" onClick={(e) => e.preventDefault()}>
      <div
        className={cn(control, disabled && 'pointer-events-none opacity-60')}
        onMouseDown={(e) => {
          if (e.target !== input.current) e.preventDefault();
          setOpen(true);
          input.current?.focus();
        }}
      >
        {props.multiple &&
          props.value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-brand-gradient py-1 pl-3 pr-1.5 text-sm font-medium text-white shadow-glow"
            >
              {labelOf(v)}
              <button
                type="button"
                aria-label={`Remove ${labelOf(v)}`}
                className="grid h-5 w-5 place-items-center rounded-full hover:bg-white/20"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  pick(v);
                }}
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4z" />
                </svg>
              </button>
            </span>
          ))}
        <input
          ref={input}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-label={props['aria-label']}
          aria-activedescendant={open && rows[active] ? `${id}-${active}` : undefined}
          disabled={disabled}
          className="h-9 min-w-24 flex-1 bg-transparent px-1 outline-none placeholder:text-ink-faint"
          placeholder={
            props.multiple && props.value.length
              ? 'Add more'
              : showValueInInput
                ? undefined
                : placeholder
          }
          value={showValueInInput ? labelOf(props.value as string) : query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKey}
        />
        {!props.multiple && props.value && !disabled ? (
          <button
            type="button"
            aria-label="Clear"
            className="grid h-7 w-7 place-items-center rounded-full text-ink-faint hover:bg-surface-sunken hover:text-ink"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              props.onChange('');
              setQuery('');
            }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4z" />
            </svg>
          </button>
        ) : (
          <svg
            className="mr-1 h-4 w-4 shrink-0 text-ink-faint"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
          </svg>
        )}
      </div>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-multiselectable={props.multiple || undefined}
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface-raised p-1.5 shadow-lift"
        >
          {rows.length === 0 && <li className="px-3 py-3 text-sm text-ink-muted">{emptyText}</li>}
          {rows.map(({ option, custom }, i) => {
            const header =
              !custom && option.group && option.group !== lastGroup ? option.group : null;
            if (!custom) lastGroup = option.group;
            const on = selected.includes(option.value);
            return (
              <li key={`${custom ? 'custom' : 'o'}-${option.value}`} role="presentation">
                {header && (
                  <div className="px-3 pb-1 pt-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
                    {header}
                  </div>
                )}
                <div
                  id={`${id}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={on}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(option.value)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    i === active && 'bg-brand-500/10',
                    custom ? 'mt-1 font-semibold text-brand-600' : 'text-ink',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.hint && (
                      <div className="truncate text-xs text-ink-muted">{option.hint}</div>
                    )}
                  </div>
                  {on && <Check />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
