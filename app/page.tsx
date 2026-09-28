'use client';

import React, { useState, useEffect } from 'react';
import Terrain from '@/components/hero/Terrain';
import LiveAircraftPing from '@/components/hero/LiveAircraftPing';
import type { AircraftPosition } from '@/lib/providers/positions/types';
import { Search, Radio, Compass, Plane, ShieldCheck, Activity } from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [utcTime, setUtcTime] = useState<string>('');
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftPosition | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Telemetry Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Plane className="w-4 h-4 text-slate-950 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-base bg-gradient-to-r from-white via-slate-200 to-sky-300 bg-clip-text text-transparent">
                  AEROLOOM
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold">
                  PHASE 0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">
                SIGNATURE SLICE TELEMETRY
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>RADAR GRID ACTIVE</span>
            </div>
            <div className="text-slate-400 tracking-wider">
              {utcTime || '00:00:00 UTC'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero & 3D Radar Surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Hero Headline & Functional Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-mono mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Real-Time Atmospheric Surface & Flight Vector Ping
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Planetary Radar Grid & Live Telemetry
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Interact with the GPU GLSL-displacement terrain below. Live aircraft coordinates from airplanes.live are projected directly into the 3D space.
            </p>
          </div>

          {/* Persistent Search Bar (USABLE EVEN ON CONTEXT LOSS / STATIC FALLBACK) */}
          <div className="w-full md:w-80">
            <label htmlFor="flight-search" className="block text-[11px] font-mono text-slate-400 mb-1.5">
              SEARCH ACTIVE CALLSIGN
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="flight-search"
                type="text"
                placeholder="e.g. SWA, DAL, UAL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3D Scene Container with Terrain and Live Aircraft Ping */}
        <section className="relative w-full">
          <Terrain>
            <LiveAircraftPing
              selectedCallsign={searchQuery}
              onAircraftSelect={setSelectedAircraft}
            />
          </Terrain>

          {/* Active Flight Detail Overlay Card */}
          {selectedAircraft && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{selectedAircraft.callsign}</span>
                    {selectedAircraft.registration && (
                      <span className="text-slate-400 text-[10px]">({selectedAircraft.registration})</span>
                    )}
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                      LIVE TRACKED
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Type: {selectedAircraft.aircraftType || 'Generic'} &bull; Hex: {selectedAircraft.id.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Altitude</span>
                  <span className="text-sky-300 font-semibold">
                    {selectedAircraft.isGround ? 'GROUND' : `${selectedAircraft.altitude.toLocaleString()} FT`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Ground Speed</span>
                  <span className="text-slate-200 font-semibold">{selectedAircraft.speed.toFixed(0)} KTS</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Heading</span>
                  <span className="text-slate-200 font-semibold">{selectedAircraft.heading.toFixed(0)}&deg;</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Coordinates</span>
                  <span className="text-slate-300 font-semibold">
                    {selectedAircraft.latitude.toFixed(4)}, {selectedAircraft.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Radar Telemetry Information Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase">Projection Space</div>
              <div className="text-sm font-semibold text-slate-200 mt-0.5">Cartesian Radar Normal</div>
              <p className="text-xs text-slate-400 mt-1">
                Geographic coordinates normalized onto decorative 3D radar grid.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase">Provider Status</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">airplanes.live ADS-B</div>
              <p className="text-xs text-slate-400 mt-1">
                Server-side bounding box telemetry ingest with zero credentials leaked.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase">Tier Enforcement</div>
              <div className="text-sm font-semibold text-indigo-300 mt-0.5">Hardware Adaptive</div>
              <p className="text-xs text-slate-400 mt-1">
                Full (9.6k pts + Bloom), Reduced (2.4k pts), Static fallback on context loss.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs font-mono text-slate-400">
        Aeroloom Flight Tracker &copy; 2026 &bull; Phase 0 Signature Slice &bull; Public ADS-B Data Courtesy of airplanes.live
      </footer>
    </div>
  );
}
