'use client';

import React, { useMemo } from 'react';
import type { PositionSample } from '@/lib/providers/positions/types';

interface FlightSparklinesProps {
  samples: PositionSample[];
  currentAltitude?: number;
  currentSpeed?: number;
}

export function FlightSparklines({
  samples,
  currentAltitude = 0,
  currentSpeed = 0,
}: FlightSparklinesProps) {
  // Altitude points calculation
  const altitudeData = useMemo(() => {
    const list = samples.length > 0 ? samples.map((s) => s.altitude) : [currentAltitude];
    if (list.length === 1) list.unshift(list[0]);

    const min = Math.max(0, Math.min(...list));
    const max = Math.max(min + 1000, Math.max(...list));
    const range = max - min || 1;

    const width = 160;
    const height = 40;
    const padding = 4;

    const points = list.map((val, idx) => {
      const x = padding + (idx / (list.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y, val };
    });

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

    return { points, pathD, areaD, min, max, last: list[list.length - 1] };
  }, [samples, currentAltitude]);

  // Speed points calculation
  const speedData = useMemo(() => {
    const list = samples.length > 0 ? samples.map((s) => s.speed) : [currentSpeed];
    if (list.length === 1) list.unshift(list[0]);

    const min = Math.max(0, Math.min(...list));
    const max = Math.max(min + 50, Math.max(...list));
    const range = max - min || 1;

    const width = 160;
    const height = 40;
    const padding = 4;

    const points = list.map((val, idx) => {
      const x = padding + (idx / (list.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y, val };
    });

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

    return { points, pathD, areaD, min, max, last: list[list.length - 1] };
  }, [samples, currentSpeed]);

  return (
    <div className="grid grid-cols-2 gap-3 py-2">
      {/* Altitude Sparkline */}
      <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-3)]">
            Altitude Profile
          </span>
          <span className="text-[11px] font-mono font-medium text-[var(--ink)]">
            {altitudeData.last.toLocaleString()} ft
          </span>
        </div>
        <div className="h-10 w-full overflow-hidden flex items-center justify-center">
          <svg
            viewBox="0 0 160 40"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            aria-label="Altitude profile sparkline"
          >
            <defs>
              <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--signal)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={altitudeData.areaD} fill="url(#altGrad)" />
            <path
              d={altitudeData.pathD}
              fill="none"
              stroke="var(--signal)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {altitudeData.points.length > 0 && (
              <circle
                cx={altitudeData.points[altitudeData.points.length - 1].x}
                cy={altitudeData.points[altitudeData.points.length - 1].y}
                r="2.5"
                fill="var(--signal)"
              />
            )}
          </svg>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-[var(--ink-4)] mt-1">
          <span>{altitudeData.min.toLocaleString()} ft</span>
          <span>{altitudeData.max.toLocaleString()} ft</span>
        </div>
      </div>

      {/* Speed Sparkline */}
      <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-3)]">
            Ground Speed
          </span>
          <span className="text-[11px] font-mono font-medium text-[var(--ink)]">
            {Math.round(speedData.last)} kt
          </span>
        </div>
        <div className="h-10 w-full overflow-hidden flex items-center justify-center">
          <svg
            viewBox="0 0 160 40"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            aria-label="Speed profile sparkline"
          >
            <defs>
              <linearGradient id="spdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={speedData.areaD} fill="url(#spdGrad)" />
            <path
              d={speedData.pathD}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {speedData.points.length > 0 && (
              <circle
                cx={speedData.points[speedData.points.length - 1].x}
                cy={speedData.points[speedData.points.length - 1].y}
                r="2.5"
                fill="var(--ink)"
              />
            )}
          </svg>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-[var(--ink-4)] mt-1">
          <span>{Math.round(speedData.min)} kt</span>
          <span>{Math.round(speedData.max)} kt</span>
        </div>
      </div>
    </div>
  );
}
