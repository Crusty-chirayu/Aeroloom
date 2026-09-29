'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { AircraftPosition, PositionSample } from '@/lib/providers/positions/types';
import {
  formatAltitude,
  formatSpeed,
  formatVerticalRate,
  classifyAltitudeStrata,
  matchesFlightFilter,
} from '@/lib/map/aircraftGeoJson';
import { useUserStore } from '@/lib/storage/userStore';
import {
  Plane,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Crosshair,
  X,
  Radio,
  ChevronUp,
  ChevronDown,
  Layers,
  Copy,
  Check,
  Star,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ExternalLink,
  Route,
  Building2,
} from 'lucide-react';

interface HorizonDockProps {
  aircraftList: AircraftPosition[];
  selectedAircraft: AircraftPosition | null;
  selectedAircraftId: string | null;
  isFollowMode: boolean;
  selectedAircraftTrail?: PositionSample[];
  isReplayActive?: boolean;
  isReplayPlaying?: boolean;
  replayIndex?: number;
  replaySpeed?: number;
  onToggleFollow: () => void;
  onCenterFlight: () => void;
  onCloseDossier: () => void;
  onSelectAircraft: (id: string | null) => void;
  onStartReplay?: () => void;
  onToggleReplayPlay?: () => void;
  onSeekReplay?: (index: number) => void;
  onSetReplaySpeed?: (speed: number) => void;
  onStopReplay?: () => void;
  activeFilter: 'ALL' | 'CRUISE' | 'CLIMB' | 'GROUND' | 'EMERGENCY';
  onFilterChange: (filter: 'ALL' | 'CRUISE' | 'CLIMB' | 'GROUND' | 'EMERGENCY') => void;
}

export default function HorizonDock({
  aircraftList,
  selectedAircraft,
  selectedAircraftId,
  isFollowMode,
  selectedAircraftTrail = [],
  isReplayActive = false,
  isReplayPlaying = false,
  replayIndex = 0,
  replaySpeed = 1,
  onToggleFollow,
  onCenterFlight,
  onCloseDossier,
  onSelectAircraft,
  onStartReplay,
  onToggleReplayPlay,
  onSeekReplay,
  onSetReplaySpeed,
  onStopReplay,
  activeFilter,
  onFilterChange,
}: HorizonDockProps) {
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { isFlightSaved, toggleSaveFlight } = useUserStore();

  const isSaved = selectedAircraft ? isFlightSaved(selectedAircraft.id) : false;

  // Calculate sector altitude distribution
  const total = aircraftList.length;
  let stratosphereCount = 0;
  let cruiseCount = 0;
  let terminalCount = 0;
  let groundCount = 0;
  let emergencyCount = 0;

  for (const ac of aircraftList) {
    const s = classifyAltitudeStrata(ac.altitude, ac.isGround);
    if (s === 'stratosphere') stratosphereCount++;
    else if (s === 'cruise') cruiseCount++;
    else if (s === 'terminal') terminalCount++;
    else if (s === 'ground') groundCount++;

    if (ac.squawk === '7700' || ac.squawk === '7600' || ac.squawk === '7500') {
      emergencyCount++;
    }
  }

  // Filtered aircraft for drawer list using the identical strata filter engine
  const filteredList = aircraftList.filter((ac) => matchesFlightFilter(ac, activeFilter));

  const handleCopyTelemetry = async () => {
    if (!selectedAircraft) return;
    const data = {
      callsign: selectedAircraft.callsign,
      hex: selectedAircraft.id,
      aircraftType: selectedAircraft.aircraftType,
      registration: selectedAircraft.registration,
      altitude: selectedAircraft.altitude,
      speed: selectedAircraft.speed,
      heading: selectedAircraft.heading,
      verticalRate: selectedAircraft.verticalRate,
      squawk: selectedAircraft.squawk,
      lat: selectedAircraft.latitude,
      lon: selectedAircraft.longitude,
      source: selectedAircraft.source,
      timestamp: selectedAircraft.timestamp,
    };
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = JSON.stringify(data, null, 2);
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      setHasCopied(false);
    }
  };

  return (
    <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center pointer-events-none select-none">
      {/* 1. Expandable Flight List Drawer (If Opened) */}
      {isListExpanded && (
        <div className="w-full max-w-4xl max-h-72 bg-[#080d1a]/95 border-t border-x border-[#1f293d] rounded-t-2xl shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col font-mono text-xs overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
          <div className="px-4 py-2.5 bg-[#0f172a]/90 border-b border-[#1f293d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white tracking-wider">
                AIRSPACE FLIGHT FEED ({filteredList.length})
              </span>
            </div>
            <button
              onClick={() => setIsListExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40">
            {filteredList.map((ac) => {
              const isSelected = ac.id === selectedAircraftId;
              const altDisplay = formatAltitude(ac.altitude, ac.isGround);
              const spdDisplay = formatSpeed(ac.speed);
              return (
                <button
                  key={ac.id}
                  onClick={() => {
                    onSelectAircraft(ac.id);
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-200'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white w-20">
                      {ac.callsign || ac.id.toUpperCase()}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {ac.aircraftType || 'GEN'}
                    </span>
                    <span className="text-sky-300 w-16">{altDisplay}</span>
                    <span className="text-slate-400 w-16">{spdDisplay}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    HDG: {Math.round(ac.heading || 0)}°
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Selected Target Flight Dossier Stage (When Flight Is Selected) */}
      {selectedAircraft && (
        <div className="w-full max-w-4xl bg-[#080d1a]/95 border-t border-x border-[#1f293d] rounded-t-2xl shadow-[0_-10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-auto p-4 font-mono text-slate-200 animate-in slide-in-from-bottom-8 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Plane className="w-4 h-4 -rotate-45" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-white tracking-wider">
                    {selectedAircraft.callsign || selectedAircraft.id.toUpperCase()}
                  </span>
                  {selectedAircraft.registration && (
                    <span className="text-xs text-slate-400">({selectedAircraft.registration})</span>
                  )}
                  {selectedAircraft.airline && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/70 border border-sky-700/60 text-sky-300 font-semibold flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {selectedAircraft.airline.name}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedAircraft.aircraftDetails
                      ? `${selectedAircraft.aircraftDetails.manufacturer} ${selectedAircraft.aircraftDetails.model}`
                      : selectedAircraft.aircraftType || 'GENERIC'}
                  </span>
                  {selectedAircraft.squawk && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                        selectedAircraft.squawk === '7700' || selectedAircraft.squawk === '7600'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                          : 'bg-[#0f172a] border-slate-700 text-slate-400'
                      }`}
                    >
                      SQ {selectedAircraft.squawk}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleSaveFlight(selectedAircraft)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSaved
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-[#0f172a] border-[#1f293d] text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isSaved ? 'Remove from Saved Flights' : 'Save to Watchlist'}
              >
                <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
              <button
                onClick={onCloseDossier}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Dossier (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Authentic Route Corridor & Provenance Banner */}
          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-[#0b1222] border border-[#1f293d]/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            {selectedAircraft.route ? (
              <div className="flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold text-slate-200">
                  {selectedAircraft.route.origin.iata} ({selectedAircraft.route.origin.city})
                </span>
                <span className="text-sky-400">&rarr;</span>
                <span className="font-semibold text-slate-200">
                  {selectedAircraft.route.destination.iata} ({selectedAircraft.route.destination.city})
                </span>
                {selectedAircraft.route.distanceNm && (
                  <span className="text-[10px] text-slate-400">
                    &bull; {Math.round(selectedAircraft.route.distanceNm)} NM
                  </span>
                )}
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 uppercase font-mono">
                  Verified Route
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Route className="w-3.5 h-3.5 text-slate-500" />
                <span>Route unfiled &bull; Transponder-only telemetry</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <span>SRC:</span>
              <span className="text-slate-300 font-semibold">{selectedAircraft.source.toUpperCase()}</span>
            </div>
          </div>

          {/* Interactive Replay Scrubber (When Replay Is Active) */}
          {isReplayActive && (
            <div className="my-2 p-3 rounded-xl bg-sky-950/40 border border-sky-700/50 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-300 font-bold flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  REPLAY MODE &bull; SAMPLE {replayIndex + 1} OF {selectedAircraftTrail.length}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#080d1a] border border-sky-800/60 rounded-lg p-0.5 text-[10px]">
                    {[1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => onSetReplaySpeed?.(spd)}
                        className={`px-1.5 py-0.5 rounded ${
                          replaySpeed === spd
                            ? 'bg-sky-500 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onStopReplay}
                    className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 text-[10px] font-semibold"
                  >
                    EXIT REPLAY
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleReplayPlay}
                  className="w-7 h-7 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center transition-colors"
                >
                  {isReplayPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, selectedAircraftTrail.length - 1)}
                  value={replayIndex}
                  onChange={(e) => onSeekReplay?.(parseInt(e.target.value, 10))}
                  className="flex-1 accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-[#1f293d]/60">
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Altitude Profile</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-bold text-sky-300">
                  {formatAltitude(selectedAircraft.altitude, selectedAircraft.isGround)}
                </span>
                {selectedAircraft.verticalRate && selectedAircraft.verticalRate > 400 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                ) : selectedAircraft.verticalRate && selectedAircraft.verticalRate < -400 ? (
                  <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <span className="text-[9px] text-slate-400">
                {formatVerticalRate(selectedAircraft.verticalRate)}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">True Ground Speed</span>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {formatSpeed(selectedAircraft.speed)}
              </div>
              <span className="text-[9px] text-slate-400">KNOTS TRUE AIRSPEED</span>
            </div>

            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Heading / Bearing</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm font-bold text-slate-200">
                  {Math.round(selectedAircraft.heading || 0).toString().padStart(3, '0')}°
                </span>
              </div>
              <span className="text-[9px] text-slate-400">TRUE NORTH TRACK</span>
            </div>

            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">WGS84 Coordinates</span>
              <div className="text-xs font-semibold text-slate-200 mt-1">
                {Math.abs(selectedAircraft.latitude).toFixed(3)}°{selectedAircraft.latitude >= 0 ? 'N' : 'S'},{' '}
                {Math.abs(selectedAircraft.longitude).toFixed(3)}°{selectedAircraft.longitude >= 0 ? 'E' : 'W'}
              </div>
              <span className="text-[9px] text-slate-500">HEX: {selectedAircraft.id.toUpperCase()}</span>
            </div>
          </div>

          {/* Action Buttons & Honest Data Label */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onToggleFollow}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                  isFollowMode
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-[#0f172a] border-[#1f293d] text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <Crosshair className={`w-3.5 h-3.5 ${isFollowMode ? 'text-sky-300 animate-spin' : 'text-slate-400'}`} />
                <span>{isFollowMode ? 'CAMERA LOCKED' : 'FOLLOW FLIGHT'}</span>
              </button>

              <button
                onClick={onCenterFlight}
                className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-[#0f172a] border border-[#1f293d] text-slate-300 hover:text-white hover:border-sky-500/50 transition-all flex items-center gap-1.5"
                title="Pan camera to target"
              >
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                <span>CENTER</span>
              </button>

              {/* Replay Trigger (enabled when samples exist) */}
              {selectedAircraftTrail.length >= 2 && !isReplayActive && (
                <button
                  onClick={onStartReplay}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-sky-950/60 border border-sky-700/60 text-sky-300 hover:bg-sky-900/60 hover:text-white transition-all flex items-center gap-1.5"
                  title="Replay flight breadcrumbs"
                >
                  <Play className="w-3 h-3 fill-current text-sky-400" />
                  <span>REPLAY ({selectedAircraftTrail.length} PTS)</span>
                </button>
              )}

              {/* Full Flight Dossier Route */}
              <Link
                href={`/flight/${selectedAircraft.id}`}
                className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-[#0f172a] border border-sky-900/60 text-sky-300 hover:bg-sky-500/20 hover:text-white transition-all flex items-center gap-1.5"
                title="Open comprehensive telemetry and route analysis dossier"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span>FULL DOSSIER</span>
              </Link>

              <button
                onClick={handleCopyTelemetry}
                className="py-1.5 px-2.5 rounded-xl text-xs bg-[#0f172a] border border-[#1f293d] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                title="Copy telemetry JSON"
              >
                {hasCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="text-[10px]">{hasCopied ? 'COPIED' : 'JSON'}</span>
              </button>
            </div>

            <span className="text-[9px] text-slate-500 hidden sm:inline">
              Real-time ADS-B transponder telemetry &bull; {selectedAircraftTrail.length} breadcrumb observations stored
            </span>
          </div>
        </div>
      )}

      {/* 3. Primary Horizon Telemetry Dock Bar (Always Present Along Bottom) */}
      <div className="w-full max-w-4xl bg-[#080d1a]/90 border-t border-x border-[#1f293d] sm:rounded-t-2xl px-4 py-2.5 backdrop-blur-xl shadow-2xl pointer-events-auto flex items-center justify-between gap-3 font-mono text-xs">
        {/* Sector Summary & Expand Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsListExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-semibold transition-colors"
          >
            <span>{total} IN AIRSPACE</span>
            {isListExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Altitude Distribution Sparkline Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
            <span title="High Stratosphere (>= 28k ft)">
              STRATO: <strong className="text-indigo-300">{stratosphereCount}</strong>
            </span>
            <span>&bull;</span>
            <span title="Cruising (18k - 28k ft)">
              CRUISE: <strong className="text-emerald-400">{cruiseCount}</strong>
            </span>
            <span>&bull;</span>
            <span title="Terminal / Approach (< 18k ft)">
              TERM: <strong className="text-sky-300">{terminalCount}</strong>
            </span>
            {groundCount > 0 && (
              <>
                <span>&bull;</span>
                <span title="Ground taxi">
                  GND: <strong className="text-slate-500">{groundCount}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          {(['ALL', 'CRUISE', 'CLIMB', 'GROUND'] as const).map((filterKey) => {
            const isActive = activeFilter === filterKey;
            return (
              <button
                key={filterKey}
                onClick={() => onFilterChange(filterKey)}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {filterKey}
              </button>
            );
          })}
          {emergencyCount > 0 && (
            <button
              onClick={() => onFilterChange('EMERGENCY')}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                activeFilter === 'EMERGENCY'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500'
                  : 'text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              EMG ({emergencyCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
