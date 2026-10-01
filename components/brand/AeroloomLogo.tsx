'use client';

import React from 'react';

export type LogoVariant = 'mark' | 'lockup' | 'monochrome' | 'wordmark';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AeroloomLogoProps {
  variant?: LogoVariant;
  size?: LogoSize | number;
  className?: string;
  theme?: 'light' | 'dark' | 'monochrome';
}

const SIZE_MAP: Record<LogoSize, { markSize: number; fontSize: number; gap: number }> = {
  sm: { markSize: 20, fontSize: 16, gap: 8 },
  md: { markSize: 28, fontSize: 20, gap: 10 },
  lg: { markSize: 38, fontSize: 26, gap: 12 },
  xl: { markSize: 52, fontSize: 34, gap: 16 },
};

/**
 * Aeroloom Logo Mark SVG
 *
 * Geometric concept:
 * Two continuous aerodynamic threads (warp and weft of the airspace loom)
 * weaving through an altitude cross-over, terminated by a single vermilion
 * aircraft transponder blip.
 *
 * Guaranteed visibility from 16px favicon up to 512px hero banner.
 */
export function AeroloomMark({
  size = 28,
  monochrome = false,
  className = '',
}: {
  size?: number;
  monochrome?: boolean;
  className?: string;
}) {
  const inkColor = '#0E1116';
  const dotColor = monochrome ? inkColor : '#FF4F1F';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Weft Thread 1: Ascending aerodynamic flight vector */}
      <path
        d="M 5 24 C 9 24, 12 18, 15 12 C 17.5 7, 21.5 5.5, 24.5 7.5 C 27.5 9.5, 27 15, 23.5 18 C 19 22, 11 22.5, 7.5 17 C 4.5 12, 7 6.5, 13.5 6.5 C 19 6.5, 23.5 11, 26.5 17"
        stroke={inkColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Loom Cross-Weave Thread (Under-Over contrail anchor) */}
      <path
        d="M 10 9 C 14 13, 18 19, 22 25"
        stroke={inkColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="0.1 7"
      />

      {/* Vermilion Beacon Dot (Live Aircraft Transponder Blip) */}
      <circle
        cx="26.5"
        cy="17"
        r="2.8"
        fill={dotColor}
      />
    </svg>
  );
}

/**
 * Complete Aeroloom Brand Presentation Component
 */
export function AeroloomLogo({
  variant = 'lockup',
  size = 'md',
  className = '',
  theme = 'light',
}: AeroloomLogoProps) {
  const isMonochrome = theme === 'monochrome' || variant === 'monochrome';
  const sizeConfig = typeof size === 'number'
    ? { markSize: size, fontSize: Math.round(size * 0.72), gap: Math.round(size * 0.35) }
    : SIZE_MAP[size];

  if (variant === 'mark' || variant === 'monochrome') {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} title="Aeroloom">
        <AeroloomMark size={sizeConfig.markSize} monochrome={isMonochrome} />
      </span>
    );
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={`font-serif tracking-tight text-[var(--ink)] select-none ${className}`}
        style={{ fontSize: `${sizeConfig.fontSize}px`, lineHeight: 1 }}
      >
        Aeroloom
      </span>
    );
  }

  // Horizontal Lockup: Mark + Wordmark
  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{ gap: `${sizeConfig.gap}px` }}
      aria-label="Aeroloom"
    >
      <AeroloomMark size={sizeConfig.markSize} monochrome={isMonochrome} />
      <div className="flex flex-col">
        <span
          className="font-serif font-normal tracking-tight text-[var(--ink)] leading-none"
          style={{ fontSize: `${sizeConfig.fontSize}px` }}
        >
          Aeroloom
        </span>
        {sizeConfig.markSize >= 36 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-3)] mt-0.5">
            Airspace Cartography
          </span>
        )}
      </div>
    </div>
  );
}
