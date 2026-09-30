'use client';

import React from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName;
  clearable?: boolean;
  onClear?: () => void;
  mono?: boolean;
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    icon,
    clearable = false,
    onClear,
    mono = false,
    error,
    label,
    className = '',
    value,
    disabled,
    ...props
  },
  ref
) {
  const hasValue = value !== undefined && value !== '';

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="mono-label text-[11px] text-[var(--ink-3)] font-medium">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--ink-3)]">
            <Icon name={icon} size={15} />
          </div>
        )}
        <input
          ref={ref}
          value={value}
          disabled={disabled}
          {...props}
          className={[
            'w-full h-10 rounded-[var(--r-md)] bg-[var(--surface)] text-[var(--ink)]',
            'border border-[var(--line-strong)] px-3.5 text-sm transition-all',
            'placeholder:text-[var(--ink-4)] placeholder:font-normal',
            'hover:border-[var(--ink-3)]',
            'focus:border-[var(--signal)] focus:outline-none focus:ring-1 focus:ring-[var(--signal)]',
            icon ? 'pl-9' : '',
            clearable && hasValue ? 'pr-9' : '',
            mono ? 'font-mono text-[13px] tracking-tight' : 'font-sans',
            error ? 'border-[var(--bad)] focus:border-[var(--bad)] focus:ring-[var(--bad)]' : '',
            disabled ? 'opacity-50 cursor-not-allowed bg-[var(--paper-2)]' : '',
            className,
          ].filter(Boolean).join(' ')}
        />
        {clearable && hasValue && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-full text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors"
            aria-label="Clear input"
          >
            <Icon name="close" size={13} />
          </button>
        )}
      </div>
      {error && (
        <p className="text-[12px] text-[var(--bad)] font-sans">{error}</p>
      )}
    </div>
  );
});
