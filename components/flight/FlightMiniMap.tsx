'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { createAeroloomMapStyle } from '@/lib/map/mapStyle';
import type { TrackPoint } from '@/lib/providers/types';
import type { AircraftCategory } from '@/lib/map/silhouettes/types';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';

interface FlightMiniMapProps {
  lat: number;
  lon: number;
  trackDeg?: number;
  category?: AircraftCategory;
  trackPoints?: TrackPoint[];
  callsign?: string;
  className?: string;
}

export function FlightMiniMap({
  lat,
  lon,
  trackDeg = 0,
  category = 'narrowbody',
  trackPoints = [],
  callsign = 'FLIGHT',
  className = '',
}: FlightMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    async function initMiniMap() {
      try {
        const maplibre = await import('maplibre-gl');
        if (!isMounted || !containerRef.current) return;

        // Set static worker url to avoid CSP/blob security restrictions
        maplibre.setWorkerUrl('/maplibre-gl-worker.mjs');

        const map = new maplibre.Map({
          container: containerRef.current,
          style: createAeroloomMapStyle({
            showAirports: true,
            showDayNight: false,
            showRainViewer: false,
          }),
          center: [lon, lat],
          zoom: 7,
          attributionControl: false,
          interactive: true,
        });

        map.addControl(
          new maplibre.AttributionControl({
            compact: true,
            customAttribution: '© OpenFreeMap © OpenStreetMap',
          }),
          'bottom-right'
        );

        map.on('error', () => {
          // Gracefully suppress unhandled tile/style errors
        });

        map.on('load', () => {
          if (!isMounted) return;
          setIsLoaded(true);

          // Add historical track polyline if available
          if (trackPoints.length > 1) {
            const coordinates = trackPoints.map((p) => [p.lon, p.lat]);
            map.addSource('flight-track', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates,
                },
              },
            });

            map.addLayer({
              id: 'flight-track-line',
              type: 'line',
              source: 'flight-track',
              paint: {
                'line-color': '#FF4F1F',
                'line-width': 3,
                'line-opacity': 0.8,
              },
            });

            // Fit bounds to track if points span a distance
            try {
              const bounds = new maplibre.LngLatBounds();
              coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
              bounds.extend([lon, lat]);
              map.fitBounds(bounds, { padding: 40, maxZoom: 10, duration: 0 });
            } catch {
              // Ignore fit error
            }
          }

          // Add HTML marker for the aircraft position
          const el = document.createElement('div');
          el.className = 'flight-minimap-marker';
          el.style.width = '36px';
          el.style.height = '36px';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.transform = `rotate(${trackDeg}deg)`;

          const silPath = SILHOUETTES[category]?.bodyPath || SILHOUETTES.narrowbody.bodyPath;

          el.innerHTML = `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 79, 31, 0.15); border: 1.5px solid #FF4F1F;"></div>
              <svg viewBox="0 0 64 64" width="24" height="24" style="fill: #0E1116; position: relative; z-index: 2;">
                <path d="${silPath}" />
              </svg>
            </div>
          `;

          new maplibre.Marker({ element: el })
            .setLngLat([lon, lat])
            .addTo(map);
        });

        mapRef.current = map;
      } catch (err) {
        console.warn('Failed to initialize flight mini-map:', err);
      }
    }

    initMiniMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, trackDeg, category, trackPoints]);

  return (
    <div
      className={`relative w-full h-[260px] sm:h-[320px] rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper-2)] overflow-hidden ${className}`}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* Mini status overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--paper)]/90 backdrop-blur-sm border border-[var(--line)] shadow-sm font-mono text-[11px] text-[var(--ink)]">
        <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
        <span className="font-semibold">{callsign}</span>
        <span className="text-[var(--ink-3)]">·</span>
        <span className="text-[var(--ink-2)]">{lat.toFixed(3)}°, {lon.toFixed(3)}°</span>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[var(--paper-2)] text-[var(--ink-3)] font-mono text-xs">
          ACQUIRING CARTOGRAPHY SECTOR...
        </div>
      )}
    </div>
  );
}
