'use client';

import React from 'react';
import type { AircraftCategory, SilhouetteState } from './types';
import { SILHOUETTES } from './paths';
import { getSilhouetteStyle } from './styles';

export interface AircraftSilhouetteProps {
  category: AircraftCategory;
  state?: SilhouetteState;
  size?: number;
  rotationDeg?: number;
  className?: string;
  'aria-label'?: string;
}

/**
 * Top-Down Aircraft Silhouette Component
 */
export function AircraftSilhouette({
  category = 'unknown',
  state = 'default',
  size = 32,
  rotationDeg = 0,
  className = '',
  'aria-label': ariaLabel,
}: AircraftSilhouetteProps) {
  const definition = SILHOUETTES[category] || SILHOUETTES.unknown;
  const style = getSilhouetteStyle(state, size);

  return (
    <svg
      width={size}
      height={size}
      viewBox={definition.viewBox}
      className={`inline-block select-none overflow-visible transition-transform duration-150 ${className}`}
      style={{
        transform: `rotate(${rotationDeg}deg) scale(${style.scale})`,
        opacity: style.opacity,
      }}
      aria-label={ariaLabel || `${category} silhouette (${state})`}
      role="img"
    >
      {/* Primary Aircraft Body Path */}
      <path
        d={definition.bodyPath}
        fill={style.fill}
        stroke={style.stroke || 'none'}
        strokeWidth={style.strokeWidth || 0}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Aerodynamic Details (Engines, Propellers, Rotor Discs) */}
      {definition.detailPaths?.map((detail, idx) => {
        const detailFill = detail.fill !== undefined ? detail.fill : style.fill;
        const detailStroke = detail.stroke || (style.state === 'selected' ? '#FFFFFF' : '#0E1116');
        return (
          <path
            key={idx}
            d={detail.d}
            fill={detailFill}
            stroke={detailStroke}
            strokeWidth={detail.strokeWidth ?? (detail.stroke ? 1.5 : 0)}
            strokeDasharray={detail.strokeDasharray}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={detail.opacity ?? 1}
          />
        );
      })}
    </svg>
  );
}
