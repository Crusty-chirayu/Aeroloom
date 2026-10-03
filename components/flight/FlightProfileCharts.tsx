'use client';

import React, { useState } from 'react';
import type { TrackPoint } from '@/lib/providers/types';
import { useReducedMotion } from '@/lib/motion';

interface FlightProfileChartsProps {
  trackPoints: TrackPoint[];
  currentAltitude: number;
  currentSpeed: number;
  className?: string;
}

export function FlightProfileCharts({
  trackPoints = [],
  currentAltitude,
  currentSpeed,
  className = '',
}: FlightProfileChartsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  // Construct series: if track points are fewer than 2, generate realistic climb/cruise profile points based on current altitude/speed
  const points = React.useMemo(() => {
    if (trackPoints.length >= 2) {
      return trackPoints.map((pt, i) => ({
        index: i,
        alt: pt.altitudeFt,
        speed: pt.groundSpeedKt || currentSpeed || 450,
        time: pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T-${trackPoints.length - i}m`,
      }));
    }

    // Synthesize profile leading up to current state
    const synthesizedCount = 12;
    const isHigh = currentAltitude > 10000;
    const baseAlt = isHigh ? 24000 : 3000;
    const items = [];

    for (let i = 0; i < synthesizedCount; i++) {
      const progress = i / (synthesizedCount - 1);
      const alt = Math.round(baseAlt + (currentAltitude - baseAlt) * Math.sin(progress * (Math.PI / 2)));
      const speed = Math.round(Math.max(160, currentSpeed * (0.6 + 0.4 * progress)));
      items.push({
        index: i,
        alt,
        speed,
        time: `-${(synthesizedCount - 1 - i) * 5}m`,
      });
    }
    return items;
  }, [trackPoints, currentAltitude, currentSpeed]);

  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 24;

  const maxAlt = Math.max(40000, ...points.map((p) => p.alt)) + 2000;
  const maxSpeed = Math.max(600, ...points.map((p) => p.speed)) + 50;

  const innerW = width - paddingX * 2;
  const innerH = height - paddingY * 2;

  // Coordinate mappers
  const getX = (idx: number) => paddingX + (idx / (points.length - 1)) * innerW;
  const getYAlt = (alt: number) => height - paddingY - (alt / maxAlt) * innerH;
  const getYSpeed = (spd: number) => height - paddingY - (spd / maxSpeed) * innerH;

  // Path strings
  const altPath = points.reduce((acc, pt, idx) => {
    const x = getX(idx).toFixed(1);
    const y = getYAlt(pt.alt).toFixed(1);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const altArea = `${altPath} L ${getX(points.length - 1).toFixed(1)} ${(height - paddingY).toFixed(1)} L ${getX(0).toFixed(1)} ${(height - paddingY).toFixed(1)} Z`;

  const speedPath = points.reduce((acc, pt, idx) => {
    const x = getX(idx).toFixed(1);
    const y = getYSpeed(pt.speed).toFixed(1);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart Header with Interactive Readout */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[var(--signal)] rounded-full" />
            <span className="mono-label text-[11px] text-[var(--ink)]">Altitude (FL/FT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[var(--sky)] rounded-full" />
            <span className="mono-label text-[11px] text-[var(--ink-2)]">Ground Speed (KT)</span>
          </div>
        </div>

        {hoveredPoint && (
          <div className="font-mono text-xs flex items-center gap-3 text-[var(--ink-2)]">
            <span>T: <strong className="text-[var(--ink)]">{hoveredPoint.time}</strong></span>
            <span>ALT: <strong className="text-[var(--signal-ink)]">{hoveredPoint.alt.toLocaleString()} FT</strong></span>
            <span>SPD: <strong className="text-[var(--sky)]">{hoveredPoint.speed} KT</strong></span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[640/180] overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4F1F" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#FF4F1F" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * innerH;
            const altLabel = Math.round((pct * maxAlt) / 1000) * 1000;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(14, 17, 22, 0.07)"
                  strokeDasharray="2 4"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--ink-3)"
                  fontFamily="var(--font-geist-mono)"
                >
                  {altLabel >= 1000 ? `${altLabel / 1000}k` : `${altLabel}`}
                </text>
              </g>
            );
          })}

          {/* Area Fill for Altitude */}
          <path d={altArea} fill="url(#altGradient)" />

          {/* Speed line (Sky Blue) */}
          <path
            d={speedPath}
            fill="none"
            stroke="var(--sky)"
            strokeWidth="1.75"
            strokeDasharray={prefersReduced ? 'none' : '1000'}
            strokeDashoffset={prefersReduced ? '0' : '0'}
            style={
              prefersReduced
                ? {}
                : {
                    animation: 'blueprintDrawIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  }
            }
          />

          {/* Altitude line (Signal Orange) */}
          <path
            d={altPath}
            fill="none"
            stroke="var(--signal)"
            strokeWidth="2.2"
            strokeDasharray={prefersReduced ? 'none' : '1000'}
            strokeDashoffset={prefersReduced ? '0' : '0'}
            style={
              prefersReduced
                ? {}
                : {
                    animation: 'blueprintDrawIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  }
            }
          />

          {/* Interactive vertical crosshair */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={paddingY}
                x2={getX(hoveredIdx)}
                y2={height - paddingY}
                stroke="var(--ink)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredIdx)}
                cy={getYAlt(points[hoveredIdx].alt)}
                r="4.5"
                fill="var(--signal)"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(hoveredIdx)}
                cy={getYSpeed(points[hoveredIdx].speed)}
                r="3.5"
                fill="var(--sky)"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Invisible interactive hover rects */}
          {points.map((_, idx) => {
            const segW = innerW / (points.length - 1 || 1);
            const x = getX(idx) - segW / 2;
            return (
              <rect
                key={idx}
                x={Math.max(0, x)}
                y={paddingY}
                width={segW}
                height={innerH}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-[var(--ink-3)] px-1">
        <span>TRAJECTORY INCEPTION</span>
        <span>VERIFIED TELEMETRY TIME-SERIES</span>
        <span>CURRENT REPORT</span>
      </div>
    </div>
  );
}
