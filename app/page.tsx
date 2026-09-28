'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import FlightMap from '@/components/map/FlightMap';
import AircraftLayer from '@/components/map/AircraftLayer';
import Header from '@/components/deck/Header';
import SelectedFlightDossier from '@/components/deck/SelectedFlightDossier';
import { useLiveAircraft } from '@/hooks/useLiveAircraft';
import { AVIATION_SECTORS, type AviationSector } from '@/lib/map/config';
import { Search } from 'lucide-react';

export default function Home() {
  const [activeSector, setActiveSector] = useState<AviationSector>(AVIATION_SECTORS[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  // Live ADS-B stream hook
  const {
    aircraft,
    totalCount,
    isRefreshing,
    isStale,
    selectedAircraft,
    selectedAircraftId,
    isFollowMode,
    setSelectedAircraftId,
    setIsFollowMode,
  } = useLiveAircraft({
    sector: activeSector,
    pollIntervalMs: 6000,
    enabled: true,
  });

  // Handle keyboard shortcuts (Escape to dismiss selected aircraft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAircraftId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedAircraftId]);

  // Center camera onto selected flight
  const handleCenterFlight = () => {
    if (!mapInstanceRef.current || !selectedAircraft) return;
    mapInstanceRef.current.flyTo({
      center: [selectedAircraft.longitude, selectedAircraft.latitude],
      zoom: 11,
      essential: true,
      duration: 1200,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080b11] text-[#f8fafc]">
      {/* Precision Telemetry Studio Header */}
      <Header
        activeSector={activeSector}
        onSelectSector={setActiveSector}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        trackedCount={totalCount || aircraft.length}
        isRefreshing={isRefreshing}
        isStale={isStale}
      />

      {/* Mobile Search Bar (Visible only on small viewports) */}
      <div className="lg:hidden px-3 py-2 bg-[#0f141f] border-b border-[#1f293d]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search callsign / hex..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#080b11] border border-[#1f293d] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/70 font-mono"
          />
        </div>
      </div>

      {/* Main Full-Viewport Flight Canvas & Overlays */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <FlightMap
          activeSector={activeSector}
          onSectorChange={setActiveSector}
          onMapReady={(map) => {
            mapInstanceRef.current = map;
          }}
        >
          {(map) => (
            <AircraftLayer
              map={map}
              aircraft={aircraft}
              selectedAircraftId={selectedAircraftId}
              searchQuery={searchQuery}
              onSelectAircraft={setSelectedAircraftId}
              isFollowMode={isFollowMode}
            />
          )}
        </FlightMap>

        {/* Selected Flight Target Dossier Card */}
        {selectedAircraft && (
          <SelectedFlightDossier
            aircraft={selectedAircraft}
            isFollowMode={isFollowMode}
            onToggleFollow={() => setIsFollowMode(!isFollowMode)}
            onCenterFlight={handleCenterFlight}
            onClose={() => setSelectedAircraftId(null)}
          />
        )}
      </main>
    </div>
  );
}
