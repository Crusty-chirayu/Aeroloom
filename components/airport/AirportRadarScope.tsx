'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { useReducedMotion } from '@/lib/motion';
import type { AircraftState } from '@/lib/providers/types';

export interface AirportRadarScopeProps {
  airport: {
    name: string;
    iata: string;
    icao: string;
    latitude: number;
    longitude: number;
    elevationFt?: number;
  };
  aircraft: AircraftState[];
  isLoading?: boolean;
  className?: string;
}

type RangeOption = 10 | 25 | 50 | 100;

// Helper: Great circle distance (NM) and initial bearing (degrees)
function calculateDistanceAndBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceNm: number; bearingDeg: number } {
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceNm = c * 3440.065;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearingDeg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  return { distanceNm, bearingDeg };
}

export function AirportRadarScope({
  airport,
  aircraft,
  isLoading = false,
  className = '',
}: AirportRadarScopeProps) {
  const isReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Controls & View State
  const [rangeNm, setRangeNm] = useState<RangeOption>(25);
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');
  const [selectedIcao, setSelectedIcao] = useState<string | null>(null);
  const [hoveredIcao, setHoveredIcao] = useState<string | null>(null);
  const [showTags, setShowTags] = useState<boolean>(true);
  const [sweepAngle, setSweepAngle] = useState<number>(0);

  // Store last update timestamp for dead reckoning
  const lastUpdateRef = useRef<number>(0);
  useEffect(() => {
    lastUpdateRef.current = Date.now();
  }, [aircraft]);

  // Compute calculated positions & distance/bearing from airport
  const ProcessedAircraft = useMemo(() => {
    return aircraft.map((ac) => {
      const acLat = ac.lat ?? (ac as unknown as { latitude: number }).latitude;
      const acLon = ac.lon ?? (ac as unknown as { longitude: number }).longitude;
      const { distanceNm, bearingDeg } = calculateDistanceAndBearing(
        airport.latitude,
        airport.longitude,
        acLat,
        acLon
      );
      return {
        ...ac,
        acLat,
        acLon,
        distanceNm,
        bearingDeg,
      };
    });
  }, [aircraft, airport.latitude, airport.longitude]);

  // Filter within current range
  const visibleAircraft = useMemo(() => {
    return ProcessedAircraft.filter((ac) => ac.distanceNm <= rangeNm);
  }, [ProcessedAircraft, rangeNm]);

  // Selected aircraft detail
  const selectedAircraft = useMemo(() => {
    return ProcessedAircraft.find((ac) => ac.id === selectedIcao || ac.callsign === selectedIcao);
  }, [ProcessedAircraft, selectedIcao]);

  // Canvas Drawing & Animation Loop
  useEffect(() => {
    if (viewMode !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background - Editorial Paper aesthetic
      ctx.fillStyle = '#F6F4EE';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scopeRadius = Math.min(cx, cy) - 36;
      const pxPerNm = scopeRadius / rangeNm;

      // 1. Draw Outer Scope Border & Degree Ticks
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, scopeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Degree ticks & cardinal labels
      ctx.font = '500 10px monospace';
      ctx.fillStyle = '#444444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let deg = 0; deg < 360; deg += 10) {
        const rad = (deg - 90) * (Math.PI / 180);
        const isMajor = deg % 30 === 0;
        const tickLength = isMajor ? 8 : 4;
        const x1 = cx + (scopeRadius - tickLength) * Math.cos(rad);
        const y1 = cy + (scopeRadius - tickLength) * Math.sin(rad);
        const x2 = cx + scopeRadius * Math.cos(rad);
        const y2 = cy + scopeRadius * Math.sin(rad);

        ctx.strokeStyle = isMajor ? '#111111' : '#888888';
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (isMajor) {
          const labelRad = (deg - 90) * (Math.PI / 180);
          const lx = cx + (scopeRadius + 18) * Math.cos(labelRad);
          const ly = cy + (scopeRadius + 18) * Math.sin(labelRad);
          const labelStr = deg === 0 ? '360°' : `${deg.toString().padStart(3, '0')}°`;
          ctx.fillText(labelStr, lx, ly);
        }
      }

      // 2. Draw Concentric Range Rings
      const ringIntervals: Record<RangeOption, number[]> = {
        10: [2.5, 5, 7.5, 10],
        25: [5, 10, 15, 20, 25],
        50: [10, 25, 50],
        100: [25, 50, 75, 100],
      };

      ctx.strokeStyle = '#D1CDC0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const rings = ringIntervals[rangeNm];
      for (const ringNm of rings) {
        const rPx = ringNm * pxPerNm;
        if (rPx <= scopeRadius) {
          ctx.beginPath();
          ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
          ctx.stroke();

          // Ring distance label
          ctx.font = '9px monospace';
          ctx.fillStyle = '#777777';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${ringNm}NM`, cx + rPx + 4, cy - 2);
        }
      }
      ctx.setLineDash([]); // Reset line dash

      // 3. Radial Spokes every 30°
      ctx.strokeStyle = '#E2DDD0';
      ctx.lineWidth = 0.75;
      for (let deg = 0; deg < 360; deg += 30) {
        const rad = (deg - 90) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + scopeRadius * Math.cos(rad), cy + scopeRadius * Math.sin(rad));
        ctx.stroke();
      }

      // Center Airport Reference Point (ARP) Crosshair
      ctx.strokeStyle = '#E11D48';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#E11D48';
      ctx.textAlign = 'center';
      ctx.fillText(airport.iata || airport.icao, cx, cy + 14);

      // 4. Rotating Sweep Line Animation
      if (!isReducedMotion) {
        const nextSweep = (sweepAngle + 1.2) % 360;
        setSweepAngle(nextSweep);

        const sweepRad = (nextSweep - 90) * (Math.PI / 180);
        const sweepGradient = ctx.createConicGradient(sweepRad, cx, cy);
        sweepGradient.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
        sweepGradient.addColorStop(0.1, 'rgba(16, 185, 129, 0.04)');
        sweepGradient.addColorStop(0.25, 'transparent');
        sweepGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = sweepGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, scopeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + scopeRadius * Math.cos(sweepRad), cy + scopeRadius * Math.sin(sweepRad));
        ctx.stroke();
      }

      // 5. Render Aircraft Blips
      const now = Date.now();
      const dtSec = Math.min((now - lastUpdateRef.current) / 1000, 10);

      visibleAircraft.forEach((ac) => {
        // Extrapolate position smoothly (dead reckoning)
        const speedKt = ac.groundSpeedKt || 0;
        const trackDeg = ac.trackDeg || 0;
        const extraDistNm = (speedKt * dtSec) / 3600;

        const radTrack = trackDeg * (Math.PI / 180);
        const radLat = airport.latitude * (Math.PI / 180);

        const extLat = ac.acLat + (extraDistNm * Math.cos(radTrack)) / 60;
        const extLon = ac.acLon + (extraDistNm * Math.sin(radTrack)) / (60 * Math.cos(radLat));

        const { distanceNm, bearingDeg } = calculateDistanceAndBearing(
          airport.latitude,
          airport.longitude,
          extLat,
          extLon
        );

        if (distanceNm > rangeNm) return;

        const blipRadius = distanceNm * pxPerNm;
        const blipRad = (bearingDeg - 90) * (Math.PI / 180);
        const bx = cx + blipRadius * Math.cos(blipRad);
        const by = cy + blipRadius * Math.sin(blipRad);

        const isSelected = ac.id === selectedIcao || ac.callsign === selectedIcao;
        const isHovered = ac.id === hoveredIcao || ac.callsign === hoveredIcao;
        const isEmergency = ac.squawk === '7700' || ac.squawk === '7600' || ac.squawk === '7500';

        // Blip style
        const blipColor = isEmergency
          ? '#DC2626'
          : isSelected
          ? '#2563EB'
          : isHovered
          ? '#059669'
          : '#111111';

        // Heading Vector Line
        const vectorLen = Math.max(12, Math.min(speedKt / 20, 28));
        const headRad = (trackDeg - 90) * (Math.PI / 180);
        const vx = bx + vectorLen * Math.cos(headRad);
        const vy = by + vectorLen * Math.sin(headRad);

        ctx.strokeStyle = blipColor;
        ctx.lineWidth = isSelected || isHovered ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(vx, vy);
        ctx.stroke();

        // Blip Dot
        ctx.fillStyle = blipColor;
        ctx.beginPath();
        ctx.arc(bx, by, isSelected || isHovered ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Selection Pulse Ring
        if (isSelected || isHovered) {
          ctx.strokeStyle = blipColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 6. Data Tag Block (Callsign, Alt, Speed, Squawk)
        if (showTags || isSelected || isHovered) {
          const tagX = bx + 8;
          const tagY = by - 8;

          const altStr =
            ac.altitudeFt >= 18000
              ? `FL${Math.round(ac.altitudeFt / 100)}`
              : `${Math.round(ac.altitudeFt / 100).toString().padStart(3, '0')}`;
          const spdStr = `${Math.round(ac.groundSpeedKt)}K`;

          ctx.font = '600 10px monospace';
          ctx.fillStyle = isSelected ? '#2563EB' : '#111111';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          ctx.fillText(ac.callsign || ac.id, tagX, tagY);

          ctx.font = '400 9px monospace';
          ctx.fillStyle = '#555555';
          ctx.fillText(`${altStr} ${spdStr}`, tagX, tagY + 11);
        }
      });

      ctx.restore();

      if (!isReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [
    viewMode,
    rangeNm,
    visibleAircraft,
    airport,
    selectedIcao,
    hoveredIcao,
    showTags,
    sweepAngle,
    isReducedMotion,
  ]);

  // Click / Hover Hit Test on Canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const scopeRadius = Math.min(cx, cy) - 36;
    const pxPerNm = scopeRadius / rangeNm;

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: string | null = null;

    for (const ac of visibleAircraft) {
      const blipRadius = ac.distanceNm * pxPerNm;
      const blipRad = (ac.bearingDeg - 90) * (Math.PI / 180);
      const bx = cx + blipRadius * Math.cos(blipRad);
      const by = cy + blipRadius * Math.sin(blipRad);

      const dist = Math.hypot(mx - bx, my - by);
      if (dist <= 12) {
        found = ac.id || ac.callsign;
        break;
      }
    }

    setHoveredIcao(found);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const scopeRadius = Math.min(cx, cy) - 36;
    const pxPerNm = scopeRadius / rangeNm;

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: string | null = null;

    for (const ac of visibleAircraft) {
      const blipRadius = ac.distanceNm * pxPerNm;
      const blipRad = (ac.bearingDeg - 90) * (Math.PI / 180);
      const bx = cx + blipRadius * Math.cos(blipRad);
      const by = cy + blipRadius * Math.sin(blipRad);

      const dist = Math.hypot(mx - bx, my - by);
      if (dist <= 14) {
        found = ac.id || ac.callsign;
        break;
      }
    }

    setSelectedIcao((prev) => (prev === found ? null : found));
  };

  return (
    <div className={`bg-[var(--surface)] border border-[var(--line-strong)] rounded-[var(--r-md)] overflow-hidden shadow-sm ${className}`}>
      {/* Scope Toolbar */}
      <div className="p-3 sm:p-4 border-b border-[var(--line)] bg-[var(--paper)] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Aerodrome Identifier & Live Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--ink)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--signal)] animate-pulse" />
            <span>TMA RADAR SCOPE</span>
            <span className="text-[var(--ink-3)] font-normal">({airport.icao})</span>
          </div>
          <Chip variant="neutral" dot>
            {visibleAircraft.length} TARGETS IN RANGE
          </Chip>
        </div>

        {/* Right Controls: Range Selector, Tag Toggle, View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range Selector */}
          <div className="flex items-center bg-[var(--paper-2)] p-0.5 rounded border border-[var(--line)] text-xs font-mono">
            {( [10, 25, 50, 100] as RangeOption[]).map((r) => (
              <button
                key={r}
                onClick={() => setRangeNm(r)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  rangeNm === r
                    ? 'bg-[var(--ink)] text-[var(--paper)] font-bold'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {r}NM
              </button>
            ))}
          </div>

          {/* Tags Toggle (Canvas mode only) */}
          {viewMode === 'canvas' && (
            <button
              onClick={() => setShowTags((v) => !v)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors flex items-center gap-1 ${
                showTags
                  ? 'bg-[var(--paper-2)] border-[var(--line-strong)] text-[var(--ink)]'
                  : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-3)]'
              }`}
              title="Toggle Aircraft Altitude/Speed Data Tags"
            >
              <Icon name="tag" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TAGS</span>
            </button>
          )}

          {/* View Mode Switcher (Canvas vs Accessible Table) */}
          <div className="flex items-center bg-[var(--paper-2)] p-0.5 rounded border border-[var(--line)] text-xs font-mono">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'canvas'
                  ? 'bg-[var(--ink)] text-[var(--paper)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
              aria-label="Canvas Scope View"
            >
              <Icon name="radar" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SCOPE</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-[var(--ink)] text-[var(--paper)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
              aria-label="Accessible Traffic Table View"
            >
              <Icon name="table" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TABLE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      {viewMode === 'canvas' ? (
        <div className="relative w-full aspect-square max-h-[580px] bg-[#F6F4EE] flex items-center justify-center select-none">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 text-xs font-mono text-[var(--ink-3)]">
              <div className="w-6 h-6 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
              <span>Acquiring Terminal Radar Telemetry…</span>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
              className="w-full h-full cursor-crosshair block"
            />
          )}

          {/* Selected Aircraft Floating Details Card */}
          {selectedAircraft && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-[var(--paper)]/95 backdrop-blur border border-[var(--line-strong)] rounded-[var(--r-md)] p-3 shadow-lg font-mono text-xs text-[var(--ink)] space-y-2 z-10">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--signal)]">
                    {selectedAircraft.callsign || selectedAircraft.id}
                  </span>
                  <span className="text-[10px] text-[var(--ink-3)]">
                    ({selectedAircraft.typeCode || 'AIRCRAFT'})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedIcao(null)}
                  className="text-[var(--ink-3)] hover:text-[var(--ink)] p-0.5 rounded"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[10px] text-[var(--ink-3)] block">ALTITUDE</span>
                  <span className="font-bold">{selectedAircraft.altitudeFt.toLocaleString()} FT</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink-3)] block">GROUND SPEED</span>
                  <span className="font-bold">{selectedAircraft.groundSpeedKt} KT</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink-3)] block">BEARING / DIST</span>
                  <span className="font-bold">
                    {Math.round(selectedAircraft.bearingDeg).toString().padStart(3, '0')}° / {selectedAircraft.distanceNm.toFixed(1)} NM
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink-3)] block">TRANSPONDER</span>
                  <span className="font-bold">{selectedAircraft.squawk || 'STD (1200)'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Traffic Table View */
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse" aria-label="Live Airport Traffic Table">
            <thead>
              <tr className="border-b border-[var(--line-strong)] text-[10px] uppercase text-[var(--ink-3)]">
                <th className="py-2 px-3">Callsign</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3 text-right">Altitude</th>
                <th className="py-2 px-3 text-right">Speed</th>
                <th className="py-2 px-3 text-right">Distance</th>
                <th className="py-2 px-3 text-right">Bearing</th>
                <th className="py-2 px-3">Squawk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {visibleAircraft.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--ink-3)]">
                    No active aircraft detected within {rangeNm} NM radius.
                  </td>
                </tr>
              ) : (
                visibleAircraft.map((ac) => (
                  <tr
                    key={ac.id}
                    onClick={() => setSelectedIcao(ac.id || ac.callsign)}
                    className={`hover:bg-[var(--paper-2)] cursor-pointer transition-colors ${
                      selectedIcao === (ac.id || ac.callsign) ? 'bg-[var(--paper-2)] font-bold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-[var(--ink)]">
                      {ac.callsign || ac.id}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--ink-2)]">
                      {ac.typeCode || 'UNK'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {ac.altitudeFt.toLocaleString()} FT
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {ac.groundSpeedKt} KT
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {ac.distanceNm.toFixed(1)} NM
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {Math.round(ac.bearingDeg).toString().padStart(3, '0')}°
                    </td>
                    <td className="py-2.5 px-3 text-[var(--ink-3)]">
                      {ac.squawk || '1200'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Scope Footer Stats & Reduced Motion Note */}
      <div className="p-3 border-t border-[var(--line)] bg-[var(--paper)] text-[10px] font-mono text-[var(--ink-3)] flex items-center justify-between">
        <span>TMA RADAR SCOPE · AERODROME LAT {airport.latitude.toFixed(3)}° LON {airport.longitude.toFixed(3)}°</span>
        {isReducedMotion && <span>PREFERS-REDUCED-MOTION: SWEEP PAUSED</span>}
      </div>
    </div>
  );
}
