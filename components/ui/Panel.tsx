'use client';

import React from 'react';

export type PanelVariant = 'surface' | 'recessed' | 'floating';
export type PanelPadding = 'none' | 'sm' | 'md' | 'lg';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
  padding?: PanelPadding;
  radius?: 'sm' | 'md' | 'lg';
  header?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<PanelVariant, string> = {
  surface: 'bg-[var(--surface)] border border-[var(--line)] shadow-[var(--sh-1)]',
  recessed: 'bg-[var(--paper-2)] border border-[var(--line)]',
  floating: 'bg-[var(--surface)] border border-[var(--line)] shadow-[var(--sh-2)]',
};

const radiusStyles = {
  sm: 'rounded-[var(--r-sm)]',
  md: 'rounded-[var(--r-md)]',
  lg: 'rounded-[var(--r-lg)]',
};

const paddingStyles: Record<PanelPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Panel({
  variant = 'surface',
  padding = 'md',
  radius = 'lg',
  header,
  children,
  className = '',
  ...props
}: PanelProps) {
  return (
    <div
      {...props}
      className={[
        radiusStyles[radius],
        variantStyles[variant],
        'relative transition-all overflow-hidden',
        className,
      ].join(' ')}
    >
      {header && (
        <div className="border-b border-[var(--line)] px-5 py-3.5 bg-[var(--surface-2)]/60 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
}
