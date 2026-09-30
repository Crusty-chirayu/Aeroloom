import React from 'react';

export type ChipVariant = 'ok' | 'warn' | 'bad' | 'signal' | 'neutral' | 'sky';

interface ChipProps {
  variant?: ChipVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<ChipVariant, string> = {
  ok:      'bg-[#E6F5EF] text-[var(--ok)]',
  warn:    'bg-[#FEF3E2] text-[var(--warn)]',
  bad:     'bg-[#FBE9E9] text-[var(--bad)]',
  signal:  'bg-[var(--signal-wash)] text-[var(--signal-ink)]',
  neutral: 'bg-[var(--paper-2)] text-[var(--ink-2)]',
  sky:     'bg-[var(--sky-wash)] text-[var(--sky)]',
};

const dotStyles: Record<ChipVariant, string> = {
  ok:      'bg-[var(--ok)]',
  warn:    'bg-[var(--warn)]',
  bad:     'bg-[var(--bad)]',
  signal:  'bg-[var(--signal)]',
  neutral: 'bg-[var(--ink-3)]',
  sky:     'bg-[var(--sky)]',
};

export function Chip({ variant = 'neutral', children, className = '', dot = false }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--r-pill)]',
        'font-mono text-[11px] font-medium uppercase tracking-[0.06em]',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={['w-1.5 h-1.5 rounded-full shrink-0', dotStyles[variant]].join(' ')} />
      )}
      {children}
    </span>
  );
}
