'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
  setWorkerUrl,
  type ErrorEvent,
} from 'maplibre-gl';
import { BASEMAP_PROVIDERS, AVIATION_SECTORS, MAP_DEFAULTS, type AviationSector } from '@/lib/map/config';

// Configure MapLibre Web Worker static URL for Turbopack/Next.js environment
if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre-gl-worker.mjs');
}
import { AlertCircle, RefreshCw, Layers, Compass, Loader2 } from 'lucide-react';

export interface MapMetrics {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface FlightMapProps {
  activeSector?: AviationSector;
  onSectorChange?: (sector: AviationSector) => void;
  onMetricsChange?: (metrics: MapMetrics) => void;
  children?: (map: MapLibreMap | null) => React.ReactNode;
}

export default function FlightMap({
  activeSector = MAP_DEFAULTS.initialSector,
  onSectorChange,
  onMetricsChange,
  children,
}: FlightMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [activeProviderKey, setActiveProviderKey] = useState<string>('cartoDark');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapMetrics, setMapMetrics] = useState<MapMetrics>({
    lng: activeSector.center[0],
    lat: activeSector.center[1],
    zoom: activeSector.zoom,
    pitch: activeSector.pitch,
    bearing: activeSector.bearing,
  });
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  const activeProvider = BASEMAP_PROVIDERS[activeProviderKey] || BASEMAP_PROVIDERS.cartoDark;

  // Initialize MapLibre instance
  const initMap = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up previous map if exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    setIsLoading(true);
    setMapError(null);
    setIsMapReady(false);

    try {
      const map = new MapLibreMap({
        container: containerRef.current,
        style: activeProvider.styleUrl,
        center: activeSector.center,
        zoom: activeSector.zoom,
        pitch: activeSector.pitch,
        bearing: activeSector.bearing,
        minZoom: MAP_DEFAULTS.minZoom,
        maxZoom: MAP_DEFAULTS.maxZoom,
        attributionControl: false, // We mount custom styled attribution control
        dragRotate: MAP_DEFAULTS.dragRotate,
        touchPitch: MAP_DEFAULTS.touchPitch,
      });

      // Add navigation controls (zoom in/out, pitch/compass reset)
      map.addControl(
        new NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true,
        }),
        'bottom-right'
      );

      // Add nautical scale control
      map.addControl(
        new ScaleControl({
          maxWidth: 120,
          unit: 'nautical',
        }),
        'bottom-left'
      );

      // Add fullscreen control
      map.addControl(
        new FullscreenControl({
          container: containerRef.current,
        }),
        'bottom-right'
      );

      // Listen to map telemetry / movement
      const updateMetrics = () => {
        const center = map.getCenter();
        const metrics: MapMetrics = {
          lng: Number(center.lng.toFixed(4)),
          lat: Number(center.lat.toFixed(4)),
          zoom: Number(map.getZoom().toFixed(1)),
          pitch: Number(map.getPitch().toFixed(0)),
          bearing: Number(map.getBearing().toFixed(0)),
        };
        setMapMetrics(metrics);
        onMetricsChange?.(metrics);
      };

      map.on('move', updateMetrics);
      map.on('zoom', updateMetrics);
      map.on('pitch', updateMetrics);
      map.on('rotate', updateMetrics);

      // Handle map load completion
      const handleReady = () => {
        setIsLoading(false);
        setIsMapReady(true);
        updateMetrics();
      };

      map.on('load', handleReady);
      map.on('idle', handleReady);
      map.on('styledata', () => {
        if (map.isStyleLoaded()) {
          handleReady();
        }
      });

      // Safety fallback: ensure loading overlay clears even on slow network
      const loadSafetyTimer = setTimeout(handleReady, 3500);

      // Handle tile / style error
      map.on('error', (e: ErrorEvent) => {
        // Tile 404s/temporary blips shouldn't break whole deck, only fatal style errors
        if (e.error && (e.error.message.includes('style') || e.error.message.includes('WebGL'))) {
          setMapError(`Map Engine Alert: ${e.error.message}`);
          setIsLoading(false);
        }
      });

      mapRef.current = map;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize WebGL map canvas';
      setMapError(msg);
      setIsLoading(false);
    }
  }, [activeProvider.styleUrl, activeSector, onMetricsChange]);

  // Initial mount
  useEffect(() => {
    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initMap]);

  // ResizeObserver for fluid responsive map resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle programmatic sector navigation
  const flyToSector = (sector: AviationSector) => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: sector.center,
      zoom: sector.zoom,
      pitch: sector.pitch,
      bearing: sector.bearing,
      essential: true,
      duration: 1600,
    });

    onSectorChange?.(sector);
  };

  // Toggle basemap between Carto Dark Matter and OpenFreeMap Dark
  const toggleBasemap = () => {
    const nextKey = activeProviderKey === 'cartoDark' ? 'openFreeMapDark' : 'cartoDark';
    setActiveProviderKey(nextKey);
  };

  // Reset camera to active sector
  const resetCamera = () => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 600,
    });
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 bg-[#080b11] overflow-hidden select-none">
      {/* MapLibre WebGL Canvas Container */}
      <div
        ref={containerRef}
        id="aeroloom-flight-map"
        className="absolute inset-0 w-full h-full"
        style={{ background: '#080b11' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#080b11]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f141f] border border-[#1f293d] text-slate-200 font-mono text-xs shadow-xl">
            <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
            <span>INITIALIZING VECTOR BASEMAP ENGINE...</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {activeProvider.name} &bull; EPSG:3857 Web Mercator
          </span>
        </div>
      )}

      {/* Error Fallback State */}
      {mapError && (
        <div className="absolute inset-0 bg-[#080b11]/95 z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 max-w-md flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <div>
              <h3 className="text-sm font-semibold text-rose-200 font-mono">
                BASEMAP ENGINE DISRUPTED
              </h3>
              <p className="text-xs text-rose-300/80 mt-1 font-mono">
                {mapError}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={initMap}
                className="px-3 py-1.5 rounded-lg bg-[#0f141f] border border-[#1f293d] text-xs font-mono text-slate-200 hover:text-white hover:border-sky-500 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Canvas
              </button>
              <button
                onClick={toggleBasemap}
                className="px-3 py-1.5 rounded-lg bg-sky-600/20 border border-sky-500/40 text-xs font-mono text-sky-300 hover:bg-sky-600/30 transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Switch to {activeProviderKey === 'cartoDark' ? 'OpenFreeMap' : 'CARTO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tactical Telemetry Overlay (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex flex-col gap-1.5 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-[#0f141f]/90 border border-[#1f293d] backdrop-blur-md text-[11px] font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">POS:</span>
            <span className="text-sky-300 font-semibold">
              {Math.abs(mapMetrics.lat).toFixed(4)}°{mapMetrics.lat >= 0 ? 'N' : 'S'},{' '}
              {Math.abs(mapMetrics.lng).toFixed(4)}°{mapMetrics.lng >= 0 ? 'E' : 'W'}
            </span>
          </div>

          <div className="w-px h-3 bg-[#1f293d]" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">ZOOM:</span>
            <span className="text-slate-200 font-semibold">{mapMetrics.zoom}x</span>
          </div>

          {mapMetrics.pitch > 0 && (
            <>
              <div className="w-px h-3 bg-[#1f293d]" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">PITCH:</span>
                <span className="text-amber-400 font-semibold">{mapMetrics.pitch}°</span>
              </div>
            </>
          )}

          {mapMetrics.bearing !== 0 && (
            <>
              <div className="w-px h-3 bg-[#1f293d]" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">HDG:</span>
                <span className="text-slate-200 font-semibold">
                  {((mapMetrics.bearing % 360 + 360) % 360).toFixed(0).padStart(3, '0')}°
                </span>
              </div>
            </>
          )}

          {(mapMetrics.pitch !== 0 || mapMetrics.bearing !== 0) && (
            <button
              onClick={resetCamera}
              title="Reset 2D North-up View"
              className="ml-1 p-0.5 rounded text-sky-400 hover:text-white hover:bg-sky-500/20 transition-colors pointer-events-auto"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sector Label Pill */}
        <div className="px-2.5 py-1 rounded bg-[#080b11]/80 border border-[#1f293d]/80 text-[10px] font-mono text-slate-400 max-w-fit">
          SECTOR: <span className="text-slate-200 font-semibold">{activeSector.label}</span> ({activeSector.iata})
        </div>
      </div>

      {/* Floating Tactical Layer Controls (Top-Right of Map) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={toggleBasemap}
          title={`Active Style: ${activeProvider.name}. Click to switch basemap.`}
          className="px-2.5 py-1.5 rounded-lg bg-[#0f141f]/90 border border-[#1f293d] hover:border-sky-500/60 backdrop-blur-md text-[11px] font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-md"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">{activeProvider.name}</span>
          <span className="sm:hidden">BASEMAP</span>
        </button>
      </div>

      {/* Basemap Attribution Bar (Bottom-Right, compliant with CARTO and OpenStreetMap) */}
      <div className="absolute bottom-1 right-1 z-10 pointer-events-auto">
        <div className="px-2 py-0.5 rounded bg-[#080b11]/85 border border-[#1f293d]/60 text-[9px] font-mono text-slate-500 flex items-center gap-1.5">
          <span>{activeProvider.attribution}</span>
        </div>
      </div>

      {/* Slot for Child Overlays / Live Aircraft Layer (Sprint 2) */}
      {isMapReady && children && children(mapRef.current)}
    </div>
  );
}

export { AVIATION_SECTORS };
