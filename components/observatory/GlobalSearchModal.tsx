'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plane, MapPin, X, ArrowUpRight, Compass } from 'lucide-react';
import type { AircraftPosition } from '@/lib/providers/positions/types';
import { AVIATION_SECTORS, type AviationSector } from '@/lib/map/config';
import { formatAltitude, formatSpeed } from '@/lib/map/aircraftGeoJson';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  aircraftList: AircraftPosition[];
  onSelectAircraft: (id: string) => void;
  onSelectSector: (sector: AviationSector) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  aircraftList,
  onSelectAircraft,
  onSelectSector,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts (Escape, Arrows, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toUpperCase();

  // 1. Matching Aviation Sectors
  const matchingSectors = AVIATION_SECTORS.filter(
    (s) =>
      s.label.toUpperCase().includes(trimmed) ||
      s.iata.toUpperCase().includes(trimmed) ||
      s.id.toUpperCase().includes(trimmed)
  );

  // 2. Matching Live ADS-B Aircraft
  const matchingAircraft = aircraftList
    .filter((ac) => {
      if (!trimmed) return true;
      const callsign = (ac.callsign || '').toUpperCase();
      const hex = (ac.id || '').toUpperCase();
      const type = (ac.aircraftType || '').toUpperCase();
      const reg = (ac.registration || '').toUpperCase();
      return (
        callsign.includes(trimmed) ||
        hex.includes(trimmed) ||
        type.includes(trimmed) ||
        reg.includes(trimmed)
      );
    })
    .slice(0, 15); // Cap to top 15 results for performance

  const totalResultsCount = matchingSectors.length + matchingAircraft.length;

  const handleSelectSectorItem = (sector: AviationSector) => {
    onSelectSector(sector);
    onClose();
  };

  const handleSelectAircraftItem = (id: string) => {
    onSelectAircraft(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      />

      <div className="w-full max-w-xl rounded-2xl bg-[#080d1a]/95 border border-[#1f293d] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-mono text-slate-200">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[#1f293d] px-4 py-3 bg-[#0f172a]/90">
          <Search className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search live callsign, hex, type, or sector (e.g. DAL, B738, JFK)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-1 text-sm bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {/* Airspace Sectors Section */}
          {matchingSectors.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-sky-400" />
                <span>Airspace Sectors</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchingSectors.map((sector) => (
                  <button
                    key={sector.id}
                    onClick={() => handleSelectSectorItem(sector)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#151d2c] flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <span className="font-semibold text-sky-300 group-hover:text-white">
                        {sector.label}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {sector.iata} &bull; {sector.description}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25">
                      JUMP TO SECTOR &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live ADS-B Aircraft Section */}
          <div>
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Plane className="w-3 h-3 text-emerald-400" />
                <span>Live Tracked Aircraft ({matchingAircraft.length})</span>
              </span>
              <span className="text-[9px] text-slate-600">SOURCE: REAL-TIME ADS-B</span>
            </div>

            {matchingAircraft.length > 0 ? (
              <div className="space-y-1 mt-1">
                {matchingAircraft.map((ac) => {
                  const altStr = formatAltitude(ac.altitude, ac.isGround);
                  const spdStr = formatSpeed(ac.speed);
                  return (
                    <button
                      key={ac.id}
                      onClick={() => handleSelectAircraftItem(ac.id)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#151d2c] flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#080d1a] border border-[#1f293d] flex items-center justify-center text-sky-400 group-hover:border-sky-500/50">
                          <Plane className="w-3.5 h-3.5 -rotate-45" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white tracking-wider group-hover:text-sky-300">
                              {ac.callsign || ac.id.toUpperCase()}
                            </span>
                            {ac.registration && (
                              <span className="text-[10px] text-slate-400">({ac.registration})</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {ac.aircraftType || 'GENERIC'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>HEX: <strong className="text-slate-300">{ac.id.toUpperCase()}</strong></span>
                            <span>&bull;</span>
                            <span>ALT: <strong className="text-sky-300">{altStr}</strong></span>
                            <span>&bull;</span>
                            <span>SPD: <strong className="text-slate-200">{spdStr}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-mono block">
                          HDG: {Math.round(ac.heading || 0)}°
                        </span>
                        <span className="text-[10px] text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          LOCATE &rarr;
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                No active aircraft in current radar sector matching &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Data Provenance & Honesty Footer */}
        <div className="px-4 py-2 bg-[#050810] border-t border-[#1f293d] text-[10px] text-slate-500 flex items-center justify-between">
          <span>Real-time transponder data only. Flight schedules & archival routes connect in Phase 2.</span>
          <span className="text-slate-600 hidden sm:inline">Press Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
