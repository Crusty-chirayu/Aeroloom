'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { AircraftState } from '@/lib/providers/types';
import type { PositionSample } from '@/lib/providers/positions/types';
import { mapTypeCodeToCategory } from '@/lib/map/typeMapping';
import { AircraftBlueprint } from '@/components/aircraft/AircraftBlueprint';
import { FlightSparklines } from './FlightSparklines';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';

export interface FlightPanelProps {
  aircraft: AircraftState | null;
  trail: PositionSample[];
  isOpen: boolean;
  onClose: () => void;
  isFollowMode: boolean;
  onToggleFollow: () => void;
}

export function FlightPanel({
  aircraft,
  trail,
  isOpen,
  onClose,
  isFollowMode,
  onToggleFollow,
}: FlightPanelProps) {
  // Mobile snap state: 'peek' | 'half' | 'full'
  const [mobileSnap, setMobileSnap] = useState<'peek' | 'half' | 'full'>('half');
  const [showBlueprint, setShowBlueprint] = useState<boolean>(false);

  if (!isOpen || !aircraft) return null;

  const category = mapTypeCodeToCategory(aircraft.typeCode);
  const isEmergency =
    aircraft.squawk === '7500' || aircraft.squawk === '7600' || aircraft.squawk === '7700';

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

  const verticalRateText =
    typeof aircraft.verticalRateFpm === 'number'
      ? `${aircraft.verticalRateFpm > 0 ? '+' : ''}${aircraft.verticalRateFpm.toLocaleString()} fpm`
      : 'Level';

  const verticalRateGlyph =
    typeof aircraft.verticalRateFpm === 'number'
      ? aircraft.verticalRateFpm > 150
        ? '↑'
        : aircraft.verticalRateFpm < -150
        ? '↓'
        : '→'
      : '';

  const headingText =
    typeof aircraft.trackDeg === 'number' ? `${Math.round(aircraft.trackDeg)}°` : '---';

  // Mobile height class
  const mobileHeightClass =
    mobileSnap === 'peek'
      ? 'h-[76px]'
      : mobileSnap === 'half'
      ? 'h-[48vh]'
      : 'h-[86vh]';

  return (
    <>
      {/* ─── DESKTOP SIDE PANEL (Right Rail, 420px) ─────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 right-0 bottom-0 w-[420px] bg-white border-l border-[var(--line)] shadow-2xl z-40 overflow-hidden select-text animate-in slide-in-from-right duration-200"
        aria-label="Flight telemetry dossier"
      >
        {/* Panel Header */}
        <div className="p-5 border-b border-[var(--line)] bg-[var(--paper)] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-3)]">
                HEX {aircraft.id.toUpperCase()}
              </span>
              <span className="text-[var(--line-strong)]">·</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-2)]">
                {aircraft.typeCode || 'TYPE UNKNOWN'}
              </span>
              {aircraft.onGround && (
                <Chip variant="neutral">
                  On Ground
                </Chip>
              )}
            </div>

            <h2 className="font-serif text-3xl font-medium tracking-tight text-[var(--ink)]">
              {aircraft.callsign || aircraft.id.toUpperCase()}
            </h2>

            {aircraft.registration && (
              <p className="font-mono text-xs text-[var(--ink-2)] mt-0.5">
                REG {aircraft.registration}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={isFollowMode ? 'signal' : 'ghost'}
              size="sm"
              icon="navigation"
              onClick={onToggleFollow}
              title={isFollowMode ? 'Disable camera follow' : 'Lock camera follow (F)'}
              aria-label={isFollowMode ? 'Disable camera follow' : 'Lock camera follow'}
            >
              {isFollowMode ? 'Following' : 'Follow'}
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-black/5 rounded-sm transition-colors"
              aria-label="Close flight details panel"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* Emergency Alert Banner */}
        {isEmergency && (
          <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700">
            <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span className="font-mono text-xs font-bold tracking-wider">
              EMERGENCY SQUAWK {aircraft.squawk} DETECTED
            </span>
          </div>
        )}

        {/* Panel Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Route Section */}
          <div className="p-4 rounded-sm bg-[var(--paper)] border border-[var(--line)]">
            <div className="flex items-center justify-between mb-3 text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--ink-3)] font-semibold">
              <span>Flight Routing</span>
              <span className="italic font-sans text-xs lowercase text-[var(--ink-3)] font-normal">ads-b transponder broadcast</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xl font-bold text-[var(--ink)] tracking-tight">---</span>
                <p className="text-[11px] font-mono text-[var(--ink-3)] mt-0.5">Origin Unresolved</p>
              </div>
              <div className="flex-1 px-4 flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-4)] mb-1">GREAT CIRCLE</span>
                <div className="w-full h-px bg-[var(--line-strong)] relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--paper)] px-1.5 flex items-center">
                    <span className="w-2 h-2 rounded-full border border-[var(--signal)] bg-white" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xl font-bold text-[var(--ink)] tracking-tight">---</span>
                <p className="text-[11px] font-mono text-[var(--ink-3)] mt-0.5">Destination Unresolved</p>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-[var(--ink-3)] italic border-t border-[var(--line)] pt-2 text-center">
              Origin and destination routing displayed only when filed in verified schedule indexes.
            </p>
          </div>

          {/* Telemetry Core 2x2 Matrix */}
          <div>
            <div className="mono-label text-[var(--ink-3)] mb-2.5">
              Live Telemetry Status
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Altitude Box */}
              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-sm">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--ink-3)]">
                  <span>Altitude</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--signal)]" />
                </div>
                <div className="font-mono text-xl font-bold text-[var(--ink)] mt-1">
                  {altitudeText}
                </div>
                <div className="text-[10px] font-mono text-[var(--ink-3)] mt-0.5">
                  {typeof aircraft.altitudeFt === 'number'
                    ? `${aircraft.altitudeFt.toLocaleString()} ft MSL`
                    : 'Barometric'}
                </div>
              </div>

              {/* Ground Speed Box */}
              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-sm">
                <div className="text-[10px] font-mono uppercase text-[var(--ink-3)]">
                  Ground Speed
                </div>
                <div className="font-mono text-xl font-bold text-[var(--ink)] mt-1">
                  {speedText}
                </div>
                <div className="text-[10px] font-mono text-[var(--ink-3)] mt-0.5">
                  {typeof aircraft.groundSpeedKt === 'number'
                    ? `${Math.round(aircraft.groundSpeedKt * 1.852)} km/h`
                    : 'Transponder'}
                </div>
              </div>

              {/* Vertical Rate Box */}
              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-sm">
                <div className="text-[10px] font-mono uppercase text-[var(--ink-3)]">
                  Vertical Rate
                </div>
                <div className="font-mono text-xl font-bold text-[var(--ink)] mt-1 flex items-center gap-1">
                  <span>{verticalRateGlyph}</span>
                  <span>{verticalRateText}</span>
                </div>
                <div className="text-[10px] font-mono text-[var(--ink-3)] mt-0.5">
                  Climb / Descent
                </div>
              </div>

              {/* Heading / Track Box */}
              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-sm">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--ink-3)]">
                  <span>Track Heading</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: `rotate(${aircraft.trackDeg || 0}deg)`,
                      transformOrigin: 'center',
                    }}
                  >
                    <polygon points="12 2 19 21 12 17 5 21 12 2" fill="var(--ink)" />
                  </svg>
                </div>
                <div className="font-mono text-xl font-bold text-[var(--ink)] mt-1">
                  {headingText}
                </div>
                <div className="text-[10px] font-mono text-[var(--ink-3)] mt-0.5">
                  Magnetic Heading
                </div>
              </div>
            </div>
          </div>

          {/* Hand-built SVG Sparklines */}
          <div>
            <div className="mono-label text-[var(--ink-3)] mb-1">
              Trajectory Dynamics
            </div>
            <FlightSparklines
              samples={trail}
              currentAltitude={aircraft.altitudeFt}
              currentSpeed={aircraft.groundSpeedKt}
            />
          </div>

          {/* Technical Blueprint Thumbnail & Drawer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="mono-label text-[var(--ink-3)]">
                  Airframe Specification
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-2)] rounded-xs uppercase">
                  {category.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setShowBlueprint((prev) => !prev)}
                className="text-xs font-mono font-medium text-[var(--signal)] hover:underline"
              >
                {showBlueprint ? 'Hide Blueprint' : 'Show Blueprint'}
              </button>
            </div>

            {showBlueprint && (
              <div className="mt-2 animate-in fade-in duration-200">
                <AircraftBlueprint
                  category={category}
                  specificModel={aircraft.typeCode}
                  className="scale-95 origin-top"
                />
              </div>
            )}
          </div>

          {/* Diagnostic Metadata Grid */}
          <div className="border-t border-[var(--line)] pt-4 text-xs font-mono space-y-1.5 text-[var(--ink-2)]">
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Squawk Code:</span>
              <span className="font-bold">{aircraft.squawk || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Coordinates:</span>
              <span>
                {aircraft.lat.toFixed(4)}°, {aircraft.lon.toFixed(4)}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Telemetry Engine:</span>
              <span>Dead-reckoned 60 fps</span>
            </div>
          </div>
        </div>

        {/* Panel Footer Action Bar */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--paper)] flex items-center gap-3">
          <Link href={`/flight/${aircraft.id}`} className="flex-1">
            <Button variant="signal" size="md" className="w-full" icon="arrow-right" iconPosition="right">
              Open Full Dossier
            </Button>
          </Link>
          <Button variant="outline" size="md" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </aside>

      {/* ─── MOBILE BOTTOM SHEET (3 Snap States) ─────────────────────────────── */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--line)] shadow-2xl z-40 rounded-t-xl transition-all duration-300 ease-out flex flex-col ${mobileHeightClass}`}
        aria-label="Flight bottom sheet"
      >
        {/* Drag Handle & Snap Controls */}
        <div
          className="pt-2 pb-1 cursor-pointer flex flex-col items-center select-none"
          onClick={() => {
            if (mobileSnap === 'peek') setMobileSnap('half');
            else if (mobileSnap === 'half') setMobileSnap('full');
            else setMobileSnap('peek');
          }}
        >
          <div className="w-10 h-1 bg-[var(--line-strong)] rounded-full mb-1" />
        </div>

        {/* Mobile Header Bar */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-[var(--ink)]">
              {aircraft.callsign || aircraft.id.toUpperCase()}
            </h2>
            <span className="font-mono text-xs text-[var(--ink-3)]">
              {aircraft.typeCode || 'TYPE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right font-mono text-xs">
              <span className="font-bold text-[var(--ink)]">{altitudeText}</span>
              <span className="text-[var(--ink-3)] ml-1.5">{speedText}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)]"
              aria-label="Close sheet"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Content (Visible on 'half' and 'full') */}
        {mobileSnap !== 'peek' && (
          <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-4">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-sm">
                <span className="text-[var(--ink-3)] text-[10px] block">VERTICAL RATE</span>
                <span className="font-bold text-sm text-[var(--ink)]">
                  {verticalRateGlyph} {verticalRateText}
                </span>
              </div>
              <div className="p-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-sm">
                <span className="text-[var(--ink-3)] text-[10px] block">TRACK</span>
                <span className="font-bold text-sm text-[var(--ink)]">{headingText}</span>
              </div>
            </div>

            {/* Sparklines */}
            <FlightSparklines
              samples={trail}
              currentAltitude={aircraft.altitudeFt}
              currentSpeed={aircraft.groundSpeedKt}
            />

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                variant={isFollowMode ? 'signal' : 'outline'}
                size="sm"
                className="flex-1"
                icon="navigation"
                onClick={onToggleFollow}
              >
                {isFollowMode ? 'Following' : 'Follow'}
              </Button>
              <Link href={`/flight/${aircraft.id}`} className="flex-1">
                <Button variant="signal" size="sm" className="w-full">
                  Full Dossier
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
