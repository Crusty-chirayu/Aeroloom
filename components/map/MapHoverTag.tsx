'use client';

import React from 'react';
import type { AircraftState } from '@/lib/providers/types';

interface MapHoverTagProps {
  aircraft: AircraftState | null;
  x: number;
  y: number;
  visible: boolean;
}

export function MapHoverTag({ aircraft, x, y, visible }: MapHoverTagProps) {
  if (!visible || !aircraft) return null;

  const altitudeText =
    typeof aircraft.altitudeFt === 'number'
      ? aircraft.altitudeFt >= 18000
        ? `FL${Math.round(aircraft.altitudeFt / 100)}`
        : `${aircraft.altitudeFt.toLocaleString()} ft`
      : '---';

  const speedText =
    typeof aircraft.groundSpeedKt === 'number'
      ? `${Math.round(aircraft.groundSpeedKt)} kt`
      : '---';

  const verticalArrow =
    typeof aircraft.verticalRateFpm === 'number'
      ? aircraft.verticalRateFpm > 150
        ? '↑'
        : aircraft.verticalRateFpm < -150
        ? '↓'
        : '→'
      : '';

  return (
    <div
      className="pointer-events-none fixed z-30 transition-transform duration-75 ease-out select-none"
      style={{
        left: `${x + 14}px`,
        top: `${y - 12}px`,
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm border border-[var(--ink)] shadow-md px-2.5 py-1.5 rounded-sm flex flex-col gap-0.5 min-w-[120px]">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-1">
          <span className="font-mono font-bold text-xs text-[var(--ink)] tracking-wider">
            {aircraft.callsign || aircraft.id.toUpperCase()}
          </span>
          {aircraft.typeCode && (
            <span className="font-mono text-[10px] text-[var(--ink-3)] font-semibold">
              {aircraft.typeCode}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-2)] pt-0.5">
          <span>{altitudeText} {verticalArrow}</span>
          <span className="font-medium text-[var(--ink)]">{speedText}</span>
        </div>
      </div>
    </div>
  );
}
