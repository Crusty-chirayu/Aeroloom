'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import { AEROLOOM_LIGHT_MAP_STYLE } from '@/lib/map/mapStyle';
import { registerAllAircraftSprites, getAircraftSpriteId } from '@/lib/map/spriteAtlas';
import { computeDayNightTerminator } from '@/lib/map/dayNightTerminator';
import type { AircraftState, Bounds } from '@/lib/providers/types';
import type { AircraftInterpolator, RenderedAircraft } from '@/lib/map/interpolation';
import type { PositionSample } from '@/lib/providers/positions/types';
import type { MapFilters, MapLayers } from './MapControls';
import { MapHoverTag } from './MapHoverTag';
import { mapTypeCodeToCategory } from '@/lib/map/typeMapping';

export interface FlightMapProps {
  interpolator: AircraftInterpolator;
  selectedAircraftId: string | null;
  selectedTrail: PositionSample[];
  isFollowMode: boolean;
  onSelectAircraft: (id: string | null) => void;
  onExitFollow: () => void;
  onBoundsChange: (bounds: Bounds, zoom: number) => void;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  filters: MapFilters;
  layers: MapLayers;
  radarTileUrl?: string | null;
  radarOpacity?: number;
  className?: string;
}

export function FlightMap({
  interpolator,
  selectedAircraftId,
  selectedTrail,
  isFollowMode,
  onSelectAircraft,
  onExitFollow,
  onBoundsChange,
  initialCenter = [-73.78, 40.64], // Default JFK
  initialZoom = 8,
  filters,
  layers,
  radarTileUrl = null,
  radarOpacity = 0.7,
  className = '',
}: FlightMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const isMapLoadedRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Hover state
  const [hoveredAircraft, setHoveredAircraft] = useState<AircraftState | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [basemapUnavailable, setBasemapUnavailable] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  // References for values needed in RAF loop to avoid closure capture issues
  const filtersRef = useRef(filters);
  const isFollowModeRef = useRef(isFollowMode);
  const selectedIdRef = useRef(selectedAircraftId);

  useEffect(() => {
    filtersRef.current = filters;
    isFollowModeRef.current = isFollowMode;
    selectedIdRef.current = selectedAircraftId;
  }, [filters, isFollowMode, selectedAircraftId]);

  // 1. Initialize MapLibre GL
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setWorkerUrl('/maplibre-gl-worker.mjs');

    const map = new MapLibreMap({
      container: containerRef.current,
      style: AEROLOOM_LIGHT_MAP_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
      maxPitch: 0, // Flat tactical view per spec
      ...({ preserveDrawingBuffer: true } as unknown as Record<string, unknown>),
    } as unknown as import('maplibre-gl').MapOptions);

    mapRef.current = map;
    if (typeof window !== 'undefined') {
      (window as unknown as { _aeroloomMap?: MapLibreMap })._aeroloomMap = map;
    }

    // Gracefully handle MapLibre errors so failed tile/style fetches never cause uncaught console errors
    map.on('error', (e) => {
      const err = e.error as { status?: number; message?: string; url?: string } | undefined;
      const eventSourceId = (e as unknown as { sourceId?: string }).sourceId;
      const isTileOrStyle =
        eventSourceId === 'openmaptiles' ||
        (err?.url && (err.url.includes('openfreemap') || err.url.includes('rainviewer') || err.url.includes('tilecache'))) ||
        (err?.message && (err.message.includes('fetch') || err.message.includes('tile') || err.message.includes('AJAXError')));

      if (isTileOrStyle) {
        setBasemapUnavailable(true);

        // Retry with backoff (3s, 6s, 12s, max 30s)
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        const backoffMs = Math.min(3000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current += 1;

        retryTimeoutRef.current = setTimeout(() => {
          if (mapRef.current) {
            try {
              const src = mapRef.current.getSource('openmaptiles');
              if (src && 'reload' in src && typeof (src as unknown as { reload: () => void }).reload === 'function') {
                (src as unknown as { reload: () => void }).reload();
              }
            } catch {
              // Silently ignore reload attempts
            }
          }
        }, backoffMs);
      }
    });

    map.on('sourcedata', (e) => {
      if (e.sourceId === 'openmaptiles' && e.isSourceLoaded) {
        setBasemapUnavailable(false);
        retryCountRef.current = 0;
      }
    });

    map.on('load', async () => {
      isMapLoadedRef.current = true;

      // Register custom aviation sprite atlas (66 sprites)
      await registerAllAircraftSprites(map);

      // Add Day/Night Terminator source and layer
      try {
        const terminatorGeoJson = computeDayNightTerminator();
        map.addSource('terminator', {
          type: 'geojson',
          data: terminatorGeoJson,
        });

        map.addLayer({
          id: 'terminator-fill',
          type: 'fill',
          source: 'terminator',
          layout: {
            visibility: layers.terminator ? 'visible' : 'none',
          },
          paint: {
            'fill-color': '#0E1116',
            'fill-opacity': 0.08,
          },
        });
      } catch (err) {
        console.warn('Day/night terminator layer setup notice:', err);
      }

      // Add Weather Radar Raster layer using built-in rainviewer source
      try {
        if (!map.getLayer('radar-raster')) {
          map.addLayer({
            id: 'radar-raster',
            type: 'raster',
            source: 'rainviewer',
            layout: {
              visibility: layers.radar ? 'visible' : 'none',
            },
            paint: {
              'raster-opacity': 0.45,
            },
          });
        }
      } catch (err) {
        console.warn('Radar layer setup notice:', err);
      }

      // Add Selected Flight Breadcrumb Trail
      map.addSource('selected-trail', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'selected-trail-casing',
        type: 'line',
        source: 'selected-trail',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'selected-trail-line',
        type: 'line',
        source: 'selected-trail',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FF4F1F',
          'line-width': 2,
          'line-dasharray': [2, 1],
        },
      });

      // Add Aircraft Ground Shadow source & layer
      map.addSource('aircraft-shadow', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'aircraft-shadow-layer',
        type: 'symbol',
        source: 'aircraft-shadow',
        layout: {
          'icon-image': ['get', 'iconImage'],
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': 0.65,
        },
        paint: {
          'icon-opacity': 0.3,
        },
      });

      // Add Primary Aircraft layer
      map.addSource('aircraft', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'aircraft-layer',
        type: 'symbol',
        source: 'aircraft',
        layout: {
          'icon-image': ['get', 'iconImage'],
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': 0.65,
        },
      });

      // Add Aircraft Callout Labels (zoomed in)
      map.addLayer({
        id: 'aircraft-labels',
        type: 'symbol',
        source: 'aircraft',
        minzoom: 8.5,
        layout: {
          'text-field': ['get', 'callsign'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#0E1116',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
        },
      });

      // Initial bounds trigger
      const bounds = map.getBounds();
      onBoundsChange(
        {
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast(),
        },
        map.getZoom()
      );
    });

    // Map Interaction Listeners
    const notifyBounds = () => {
      if (!map) return;
      const b = map.getBounds();
      onBoundsChange(
        {
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        },
        map.getZoom()
      );
    };

    map.on('moveend', notifyBounds);
    map.on('zoomend', notifyBounds);

    // Disable follow mode on manual drag
    map.on('dragstart', () => {
      if (isFollowModeRef.current) {
        onExitFollow();
      }
    });

    // Hover hit testing
    map.on('mousemove', 'aircraft-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const feature = e.features?.[0];
      if (feature && feature.properties) {
        const id = feature.properties.id;
        interpolator.setHoveredId(id);
        const ac = interpolator.get(id);
        if (ac) {
          setHoveredAircraft(ac.raw);
          setHoverPos({ x: e.point.x, y: e.point.y });
        }
      }
    });

    map.on('mouseleave', 'aircraft-layer', () => {
      map.getCanvas().style.cursor = '';
      interpolator.setHoveredId(null);
      setHoveredAircraft(null);
    });

    // Click selection
    map.on('click', 'aircraft-layer', (e) => {
      const feature = e.features?.[0];
      if (feature && feature.properties?.id) {
        const id = feature.properties.id;
        onSelectAircraft(id);
      }
    });

    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['aircraft-layer'] });
      if (!features || features.length === 0) {
        onSelectAircraft(null);
      }
    });

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      map.remove();
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // 2. Layer visibility synchronization & dynamic radar source
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;

    if (map.getLayer('terminator-fill')) {
      map.setLayoutProperty('terminator-fill', 'visibility', layers.terminator ? 'visible' : 'none');
    }

    if (!layers.radar || !radarTileUrl) {
      if (map.getLayer('radar-raster')) {
        map.setLayoutProperty('radar-raster', 'visibility', 'none');
      }
      return;
    }

    try {
      const source = map.getSource('rainviewer-radar') as unknown as { setTiles: (tiles: string[]) => void } | undefined;
      if (source && typeof source.setTiles === 'function') {
        source.setTiles([radarTileUrl]);
        if (map.getLayer('radar-raster')) {
          map.setLayoutProperty('radar-raster', 'visibility', 'visible');
          map.setPaintProperty('radar-raster', 'raster-opacity', radarOpacity);
        }
      } else {
        if (map.getLayer('radar-raster')) {
          map.removeLayer('radar-raster');
        }
        if (map.getSource('rainviewer-radar')) {
          map.removeSource('rainviewer-radar');
        }

        map.addSource('rainviewer-radar', {
          type: 'raster',
          tiles: [radarTileUrl],
          tileSize: 256,
          maxzoom: 7,
        });

        const beforeLayerId = map.getLayer('aeroloom-aircraft-shadows')
          ? 'aeroloom-aircraft-shadows'
          : undefined;

        map.addLayer(
          {
            id: 'radar-raster',
            type: 'raster',
            source: 'rainviewer-radar',
            layout: {
              visibility: 'visible',
            },
            paint: {
              'raster-opacity': radarOpacity,
              'raster-fade-duration': 0,
            },
          },
          beforeLayerId
        );
      }
    } catch (err) {
      console.warn('Radar layer update notice:', err);
    }
  }, [layers.terminator, layers.radar, radarTileUrl, radarOpacity]);

  // 3. Update Selected Trail Line GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;

    const trailSource = map.getSource('selected-trail') as GeoJSONSource;
    if (!trailSource) return;

    if (selectedTrail.length < 2) {
      trailSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const coordinates = selectedTrail.map((pt) => [pt.longitude, pt.latitude]);
    trailSource.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {},
        },
      ],
    });
  }, [selectedTrail]);

  // 4. Center Camera on Selected Aircraft
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedAircraftId) return;

    const ac = interpolator.get(selectedAircraftId);
    if (ac) {
      map.easeTo({
        center: [ac.raw.lon, ac.raw.lat],
        duration: 800,
        padding: { right: window.innerWidth > 768 ? 420 : 0 },
      });
    }
  }, [selectedAircraftId, interpolator]);

  // 5. 60 FPS Dead-Reckoning RAF Loop
  useEffect(() => {
    let active = true;

    const loop = (timestamp: number) => {
      if (!active) return;

      const map = mapRef.current;
      if (map && isMapLoadedRef.current) {
        const aircraftSource = map.getSource('aircraft') as GeoJSONSource;
        const shadowSource = map.getSource('aircraft-shadow') as GeoJSONSource;

        if (aircraftSource && shadowSource) {
          interpolator.step(timestamp, (renderedList: RenderedAircraft[]) => {
            const currentFilters = filtersRef.current;
            const currentSelectedId = selectedIdRef.current;
            const currentFollow = isFollowModeRef.current;

            // Filter aircraft based on UI settings
            const filtered = renderedList.filter((item) => {
              const ac = item.raw;
              // Ground filter
              if (!currentFilters.showGround && ac.onGround) return false;

              // Category filter
              const category = mapTypeCodeToCategory(ac.typeCode);
              if (currentFilters.category !== 'all' && category !== currentFilters.category) return false;

              // Altitude filter
              const alt = ac.altitudeFt ?? 0;
              if (currentFilters.altitude === 'low' && alt >= 10000) return false;
              if (currentFilters.altitude === 'med' && (alt < 10000 || alt > 25000)) return false;
              if (currentFilters.altitude === 'high' && alt <= 25000) return false;

              return true;
            });

            // Build GeoJSON features for aircraft
            const aircraftFeatures: GeoJSON.Feature[] = [];
            const shadowFeatures: GeoJSON.Feature[] = [];

            filtered.forEach((item) => {
              const ac = item.raw;
              const category = mapTypeCodeToCategory(ac.typeCode);
              const spriteId = getAircraftSpriteId(category, item.state);

              aircraftFeatures.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [item.currentLng, item.currentLat],
                },
                properties: {
                  id: item.id,
                  callsign: ac.callsign || ac.id.toUpperCase(),
                  bearing: item.currentTrack,
                  iconImage: spriteId,
                  altitudeFt: ac.altitudeFt,
                  speedKt: ac.groundSpeedKt,
                  typeCode: ac.typeCode || 'UNKNOWN',
                },
              });

              // Ground shadow offset by altitude (scale: 35,000 ft = ~0.02 deg offset)
              const shadowSpriteId = getAircraftSpriteId(category, 'ground_shadow');
              const alt = ac.altitudeFt || 0;
              const offset = Math.min(0.025, (alt / 35000) * 0.015);

              shadowFeatures.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [item.currentLng + offset, item.currentLat - offset],
                },
                properties: {
                  id: `${item.id}-shadow`,
                  bearing: item.currentTrack,
                  iconImage: shadowSpriteId,
                },
              });

              // Camera follow lock
              if (currentFollow && currentSelectedId === item.id) {
                map.easeTo({
                  center: [item.currentLng, item.currentLat],
                  duration: 0, // Direct lock
                });
              }
            });

            aircraftSource.setData({
              type: 'FeatureCollection',
              features: aircraftFeatures,
            });

            shadowSource.setData({
              type: 'FeatureCollection',
              features: shadowFeatures,
            });
          });
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [interpolator]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#F6F4EE] ${className}`}>
      {/* MapLibre WebGL Canvas Container over paper background */}
      <div ref={containerRef} className="w-full h-full bg-[#F6F4EE]" />

      {/* Basemap unavailable notice with retry indicator */}
      {basemapUnavailable && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="px-3 py-1.5 rounded-[var(--r-sm)] bg-[var(--surface)]/95 backdrop-blur-sm border border-[var(--line)] shadow-[var(--sh-1)] flex items-center gap-2 font-mono text-xs text-[var(--ink-2)]">
            <span className="w-2 h-2 rounded-full bg-[var(--warn)] animate-pulse" />
            <span>Basemap unavailable, retrying...</span>
          </div>
        </div>
      )}

      {/* High-Precision Floating Hover Tag */}
      <MapHoverTag
        aircraft={hoveredAircraft}
        x={hoverPos.x}
        y={hoverPos.y}
        visible={Boolean(hoveredAircraft)}
      />

      {/* Tasteful Custom Basemap Attribution */}
      <div className="absolute bottom-2 left-4 md:left-20 z-10 pointer-events-none select-none">
        <div className="bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-[var(--ink-4)] border border-[var(--line)]">
          Map © OpenFreeMap · Data © OpenStreetMap · Telemetry © Airplanes.live
        </div>
      </div>
    </div>
  );
}
