'use client';

import React, { useState, useEffect } from 'react';
import { Plane, Radio, Clock, ChevronDown, Search } from 'lucide-react';
import { AVIATION_SECTORS, type AviationSector } from '@/lib/map/config';

interface HeaderProps {
  activeSector: AviationSector;
  onSelectSector: (sector: AviationSector) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  trackedCount?: number;
}

export default function Header({
  activeSector,
  onSelectSector,
  searchQuery,
  onSearchChange,
  trackedCount = 0,
}: HeaderProps) {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);

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
    <header className="w-full bg-[#0f141f] border-b border-[#1f293d] px-3 sm:px-5 py-2.5 z-30 select-none">
      <div className="flex items-center justify-between gap-3">
        {/* Brand & Mode Identification */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#080b11] border border-[#1f293d] flex items-center justify-center text-sky-400 shadow-sm">
            <Plane className="w-4 h-4 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-sm sm:text-base text-white">
                AEROLOOM
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25 font-semibold">
                TACTICAL STUDIO
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              PRECISION AVIATION TELEMETRY &bull; MAPLIBRE VECTOR ENGINE
            </p>
          </div>
        </div>

        {/* Airspace Sector Quick-Selector */}
        <div className="relative">
          <button
            onClick={() => setIsSectorDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#080b11] border border-[#1f293d] hover:border-sky-500/50 text-xs font-mono text-slate-200 transition-all"
          >
            <span className="text-slate-500 hidden md:inline">SECTOR:</span>
            <span className="text-sky-300 font-semibold">{activeSector.label}</span>
            <span className="text-[10px] text-slate-400">({activeSector.iata})</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSectorDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSectorDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSectorDropdownOpen(false)}
              />
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 rounded-xl bg-[#0f141f] border border-[#1f293d] shadow-2xl p-1.5 z-50 font-mono">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-[#1f293d]/50 mb-1">
                  Airspace Sectors
                </div>
                {AVIATION_SECTORS.map((sector) => {
                  const isSelected = sector.id === activeSector.id;
                  return (
                    <button
                      key={sector.id}
                      onClick={() => {
                        onSelectSector(sector);
                        setIsSectorDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'text-slate-300 hover:bg-[#151d2c] hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{sector.label}</div>
                        <div className="text-[10px] text-slate-500">{sector.description}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#080b11] text-slate-400 border border-[#1f293d]">
                        {sector.iata}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Callsign Quick Search Bar */}
        <div className="hidden lg:block w-64">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter callsign / hex..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#080b11] border border-[#1f293d] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/40 transition-all font-mono"
            />
          </div>
        </div>

        {/* Telemetry Status Badges */}
        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs">
          {/* ADS-B Live Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080b11] border border-[#1f293d] text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] hidden sm:inline text-emerald-400 font-semibold">ADS-B LIVE</span>
            {trackedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                {trackedCount}
              </span>
            )}
          </div>

          {/* UTC Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-200 text-xs tracking-wider">
              {utcTime || '00:00:00 UTC'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
