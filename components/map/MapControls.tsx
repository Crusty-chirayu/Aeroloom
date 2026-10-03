'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { AuthUserMenu } from '@/components/user/AuthUserMenu';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import type { AircraftCategory } from '@/lib/map/silhouettes/types';

export interface MapFilters {
  altitude: 'all' | 'low' | 'med' | 'high';
  category: 'all' | AircraftCategory;
  showGround: boolean;
}

export interface MapLayers {
  terminator: boolean;
  radar: boolean;
  airports: boolean;
  labels: 'normal' | 'dense' | 'sparse';
}

export interface MapControlsProps {
  totalCount: number;
  filteredCount: number;
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  layers: MapLayers;
  onLayerChange: (layers: MapLayers) => void;
  onOpenSearch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetBearing: () => void;
  onSelectSector: (sectorId: string) => void;
  isFollowMode: boolean;
  selectedCallsign?: string;
  onExitFollow: () => void;
  onTriggerAssistant?: (query?: string) => void;
}

export function MapControls({
  totalCount: _totalCount,
  filteredCount,
  filters,
  onFilterChange,
  layers,
  onLayerChange,
  onOpenSearch,
  onZoomIn,
  onZoomOut,
  onResetBearing,
  onSelectSector,
  isFollowMode,
  selectedCallsign,
  onExitFollow,
  onTriggerAssistant,
}: MapControlsProps) {
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showSectorsMenu, setShowSectorsMenu] = useState(false);

  return (
    <>
      {/* ─── 64px LEFT NAVIGATION RAIL (Desktop) ─────────────────────────────── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 bottom-0 w-16 bg-white border-r border-[var(--line)] flex-col items-center justify-between py-4 z-30 select-none"
        aria-label="Primary navigation rail"
      >
        {/* Top: Brand Mark */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/"
            className="w-10 h-10 rounded-sm bg-[var(--paper)] border border-[var(--line)] flex items-center justify-center hover:border-[var(--ink)] transition-colors group"
            title="Aeroloom Home"
            aria-label="Aeroloom Home"
          >
            <AeroloomLogo variant="mark" size={22} />
          </Link>

          {/* Core Navigation Items */}
          <div className="flex flex-col items-center gap-2">
            <button
              className="w-10 h-10 rounded-sm bg-[var(--paper-alt)] border border-[var(--ink)] text-[var(--ink)] flex items-center justify-center relative"
              title="Live Airspace Radar (/map)"
              aria-label="Live Airspace Radar"
            >
              <Icon name="radio" size={18} />
              <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-[var(--signal)]" />
            </button>

            <button
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-sm text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper)] border border-transparent hover:border-[var(--line)] transition-colors flex items-center justify-center"
              title="Search Flights & Airports (Cmd+K or /)"
              aria-label="Search"
            >
              <Icon name="search" size={18} />
            </button>

            <button
              onClick={() => onTriggerAssistant?.()}
              className="w-10 h-10 rounded-sm text-[var(--signal)] hover:bg-[var(--signal-wash)] border border-transparent hover:border-[var(--signal)]/30 transition-colors flex items-center justify-center"
              title="Ask Aeroloom Grounded AI"
              aria-label="Ask Aeroloom"
            >
              <Icon name="radar" size={18} />
            </button>

            <Link
              href="/airports"
              className="w-10 h-10 rounded-sm text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper)] border border-transparent hover:border-[var(--line)] transition-colors flex items-center justify-center"
              title="Airports Directory (/airports)"
              aria-label="Airports"
            >
              <Icon name="tower" size={18} />
            </Link>

            <Link
              href="/about/data"
              className="w-10 h-10 rounded-sm text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper)] border border-transparent hover:border-[var(--line)] transition-colors flex items-center justify-center"
              title="Data Transparency (/about/data)"
              aria-label="Data Sources"
            >
              <Icon name="globe" size={18} />
            </Link>
          </div>
        </div>

        {/* Bottom: Design Kit & Settings */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/dev/kit"
            className="w-10 h-10 rounded-sm text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper)] border border-transparent hover:border-[var(--line)] transition-colors flex items-center justify-center"
            title="Design System Kit (/dev/kit)"
            aria-label="Design Kit"
          >
            <Icon name="layers" size={18} />
          </Link>
        </div>
      </nav>

      {/* ─── TOP CONTROL BAR ─────────────────────────────────────────────────── */}
      <div
        className="fixed top-3 left-4 md:left-20 right-4 flex items-center justify-between pointer-events-none z-20 gap-2"
        aria-label="Map Control Bar"
      >
        {/* Left: Command Search Bar + Live Counter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenSearch}
            className="bg-white/95 backdrop-blur-sm border border-[var(--line)] hover:border-[var(--ink)] shadow-sm px-3 py-1.5 rounded-sm flex items-center gap-3 transition-colors text-xs font-mono text-[var(--ink-2)]"
            title="Open command search (Cmd+K)"
          >
            <Icon name="search" size={14} className="text-[var(--ink-3)]" />
            <span className="hidden sm:inline">Search flight, airport, or hex...</span>
            <span className="sm:hidden">Search...</span>
            <kbd className="hidden lg:inline-block bg-[var(--paper)] border border-[var(--line)] text-[10px] px-1.5 py-0.5 rounded text-[var(--ink-3)]">
              ⌘K
            </kbd>
          </button>

          {/* Counter Chip */}
          <div className="bg-white/95 backdrop-blur-sm border border-[var(--line)] px-2.5 py-1.5 rounded-sm shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
            <span className="font-mono text-xs font-semibold text-[var(--ink)]">
              {filteredCount.toLocaleString()}
            </span>
            <span className="font-mono text-[10px] uppercase text-[var(--ink-3)] hidden sm:inline">
              airborne
            </span>
          </div>

          {/* Follow Mode Indicator */}
          {isFollowMode && (
            <div className="bg-[var(--signal)] text-white px-2.5 py-1.5 rounded-sm shadow-sm flex items-center gap-2 animate-in fade-in duration-150">
              <span className="font-mono text-xs font-semibold">
                LOCK {selectedCallsign || 'CAMERA'}
              </span>
              <button
                onClick={onExitFollow}
                className="hover:opacity-80 p-0.5 text-white"
                title="Exit follow mode (Esc or drag map)"
                aria-label="Exit follow mode"
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Ask AI + Layers Menu + Sector Menu + Auth */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Ask AI Button */}
          <button
            onClick={() => onTriggerAssistant?.()}
            className="bg-white/95 backdrop-blur-sm border border-[var(--signal)]/30 hover:border-[var(--signal)] px-2.5 py-1.5 rounded-sm shadow-sm flex items-center gap-1.5 text-xs font-mono text-[var(--signal-ink)] bg-[var(--signal-wash)] hover:bg-[var(--signal-wash)]/80 transition-colors"
            title="Ask Aeroloom Grounded AI Flight Assistant"
            aria-label="Ask Aeroloom Grounded AI"
          >
            <Icon name="radar" size={14} className="text-[var(--signal)]" />
            <span className="hidden sm:inline font-semibold">Ask AI</span>
          </button>
          {/* Sector Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowSectorsMenu((prev) => !prev)}
              className="bg-white/95 backdrop-blur-sm border border-[var(--line)] hover:border-[var(--ink)] px-2.5 py-1.5 rounded-sm shadow-sm flex items-center gap-1.5 text-xs font-mono text-[var(--ink)] transition-colors"
              title="Switch Airspace Sector"
            >
              <Icon name="compass" size={14} className="text-[var(--ink-3)]" />
              <span className="hidden sm:inline">Sectors</span>
            </button>

            {showSectorsMenu && (
              <div className="absolute right-0 top-9 w-44 bg-white border border-[var(--line)] shadow-lg rounded-sm py-1 z-30 font-mono text-xs">
                <div className="px-3 py-1 text-[10px] text-[var(--ink-4)] uppercase tracking-wider border-b border-[var(--line)]">
                  Tactical Sectors
                </div>
                {[
                  { id: 'global', label: 'Global Airspace' },
                  { id: 'conus', label: 'North America (CONUS)' },
                  { id: 'europe', label: 'Europe (EGLL/LFPG)' },
                  { id: 'india', label: 'India (VABB/VIDP)' },
                  { id: 'east-asia', label: 'East Asia (RJTT/VHHH)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSector(s.id);
                      setShowSectorsMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--paper)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors flex items-center justify-between"
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layers Popover Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowLayersMenu((prev) => !prev)}
              className="bg-white/95 backdrop-blur-sm border border-[var(--line)] hover:border-[var(--ink)] px-2.5 py-1.5 rounded-sm shadow-sm flex items-center gap-1.5 text-xs font-mono text-[var(--ink)] transition-colors"
              title="Map Layers (L)"
            >
              <Icon name="layers" size={14} className="text-[var(--ink-3)]" />
              <span className="hidden sm:inline">Layers</span>
            </button>

            {showLayersMenu && (
              <div className="absolute right-0 top-9 w-52 bg-white border border-[var(--line)] shadow-lg rounded-sm p-3 z-30 font-mono text-xs space-y-2.5">
                <div className="text-[10px] text-[var(--ink-4)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
                  Basemap Layers
                </div>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--ink-2)]">Day/Night Solar</span>
                  <input
                    type="checkbox"
                    checked={layers.terminator}
                    onChange={(e) => onLayerChange({ ...layers, terminator: e.target.checked })}
                    className="accent-[var(--signal)]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--ink-2)]">RainViewer Radar</span>
                  <input
                    type="checkbox"
                    checked={layers.radar}
                    onChange={(e) => onLayerChange({ ...layers, radar: e.target.checked })}
                    className="accent-[var(--signal)]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--ink-2)]">Airports Overlay</span>
                  <input
                    type="checkbox"
                    checked={layers.airports}
                    onChange={(e) => onLayerChange({ ...layers, airports: e.target.checked })}
                    className="accent-[var(--signal)]"
                  />
                </label>
              </div>
            )}
          </div>

          {/* User Account / Guest Persistence Menu */}
          <AuthUserMenu />
        </div>
      </div>

      {/* ─── FILTER CHIP BAR (Floating horizontal scroll below search) ───────── */}
      <div
        className="fixed top-14 left-4 md:left-20 right-4 flex items-center gap-2 pointer-events-none z-20 overflow-x-auto no-scrollbar py-1"
        aria-label="Filter Chips"
      >
        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/90 backdrop-blur-sm border border-[var(--line)] p-1 rounded-sm shadow-xs">
          {/* Altitude Chips */}
          <span className="text-[10px] font-mono uppercase text-[var(--ink-4)] px-1.5">ALT:</span>
          {(['all', 'low', 'med', 'high'] as const).map((alt) => (
            <button
              key={alt}
              onClick={() => onFilterChange({ ...filters, altitude: alt })}
              className={`px-2 py-0.5 rounded-xs text-[11px] font-mono uppercase transition-colors ${
                filters.altitude === alt
                  ? 'bg-[var(--ink)] text-white font-medium'
                  : 'text-[var(--ink-2)] hover:bg-[var(--paper)]'
              }`}
            >
              {alt === 'all' ? 'All' : alt === 'low' ? '<10k' : alt === 'med' ? '10-25k' : '>25k'}
            </button>
          ))}

          <span className="w-px h-3 bg-[var(--line)] mx-1" />

          {/* On Ground Filter */}
          <button
            onClick={() => onFilterChange({ ...filters, showGround: !filters.showGround })}
            className={`px-2 py-0.5 rounded-xs text-[11px] font-mono uppercase transition-colors ${
              filters.showGround
                ? 'bg-[var(--ink)] text-white font-medium'
                : 'text-[var(--ink-3)] hover:bg-[var(--paper)]'
            }`}
          >
            Ground
          </button>
        </div>
      </div>

      {/* ─── BOTTOM RIGHT ZOOM / NAVIGATION CONTROLS ─────────────────────────── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-1.5 z-20 select-none">
        <button
          onClick={onZoomIn}
          className="w-8 h-8 bg-white border border-[var(--line)] hover:border-[var(--ink)] text-[var(--ink)] rounded-sm shadow-sm flex items-center justify-center font-mono text-sm font-bold transition-colors"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 bg-white border border-[var(--line)] hover:border-[var(--ink)] text-[var(--ink)] rounded-sm shadow-sm flex items-center justify-center font-mono text-sm font-bold transition-colors"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          −
        </button>
        <button
          onClick={onResetBearing}
          className="w-8 h-8 bg-white border border-[var(--line)] hover:border-[var(--ink)] text-[var(--ink-3)] hover:text-[var(--ink)] rounded-sm shadow-sm flex items-center justify-center transition-colors"
          title="Reset North Heading"
          aria-label="Reset North"
        >
          <Icon name="compass" size={14} />
        </button>
      </div>
    </>
  );
}
