import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  circle?: boolean;
}

export function Skeleton({ className = '', circle = false, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      className={[
        'animate-pulse bg-[var(--paper-2)]',
        circle ? 'rounded-full' : 'rounded-[var(--r-sm)]',
        className,
      ].join(' ')}
      aria-hidden="true"
    />
  );
}
