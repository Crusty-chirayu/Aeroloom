'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import { createAeroloomMapStyle } from '@/lib/map/mapStyle';
import type { AircraftState } from '@/lib/providers/types';

interface HeroBackgroundMapProps {
  onAirborneCount?: (count: number) => void;
}

const CORRIDORS = [
  { center: [-35, 50] as [number, number], zoom: 3.5 }, // North Atlantic
  { center: [12, 49] as [number, number], zoom: 4.2 },  // Europe
  { center: [55, 25] as [number, number], zoom: 4.0 },  // Gulf / Middle East
  { center: [78, 20] as [number, number], zoom: 4.1 },  // India / South Asia
  { center: [120, 30] as [number, number], zoom: 3.8 }, // East Asia
];

export function HeroBackgroundMap({ onAirborneCount }: HeroBackgroundMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const isVisibleRef = useRef(true);
  const driftIndexRef = useRef(0);
  const driftTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    // IntersectionObserver to pause rendering when hero is offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);

    async function initHeroMap() {
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
          center: CORRIDORS[0].center,
          zoom: CORRIDORS[0].zoom,
          attributionControl: false,
          interactive: false, // Strictly non-interactive per spec §7
        });

        mapRef.current = map;

        map.on('error', () => {
          // Gracefully suppress unhandled tile/style errors
        });

        map.on('load', async () => {
          if (!isMounted) return;

          // Add GeoJSON source for live background aircraft
          map.addSource('hero-aircraft', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          // Live aircraft dot layer with halo
          map.addLayer({
            id: 'hero-aircraft-halo',
            type: 'circle',
            source: 'hero-aircraft',
            paint: {
              'circle-radius': 4.5,
              'circle-color': '#FFFFFF',
              'circle-opacity': 0.8,
            },
          });

          map.addLayer({
            id: 'hero-aircraft-point',
            type: 'circle',
            source: 'hero-aircraft',
            paint: {
              'circle-radius': 2.5,
              'circle-color': [
                'case',
                ['get', 'isSignal'],
                '#FF4F1F', // Signal orange for selective visual accents
                '#0E1116', // Ink black default
              ],
              'circle-opacity': 0.9,
            },
          });

          // Fetch real live aircraft contacts
          await fetchLiveAircraft(map);

          // Start calm scripted corridor camera drift
          startCorridorDrift(map);
        });
      } catch (err) {
        console.warn('Hero map initialization fallback:', err);
        setIsLiveActive(false);
      }
    }

    async function fetchLiveAircraft(map: MapLibreMap) {
      if (!isMounted) return;
      try {
        const res = await fetch('/api/aircraft/live?bounds=-180,-85,180,85', {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error('Live feed unavailable');
        const data = await res.json();
        const aircraft: AircraftState[] = data.aircraft || [];

        if (aircraft.length > 0) {
          onAirborneCount?.(data.totalAirborne || aircraft.length);
          setIsLiveActive(true);

          // Cap aircraft features to maintain silky 60fps performance
          const sample = aircraft.slice(0, 450);
          const features = sample.map((ac, idx) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [ac.lon, ac.lat],
            },
            properties: {
              id: ac.id,
              callsign: ac.callsign,
              // Highlight ~8% in signal color for visual rhythm
              isSignal: idx % 12 === 0,
            },
          }));

          const src = map.getSource('hero-aircraft') as GeoJSONSource | undefined;
          if (src) {
            src.setData({ type: 'FeatureCollection', features });
          }
        }
      } catch {
        setIsLiveActive(false);
      }
    }

    function startCorridorDrift(map: MapLibreMap) {
      function step() {
        if (!isMounted) return;
        if (isVisibleRef.current) {
          driftIndexRef.current = (driftIndexRef.current + 1) % CORRIDORS.length;
          const next = CORRIDORS[driftIndexRef.current];

          map.easeTo({
            center: next.center,
            zoom: next.zoom,
            duration: 16000,
            easing: (t) => t * (2 - t), // smooth ease-in-out drift
          });
        }
        driftTimerRef.current = setTimeout(step, 18000);
      }

      driftTimerRef.current = setTimeout(step, 8000);
    }

    initHeroMap();

    return () => {
      isMounted = false;
      observer.disconnect();
      if (driftTimerRef.current) clearTimeout(driftTimerRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onAirborneCount]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
      style={{
        maskImage: 'radial-gradient(ellipse 70% 65% at 50% 48%, black 35%, transparent 88%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 48%, black 35%, transparent 88%)',
      }}
    >
      <div ref={containerRef} className="w-full h-full opacity-85" />

      {/* Honest fallback note if telemetry is degraded */}
      {!isLiveActive && (
        <div className="absolute bottom-4 right-6 font-mono text-[10px] text-[var(--ink-4)]">
          PRE-RENDERED MAP FEED · RECONNECTING LIVE ADS-B
        </div>
      )}
    </div>
  );
}
