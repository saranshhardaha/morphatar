'use client';

import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
        {hint ? <span className="font-mono text-[10px] text-soft">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (next: T) => void;
  columns?: number;
}) {
  return (
    <div
      role="radiogroup"
      className="grid gap-px border border-line bg-line"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={[
              'px-2 py-2 font-mono text-[11px] lowercase tracking-wide transition-colors',
              active ? 'bg-chalk text-ink' : 'bg-surface text-soft hover:bg-raised hover:text-chalk',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="space-y-2">
      <input
        type="range"
        className="slider"
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="flex justify-between font-mono text-[10px] text-muted">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((tick) => (
          <span key={tick} className={tick === value ? 'text-chalk' : undefined}>
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'solid' | 'ghost';
  title?: string;
}) {
  const styles =
    variant === 'solid'
      ? 'bg-chalk text-ink hover:bg-soft'
      : 'border border-line bg-surface text-soft hover:border-soft hover:text-chalk';
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-3 py-2 font-mono text-[11px] lowercase tracking-wide transition-colors ${styles}`}
    >
      {children}
    </button>
  );
}

export function PalettePicker({
  presets,
  activeIndex,
  onChange,
}: {
  presets: readonly { name: string; colors?: string[] }[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-px border border-line bg-line">
      {presets.map((preset, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={preset.name}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(index)}
            className={[
              'flex items-center gap-2 px-2.5 py-2 transition-colors',
              active ? 'bg-chalk text-ink' : 'bg-surface text-soft hover:bg-raised hover:text-chalk',
            ].join(' ')}
          >
            <span className="flex h-3 w-8 shrink-0 overflow-hidden border border-line">
              {(preset.colors ?? ['#000000', '#3f3f46', '#a1a1aa', '#fafafa']).map((color, i) => (
                <span key={i} className="flex-1" style={{ background: color }} />
              ))}
            </span>
            <span className="truncate font-mono text-[11px] lowercase">{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
}
