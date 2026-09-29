'use client';

import React from 'react';
import { Plane, Radio, Compass, ChevronRight } from 'lucide-react';
import { AVIATION_SECTORS, type AviationSector } from '@/lib/map/config';

interface LandingOverlayProps {
  onEnterAirspace: (sector?: AviationSector) => void;
  isDiving: boolean;
  totalTracked?: number;
}

export default function LandingOverlay({
  onEnterAirspace,
  isDiving,
  totalTracked = 0,
}: LandingOverlayProps) {
  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 pointer-events-none transition-all duration-700 ${
        isDiving ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#080d1a]/80 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-widest text-base sm:text-lg text-white font-mono">
                AEROLOOM
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                OBSERVATORY
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              PLANETARY FLIGHT TELEMETRY &bull; REAL-TIME ADS-B VECTORS
            </p>
          </div>
        </div>

        {/* Live Signal Pulse */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#080d1a]/80 border border-slate-800 text-xs font-mono text-slate-300 backdrop-blur-md">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-semibold">ADS-B LIVE</span>
          {totalTracked > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {totalTracked} ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Center Hero Identity & Launch Trigger */}
      <div className="max-w-xl mx-auto text-center space-y-6 pointer-events-auto my-auto py-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs font-mono">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>REAL-TIME SPATIAL FLIGHT OBSERVATORY</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-sans drop-shadow-md">
            Observe the Skies in <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300">Real Time</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-sans leading-relaxed">
            Live ADS-B transponder telemetry woven into high-performance 2D vector cartography. Move your cursor to interact with the terrain grid.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onEnterAirspace()}
            className="group px-7 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(14,165,233,0.4)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>ENTER LIVE AIRSPACE</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Sector Quick-Launch Capsules Bar */}
      <div className="w-full max-w-4xl mx-auto pointer-events-auto space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 text-center">
          Direct Airspace Jump
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
          {AVIATION_SECTORS.map((sector) => (
            <button
              key={sector.id}
              onClick={() => onEnterAirspace(sector)}
              className="p-2.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/60 hover:bg-[#0f172a] text-left transition-all group backdrop-blur-md shadow-lg"
            >
              <div className="text-slate-400 group-hover:text-sky-300 font-semibold text-[11px] truncate">
                {sector.label}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between mt-1">
                <span>{sector.iata}</span>
                <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
