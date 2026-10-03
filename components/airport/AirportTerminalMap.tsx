'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { createAeroloomMapStyle } from '@/lib/map/mapStyle';
import type { AircraftState, AirportInfo } from '@/lib/providers/types';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';
import { getAircraftCategory } from '@/lib/map/typeMapping';

interface AirportTerminalMapProps {
  airport: AirportInfo;
  aircraft: AircraftState[];
  className?: string;
}

export function AirportTerminalMap({
  airport,
  aircraft = [],
  className = '',
}: AirportTerminalMapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Array<{ remove: () => void }>>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    async function initAirportMap() {
      try {
        const maplibre = await import('maplibre-gl');
        if (!isMounted || !containerRef.current) return;

        maplibre.setWorkerUrl('/maplibre-gl-worker.mjs');

        const map = new maplibre.Map({
          container: containerRef.current,
          style: createAeroloomMapStyle({
            showAirports: true,
            showDayNight: false,
            showRainViewer: false,
          }),
          center: [airport.longitude, airport.latitude],
          zoom: 9.5,
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

          // Add Airport Center Marker
          const aptEl = document.createElement('div');
          aptEl.className = 'airport-center-marker';
          aptEl.style.width = '24px';
          aptEl.style.height = '24px';
          aptEl.style.borderRadius = '50%';
          aptEl.style.backgroundColor = '#0E1116';
          aptEl.style.border = '2.5px solid #F6F4EE';
          aptEl.style.boxShadow = '0 2px 6px rgba(14, 17, 22, 0.3)';
          aptEl.style.display = 'flex';
          aptEl.style.alignItems = 'center';
          aptEl.style.justifyContent = 'center';
          aptEl.innerHTML = `
            <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #FF4F1F;"></div>
          `;

          new maplibre.Marker({ element: aptEl })
            .setLngLat([airport.longitude, airport.latitude])
            .addTo(map);

          // Add 30 NM Terminal Control Area ring
          const ringPoints = 64;
          const radiusKm = 30 * 1.852;
          const coords: [number, number][] = [];
          for (let i = 0; i <= ringPoints; i++) {
            const angle = (i / ringPoints) * (2 * Math.PI);
            const dLat = (radiusKm / 6371) * (180 / Math.PI);
            const dLon =
              ((radiusKm / 6371) * (180 / Math.PI)) /
              Math.cos((airport.latitude * Math.PI) / 180);
            coords.push([
              airport.longitude + dLon * Math.sin(angle),
              airport.latitude + dLat * Math.cos(angle),
            ]);
          }

          map.addSource('tma-boundary', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coords,
              },
            },
          });

          map.addLayer({
            id: 'tma-ring',
            type: 'line',
            source: 'tma-boundary',
            paint: {
              'line-color': '#0E1116',
              'line-width': 1.5,
              'line-dasharray': [4, 4],
              'line-opacity': 0.25,
            },
          });

          mapRef.current = map;
        });
      } catch (err) {
        console.warn('Failed to initialize airport terminal map:', err);
      }
    }

    initAirportMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [airport]);

  // Update live nearby aircraft markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import('maplibre-gl').then((maplibre) => {
      aircraft.forEach((ac) => {
        const cat = getAircraftCategory(ac.typeCode);
        const sil = SILHOUETTES[cat] || SILHOUETTES.narrowbody;

        const el = document.createElement('div');
        el.className = 'terminal-traffic-marker cursor-pointer';
        el.style.transform = `rotate(${(ac.trackDeg || 0) - 90}deg)`;
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.title = `${ac.callsign} (${ac.altitudeFt} ft, ${ac.groundSpeedKt} kt)`;

        el.innerHTML = `
          <svg viewBox="0 0 64 64" width="20" height="20" style="fill: ${ac.onGround ? '#707070' : '#0E1116'}; filter: drop-shadow(0 1px 2px rgba(14,17,22,0.15));">
            <path d="${sil.bodyPath}" />
          </svg>
        `;

        el.onclick = () => {
          router.push(`/flight/${ac.callsign.toLowerCase()}`);
        };

        const marker = new maplibre.Marker({ element: el })
          .setLngLat([ac.lon, ac.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    });
  }, [aircraft, isLoaded, router]);

  return (
    <div
      className={`relative w-full h-[320px] md:h-[400px] rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper-2)] overflow-hidden ${className}`}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* Terminal Radar HUD Tag */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-sm)] bg-[var(--paper)]/90 backdrop-blur-sm border border-[var(--line)] shadow-sm font-mono text-[11px] text-[var(--ink)]">
        <span className="w-2 h-2 rounded-full bg-[var(--signal)]" />
        <span className="font-bold">{airport.icao} TERMINAL RADAR</span>
        <span className="text-[var(--ink-3)]">·</span>
        <span className="text-[var(--ink-2)]">30 NM TMA</span>
      </div>

      <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--paper)]/85 backdrop-blur-sm border border-[var(--line)] font-mono text-[10px] text-[var(--ink-3)]">
        {aircraft.length} TRANSPONDER CONTACTS IN SECTOR
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[var(--paper-2)] text-[var(--ink-3)] font-mono text-xs">
          INITIALIZING TERMINAL CONTROL RADAR...
        </div>
      )}
    </div>
  );
}
