'use client';

import React from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

// ─── Button variants ──────────────────────────────────────────────────────────
// ink   → primary filled, dark ink background
// signal → vermilion accent CTA
// ghost → no background, subtle hover
// outline → hairline border

export type ButtonVariant = 'ink' | 'signal' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
};

const variantStyles: Record<ButtonVariant, string> = {
  ink: [
    'bg-[var(--ink)] text-[var(--paper)] border border-[var(--ink)]',
    'hover:bg-[var(--ink-2)] hover:border-[var(--ink-2)]',
    'disabled:bg-[var(--ink-4)] disabled:border-[var(--ink-4)]',
  ].join(' '),
  signal: [
    'bg-[var(--signal-cta,var(--signal))] text-white border border-[var(--signal-cta,var(--signal))]',
    'hover:bg-[var(--signal-ink)] hover:border-[var(--signal-ink)]',
    'disabled:bg-[var(--ink-4)] disabled:border-[var(--ink-4)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--ink)] border border-transparent',
    'hover:bg-[var(--surface-2)] hover:border-[var(--line)]',
    'disabled:text-[var(--ink-4)]',
  ].join(' '),
  outline: [
    'bg-transparent text-[var(--ink)] border border-[var(--line-strong)]',
    'hover:bg-[var(--surface-2)] hover:border-[var(--ink-3)]',
    'disabled:text-[var(--ink-4)] disabled:border-[var(--line)]',
  ].join(' '),
};

export function Button({
  variant = 'ink',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        // Base
        'inline-flex items-center justify-center font-medium rounded-[var(--r-md)]',
        'transition-all cursor-pointer select-none whitespace-nowrap',
        // Press micro-animation
        'active:scale-[0.98]',
        // Arrow-slide on hover (right-icon variant)
        'group',
        // Sizes
        sizeStyles[size],
        // Variant
        variantStyles[variant],
        // Disabled
        isDisabled ? 'cursor-not-allowed opacity-60' : '',
        // Focus ring handled globally
        className,
      ].filter(Boolean).join(' ')}
    >
      {loading ? (
        <Icon name="loader" size={14} className="animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && (
          <Icon name={icon} size={size === 'lg' ? 18 : size === 'md' ? 16 : 14} className="shrink-0" />
        )
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <Icon
          name={icon}
          size={size === 'lg' ? 18 : size === 'md' ? 16 : 14}
          className={[
            'shrink-0',
            icon === 'arrow-right' ? 'transition-transform group-hover:translate-x-0.5' : '',
          ].filter(Boolean).join(' ')}
        />
      )}
    </button>
  );
}
