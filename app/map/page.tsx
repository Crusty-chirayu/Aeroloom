'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveAircraft } from '@/hooks/useLiveAircraft';
import { FlightMap } from '@/components/map/FlightMap';
import { FlightPanel } from '@/components/flight/FlightPanel';
import { MapControls, type MapFilters, type MapLayers } from '@/components/map/MapControls';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Button } from '@/components/ui/Button';
import type { Bounds } from '@/lib/providers/types';

// Sector coordinate mappings
const SECTOR_COORDS: Record<string, { center: [number, number]; zoom: number }> = {
  global: { center: [0, 20], zoom: 2.5 },
  conus: { center: [-98.57, 39.82], zoom: 4.5 },
  europe: { center: [10.0, 50.0], zoom: 5 },
  india: { center: [78.96, 20.59], zoom: 5 },
  'east-asia': { center: [125.0, 32.0], zoom: 5 },
};

function MapViewContent() {
  const searchParams = useSearchParams();

  // Initial parameters from URL
  const initialLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 40.64;
  const initialLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : -73.78;
  const initialZoom = searchParams.get('z') ? parseFloat(searchParams.get('z')!) : 8;
  const initialFlight = searchParams.get('flight') || null;

  // Live Aircraft Telemetry Hook
  const {
    aircraft,
    totalCount,
    isLoading,
    isStale,
    isDegraded,
    error,
    selectedAircraft,
    selectedAircraftId,
    isFollowMode,
    selectedAircraftTrail,
    interpolator,
    setSelectedAircraftId,
    setIsFollowMode,
    setBounds,
    refresh,
  } = useLiveAircraft({
    zoom: initialZoom,
  });

  // UI Filters State
  const [filters, setFilters] = useState<MapFilters>({
    altitude: 'all',
    category: 'all',
    showGround: false,
  });

  // UI Layers State
  const [layers, setLayers] = useState<MapLayers>({
    terminator: true,
    radar: false,
    airports: true,
    labels: 'normal',
  });

  // Command palette search state
  const [searchOpen, setSearchOpen] = useState(false);

  // Apply initial flight selection from URL query if present
  useEffect(() => {
    if (initialFlight && !selectedAircraftId) {
      setSelectedAircraftId(initialFlight);
    }
  }, [initialFlight, selectedAircraftId, setSelectedAircraftId]);

  // Sync URL with map and flight selection
  const handleBoundsChange = useCallback(
    (bounds: Bounds, zoom: number) => {
      setBounds(bounds, zoom);

      // Non-destructive URL update
      if (typeof window !== 'undefined') {
        const centerLat = ((bounds.north + bounds.south) / 2).toFixed(4);
        const centerLng = ((bounds.east + bounds.west) / 2).toFixed(4);
        const url = new URL(window.location.href);
        url.searchParams.set('lat', centerLat);
        url.searchParams.set('lng', centerLng);
        url.searchParams.set('z', zoom.toFixed(1));
        if (selectedAircraftId) {
          url.searchParams.set('flight', selectedAircraftId);
        } else {
          url.searchParams.delete('flight');
        }
        window.history.replaceState({}, '', url.toString());
      }
    },
    [setBounds, selectedAircraftId]
  );

  // Sector Switching
  const handleSelectSector = useCallback(
    (sectorId: string) => {
      const target = SECTOR_COORDS[sectorId];
      if (target) {
        // Trigger page search update
        const url = new URL(window.location.href);
        url.searchParams.set('lat', target.center[1].toString());
        url.searchParams.set('lng', target.center[0].toString());
        url.searchParams.set('z', target.zoom.toString());
        window.location.href = url.toString();
      }
    },
    []
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        if (selectedAircraftId) {
          setIsFollowMode(!isFollowMode);
        }
      } else if (e.key === 'Escape') {
        if (isFollowMode) {
          setIsFollowMode(false);
        } else if (selectedAircraftId) {
          setSelectedAircraftId(null);
        }
      } else if (e.key === 'l' || e.key === 'L') {
        setLayers((prev) => ({ ...prev, radar: !prev.radar }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAircraftId, isFollowMode, setIsFollowMode, setSelectedAircraftId]);

  // Compute filtered count
  const filteredCount = aircraft.filter((ac) => {
    if (!filters.showGround && ac.onGround) return false;
    const alt = ac.altitudeFt ?? 0;
    if (filters.altitude === 'low' && alt >= 10000) return false;
    if (filters.altitude === 'med' && (alt < 10000 || alt > 25000)) return false;
    if (filters.altitude === 'high' && alt <= 25000) return false;
    return true;
  }).length;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[var(--paper)] select-none">
      {/* Primary Map Canvas Engine */}
      <FlightMap
        interpolator={interpolator}
        selectedAircraftId={selectedAircraftId}
        selectedTrail={selectedAircraftTrail}
        isFollowMode={isFollowMode}
        onSelectAircraft={setSelectedAircraftId}
        onExitFollow={() => setIsFollowMode(false)}
        onBoundsChange={handleBoundsChange}
        initialCenter={[initialLng, initialLat]}
        initialZoom={initialZoom}
        filters={filters}
        layers={layers}
        className="w-full h-full"
      />

      {/* Primary Map Chrome Controls */}
      <MapControls
        totalCount={totalCount}
        filteredCount={filteredCount}
        filters={filters}
        onFilterChange={setFilters}
        layers={layers}
        onLayerChange={setLayers}
        onOpenSearch={() => setSearchOpen(true)}
        onZoomIn={() => {
          // Native zoom dispatched via keyboard or controls
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
        }}
        onZoomOut={() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
        }}
        onResetBearing={() => {}}
        onSelectSector={handleSelectSector}
        isFollowMode={isFollowMode}
        selectedCallsign={selectedAircraft?.callsign}
        onExitFollow={() => setIsFollowMode(false)}
      />

      {/* Right Rail Flight Telemetry Dossier Panel */}
      <FlightPanel
        aircraft={selectedAircraft}
        trail={selectedAircraftTrail}
        isOpen={Boolean(selectedAircraftId)}
        onClose={() => {
          setSelectedAircraftId(null);
          setIsFollowMode(false);
        }}
        isFollowMode={isFollowMode}
        onToggleFollow={() => setIsFollowMode(!isFollowMode)}
      />

      {/* Global Command Palette */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectFlight={(callsign) => {
          setSelectedAircraftId(callsign);
          setSearchOpen(false);
        }}
      />

      {/* ─── SYSTEM STATUS BANNERS (Non-blocking notifications) ─────────────── */}
      <div className="fixed bottom-6 left-4 md:left-24 z-20 flex flex-col gap-2 max-w-sm pointer-events-none">
        {/* Degraded State Banner */}
        {isDegraded && (
          <div className="pointer-events-auto bg-amber-50 border border-amber-300 text-amber-900 px-3 py-2 rounded-sm text-xs font-mono shadow-md flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Telemetry Delayed · Serving Cache</span>
            </div>
            <button
              onClick={refresh}
              className="text-amber-800 underline font-semibold hover:text-amber-950"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stale Airspace Banner */}
        {isStale && !isDegraded && (
          <div className="pointer-events-auto bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink-2)] px-3 py-2 rounded-sm text-xs font-mono shadow-md flex items-center justify-between gap-3 animate-in fade-in">
            <span>Updating Airspace Contacts...</span>
            <button onClick={refresh} className="underline font-semibold text-[var(--ink)]">
              Refresh
            </button>
          </div>
        )}

        {/* Telemetry Error Banner */}
        {error && (
          <div className="pointer-events-auto bg-red-50 border border-red-300 text-red-900 px-3 py-2 rounded-sm text-xs font-mono shadow-md flex items-center justify-between gap-3 animate-in fade-in">
            <span>{error}</span>
            <button
              onClick={refresh}
              className="text-red-800 underline font-semibold hover:text-red-950"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Empty Airspace Notice */}
        {!isLoading && aircraft.length === 0 && !error && (
          <div className="pointer-events-auto bg-white/95 border border-[var(--line)] px-4 py-3 rounded-sm shadow-md text-xs font-mono text-[var(--ink-2)] animate-in fade-in">
            <p className="font-semibold text-[var(--ink)]">No Airborne Contacts in View</p>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
              Zoom out or pan to an active airspace sector.
            </p>
            <div className="pt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleSelectSector('conus')}>
                Jump to CONUS
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSelectSector('europe')}>
                Jump to Europe
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-[var(--paper)] font-mono text-xs text-[var(--ink-3)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-ping" />
            INITIALIZING TACTICAL RADAR CANVAS...
          </div>
        </div>
      }
    >
      <MapViewContent />
    </Suspense>
  );
}
