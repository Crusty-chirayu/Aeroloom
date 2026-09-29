'use client';

import React, { useState, useEffect } from 'react';
import { Plane, Radio, ChevronDown, Search, Orbit, Layers } from 'lucide-react';
import { AVIATION_SECTORS, type AviationSector } from '@/lib/map/config';

interface ObservatoryHeaderProps {
  activeSector: AviationSector;
  onSelectSector: (sector: AviationSector) => void;
  onOpenSearch: () => void;
  onReturnToOrbit: () => void;
  onToggleBasemap?: () => void;
  activeBasemapName?: string;
  trackedCount?: number;
  isRefreshing?: boolean;
  isStale?: boolean;
}

export default function ObservatoryHeader({
  activeSector,
  onSelectSector,
  onOpenSearch,
  onReturnToOrbit,
  onToggleBasemap,
  activeBasemapName = 'CARTO Dark Matter',
  trackedCount = 0,
  isRefreshing = false,
  isStale = false,
}: ObservatoryHeaderProps) {
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [utcTime, setUtcTime] = useState<string>('');

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
    <header className="absolute top-3 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-6 pointer-events-none select-none">
      {/* Brand & Orbit Portal Button */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onReturnToOrbit}
          title="Return to 3D Orbit Landing Portal"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-white transition-all shadow-xl group"
        >
          <div className="w-5 h-5 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:rotate-45 transition-transform">
            <Orbit className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-widest text-xs sm:text-sm font-mono text-slate-100">
            AEROLOOM
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25 hidden sm:inline">
            OBSERVATORY
          </span>
        </button>
      </div>

      {/* Floating Center Capsule: Sector Selector & Omnisearch */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Airspace Sector Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsSectorOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-xs font-mono text-slate-200 transition-all shadow-xl"
          >
            <span className="text-slate-500 hidden md:inline">SECTOR:</span>
            <span className="text-sky-300 font-semibold">{activeSector.label}</span>
            <span className="text-[10px] text-slate-400">({activeSector.iata})</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                isSectorOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isSectorOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSectorOpen(false)}
              />
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl bg-[#0f172a]/95 border border-[#1f293d] shadow-2xl p-1.5 z-50 font-mono backdrop-blur-xl">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-[#1f293d]/50 mb-1">
                  Airspace Presets
                </div>
                {AVIATION_SECTORS.map((sector) => {
                  const isSelected = sector.id === activeSector.id;
                  return (
                    <button
                      key={sector.id}
                      onClick={() => {
                        onSelectSector(sector);
                        setIsSectorOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{sector.label}</div>
                        <div className="text-[10px] text-slate-500">{sector.description}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#080d1a] text-slate-400 border border-[#1f293d]">
                        {sector.iata}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Global Omnisearch Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/60 backdrop-blur-md text-xs font-mono text-slate-300 hover:text-white transition-all shadow-xl group"
          title="Search live flights or jump to coordinates (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-slate-400">Search Flight / Callsign...</span>
          <kbd className="hidden lg:inline text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Telemetry Pulse & Basemap Selector */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {onToggleBasemap && (
          <button
            onClick={onToggleBasemap}
            title={`Active: ${activeBasemapName}. Toggle Basemap`}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-[11px] font-mono text-slate-300 hover:text-white transition-all shadow-xl"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] truncate max-w-[100px]">{activeBasemapName.split(' ')[0]}</span>
          </button>
        )}

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-colors shadow-xl ${
            isStale
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-[#080d1a]/85 border-[#1f293d] text-slate-300'
          }`}
        >
          <Radio
            className={`w-3.5 h-3.5 ${
              isStale
                ? 'text-amber-400'
                : isRefreshing
                ? 'text-sky-400 animate-spin'
                : 'text-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] font-semibold hidden sm:inline">
            {isStale ? 'FEED STALE' : isRefreshing ? 'SYNCING...' : 'ADS-B LIVE'}
          </span>
          {trackedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              {trackedCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
