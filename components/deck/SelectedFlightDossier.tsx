'use client';

import React from 'react';
import type { AircraftPosition } from '@/lib/providers/positions/types';
import { formatAltitude, formatSpeed, formatVerticalRate } from '@/lib/map/aircraftGeoJson';
import { Plane, Compass, ArrowUpRight, ArrowDownRight, Minus, Crosshair, X, Radio } from 'lucide-react';

interface SelectedFlightDossierProps {
  aircraft: AircraftPosition | null;
  isFollowMode: boolean;
  onToggleFollow: () => void;
  onCenterFlight: () => void;
  onClose: () => void;
}

export default function SelectedFlightDossier({
  aircraft,
  isFollowMode,
  onToggleFollow,
  onCenterFlight,
  onClose,
}: SelectedFlightDossierProps) {
  if (!aircraft) return null;

  const altitudeDisplay = formatAltitude(aircraft.altitude, aircraft.isGround);
  const speedDisplay = formatSpeed(aircraft.speed);
  const verticalRateDisplay = formatVerticalRate(aircraft.verticalRate);
  const heading = Math.round(aircraft.heading || 0);

  const isEmergency = aircraft.squawk === '7700' || aircraft.squawk === '7600';
  const isClimbing = aircraft.verticalRate && aircraft.verticalRate > 400;
  const isDescending = aircraft.verticalRate && aircraft.verticalRate < -400;

  return (
    <div className="absolute top-3 left-3 sm:left-5 z-20 w-80 sm:w-88 rounded-xl bg-[#0f141f]/95 border border-[#1f293d] shadow-2xl backdrop-blur-md overflow-hidden select-none animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Dossier Header Bar */}
      <div className="bg-[#080b11]/90 px-3.5 py-2.5 border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Plane className="w-3.5 h-3.5 -rotate-45" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              TACTICAL TARGET DOSSIER
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-[#151d2c] transition-colors"
          title="Dismiss dossier (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Identity Strip */}
      <div className="p-3.5 flex flex-col gap-3 font-mono">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tracking-wider">
                {aircraft.callsign || aircraft.id.toUpperCase()}
              </span>
              {aircraft.registration && (
                <span className="text-xs text-slate-400">({aircraft.registration})</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>TYPE: <strong className="text-slate-200">{aircraft.aircraftType || 'GENERIC'}</strong></span>
              <span>&bull;</span>
              <span>HEX: <strong className="text-slate-200">{aircraft.id.toUpperCase()}</strong></span>
            </div>
          </div>

          {/* Squawk Status Badge */}
          <div
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isEmergency
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-[#080b11] border-[#1f293d] text-slate-300'
            }`}
          >
            SQ {aircraft.squawk || '----'}
          </div>
        </div>

        {/* Telemetry Tape Grid */}
        <div className="grid grid-cols-2 gap-2 bg-[#080b11]/80 p-2.5 rounded-lg border border-[#1f293d]/80 text-xs">
          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Altitude</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-sky-300">{altitudeDisplay}</span>
              {isClimbing ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              ) : isDescending ? (
                <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <span className="text-[9px] text-slate-500">{verticalRateDisplay}</span>
          </div>

          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Ground Speed</span>
            <div className="text-sm font-bold text-slate-100 mt-0.5">{speedDisplay}</div>
            <span className="text-[9px] text-slate-500">KNOTS TRUE</span>
          </div>

          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Track / Heading</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-bold text-slate-200">
                {heading.toString().padStart(3, '0')}°
              </span>
            </div>
          </div>

          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Coordinates</span>
            <div className="text-[10px] text-slate-300 font-semibold mt-1">
              {Math.abs(aircraft.latitude).toFixed(3)}°{aircraft.latitude >= 0 ? 'N' : 'S'},{' '}
              {Math.abs(aircraft.longitude).toFixed(3)}°{aircraft.longitude >= 0 ? 'E' : 'W'}
            </div>
          </div>
        </div>

        {/* Action Controls: Follow Camera & Center */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onToggleFollow}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
              isFollowMode
                ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                : 'bg-[#080b11] border-[#1f293d] text-slate-300 hover:text-white hover:border-slate-600'
            }`}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isFollowMode ? 'text-sky-300 animate-spin' : 'text-slate-400'}`} />
            <span>{isFollowMode ? 'CAMERA LOCKED' : 'FOLLOW FLIGHT'}</span>
          </button>

          <button
            onClick={onCenterFlight}
            className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#080b11] border border-[#1f293d] text-slate-300 hover:text-white hover:border-sky-500/50 transition-all flex items-center gap-1.5"
            title="Pan camera to target coordinates"
          >
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span>CENTER</span>
          </button>
        </div>
      </div>
    </div>
  );
}
