'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import FlightMap from '@/components/map/FlightMap';
import AircraftLayer from '@/components/map/AircraftLayer';
import ObservatoryHeader from '@/components/observatory/ObservatoryHeader';
import HorizonDock from '@/components/observatory/HorizonDock';
import GlobalSearchModal from '@/components/observatory/GlobalSearchModal';
import LandingScene from '@/components/landing/LandingScene';
import LandingOverlay from '@/components/landing/LandingOverlay';
import { useLiveAircraft } from '@/hooks/useLiveAircraft';
import { AVIATION_SECTORS, type AviationSector } from '@/lib/map/config';

export type AppStage = 'landing' | 'observatory';
export type FlightFilter = 'ALL' | 'CRUISE' | 'CLIMB' | 'GROUND' | 'EMERGENCY';

export default function Home() {
  const [appStage, setAppStage] = useState<AppStage>('landing');
  const [isDiving, setIsDiving] = useState<boolean>(false);
  const [activeSector, setActiveSector] = useState<AviationSector>(AVIATION_SECTORS[0]);
  const [activeFilter, setActiveFilter] = useState<FlightFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeBasemapKey, setActiveBasemapKey] = useState<'cartoDark' | 'openFreeMapDark'>('cartoDark');

  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  // Live ADS-B stream hook (active across both stages for instant data readiness)
  const {
    aircraft,
    totalCount,
    isRefreshing,
    isStale,
    selectedAircraft,
    selectedAircraftId,
    isFollowMode,
    selectedAircraftTrail,
    isReplayActive,
    isReplayPlaying,
    replayIndex,
    replaySpeed,
    startReplay,
    toggleReplayPlay,
    seekReplay,
    setReplaySpeed,
    stopReplay,
    setSelectedAircraftId,
    setIsFollowMode,
  } = useLiveAircraft({
    sector: activeSector,
    pollIntervalMs: 6000,
    enabled: true,
  });

  // Global Keyboard Shortcuts (Cmd+K / / to search, Escape to dismiss/close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '/' && !isSearchOpen && appStage === 'observatory') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (selectedAircraftId) {
          setSelectedAircraftId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, selectedAircraftId, appStage, setSelectedAircraftId]);

  // Handle URL query parameters (e.g. ?select=a38d95 or ?stage=observatory)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sel = params.get('select');
      const stage = params.get('stage');
      if (sel) {
        setSelectedAircraftId(sel);
        setAppStage('observatory');
      } else if (stage === 'observatory') {
        setAppStage('observatory');
      }
    }
  }, [setSelectedAircraftId]);

  // Handle Sector Switch with Camera FlyTo
  const handleSelectSector = useCallback(
    (sector: AviationSector) => {
      setActiveSector(sector);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({
          center: sector.center,
          zoom: sector.zoom,
          pitch: sector.pitch,
          bearing: sector.bearing,
          essential: true,
          duration: 1600,
        });
      }
    },
    []
  );

  // Handle Option A Cinematic Dive Transition from Landing to Live Map
  const handleEnterAirspace = (chosenSector?: AviationSector) => {
    if (chosenSector) {
      handleSelectSector(chosenSector);
    }
    setIsDiving(true);
  };

  const handleDiveComplete = () => {
    setAppStage('observatory');
    setIsDiving(false);
    setTimeout(() => {
      mapInstanceRef.current?.resize();
    }, 100);
  };

  const handleReturnToOrbit = () => {
    setSelectedAircraftId(null);
    setAppStage('landing');
    setIsDiving(false);
  };

  // Ensure MapLibre recalculates canvas dimensions and renders tiles upon entering observatory
  useEffect(() => {
    if (appStage === 'observatory' && mapInstanceRef.current) {
      mapInstanceRef.current.resize();
      const t1 = setTimeout(() => mapInstanceRef.current?.resize(), 150);
      const t2 = setTimeout(() => mapInstanceRef.current?.resize(), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [appStage]);

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

  // Select flight from search or list
  const handleSelectFlight = (id: string | null) => {
    setSelectedAircraftId(id);
    if (id && mapInstanceRef.current) {
      const match = aircraft.find((a) => a.id === id || a.callsign === id);
      if (match) {
        mapInstanceRef.current.flyTo({
          center: [match.longitude, match.latitude],
          zoom: 11,
          essential: true,
          duration: 1200,
        });
      }
    }
  };

  // Toggle basemap between CARTO and OpenFreeMap
  const handleToggleBasemap = () => {
    const nextKey = activeBasemapKey === 'cartoDark' ? 'openFreeMapDark' : 'cartoDark';
    setActiveBasemapKey(nextKey);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__aeroloomEnterAirspace = () => {
        handleEnterAirspace();
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__aeroloomSelectFlight = handleSelectFlight;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__aeroloomSetSector = handleSelectSector;
    }
  }, [handleSelectFlight, handleSelectSector]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030712] text-[#f8fafc]">
      {/* ========================================================================= */}
      {/* STAGE 1: CINEMATIC 3D LANDING EXPERIENCE                                 */}
      {/* ========================================================================= */}
      {appStage === 'landing' && (
        <div className="absolute inset-0 z-40 transition-opacity duration-700">
          <LandingScene
            isDiving={isDiving}
            onDiveComplete={handleDiveComplete}
          />
          <LandingOverlay
            onEnterAirspace={handleEnterAirspace}
            isDiving={isDiving}
            totalTracked={totalCount || aircraft.length}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: LIVE 2D MAPLIBRE FLIGHT OBSERVATORY                             */}
      {/* ========================================================================= */}
      <div
        className={`relative w-full h-full transition-opacity duration-1000 ${
          appStage === 'observatory' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Floating Minimalist Island Header */}
        <ObservatoryHeader
          activeSector={activeSector}
          onSelectSector={handleSelectSector}
          onOpenSearch={() => setIsSearchOpen(true)}
          onReturnToOrbit={handleReturnToOrbit}
          onToggleBasemap={handleToggleBasemap}
          activeBasemapName={activeBasemapKey === 'cartoDark' ? 'CARTO Dark Matter' : 'OpenFreeMap Dark'}
          trackedCount={totalCount || aircraft.length}
          isRefreshing={isRefreshing}
          isStale={isStale}
        />

        {/* Full-Viewport 2D Vector Map Canvas */}
        <main className="relative w-full h-full overflow-hidden">
          <FlightMap
            activeSector={activeSector}
            providerKey={activeBasemapKey}
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
                selectedAircraftTrail={selectedAircraftTrail}
                searchQuery={searchQuery}
                activeFilter={activeFilter}
                onSelectAircraft={handleSelectFlight}
                isFollowMode={isFollowMode}
                onDisableFollowMode={() => setIsFollowMode(false)}
              />
            )}
          </FlightMap>

          {/* Bottom Horizon Telemetry Dock & Responsive Flight Stage */}
          <HorizonDock
            aircraftList={aircraft}
            selectedAircraft={selectedAircraft}
            selectedAircraftId={selectedAircraftId}
            isFollowMode={isFollowMode}
            selectedAircraftTrail={selectedAircraftTrail}
            isReplayActive={isReplayActive}
            isReplayPlaying={isReplayPlaying}
            replayIndex={replayIndex}
            replaySpeed={replaySpeed}
            onToggleFollow={() => setIsFollowMode(!isFollowMode)}
            onCenterFlight={handleCenterFlight}
            onCloseDossier={() => setSelectedAircraftId(null)}
            onSelectAircraft={handleSelectFlight}
            onStartReplay={startReplay}
            onToggleReplayPlay={toggleReplayPlay}
            onSeekReplay={seekReplay}
            onSetReplaySpeed={setReplaySpeed}
            onStopReplay={stopReplay}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </main>
      </div>

      {/* Global Omnisearch Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        aircraftList={aircraft}
        onSelectAircraft={handleSelectFlight}
        onSelectSector={handleSelectSector}
      />
    </div>
  );
}
