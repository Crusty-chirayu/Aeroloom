'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';

interface AltitudeStratum {
  label: string;
  color: string;
  altitudeRange: string;
}

const ALTITUDE_STRATA: AltitudeStratum[] = [
  { label: 'FL380+', color: '#FF4F1F', altitudeRange: '38,000+ FT' },
  { label: 'FL300–380', color: '#EA580C', altitudeRange: '30,000–38,000 FT' },
  { label: 'FL200–300', color: '#0284C7', altitudeRange: '20,000–30,000 FT' },
  { label: 'FL100–200', color: '#16A34A', altitudeRange: '10,000–20,000 FT' },
  { label: 'SURFACE–FL100', color: '#878D96', altitudeRange: '0–10,000 FT' },
];

const SEARCH_QUERIES = ['DLH400', 'KJFK', 'Airbus A380', 'BAW178', 'Bengaluru'];

export function CapabilitiesBento() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);

  // Animated search typing simulator
  const [typedText, setTypedText] = useState('');
  const [queryIdx, setQueryIdx] = useState(0);

  // Animated aircraft marker position in Tile 1
  const [miniPlanePos, setMiniPlanePos] = useState({ x: 20, y: 55, heading: 45 });

  // Animated vertical rate dial in Tile 3
  const [vrate, setVrate] = useState(1850);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Search typing loop
  useEffect(() => {
    if (!isInView) return;
    let charIdx = 0;
    let isDeleting = false;
    const currentWord = SEARCH_QUERIES[queryIdx];

    const interval = setInterval(() => {
      if (!isDeleting) {
        setTypedText(currentWord.slice(0, charIdx + 1));
        charIdx++;
        if (charIdx === currentWord.length) {
          isDeleting = true;
          clearInterval(interval);
          setTimeout(() => {
            // Re-arm for delete after pause
            const delInterval = setInterval(() => {
              if (charIdx > 0) {
                setTypedText(currentWord.slice(0, charIdx - 1));
                charIdx--;
              } else {
                clearInterval(delInterval);
                setQueryIdx((prev) => (prev + 1) % SEARCH_QUERIES.length);
              }
            }, 50);
          }, 1800);
        }
      }
    }, 110);

    return () => clearInterval(interval);
  }, [queryIdx, isInView]);

  // Mini plane movement loop in Tile 1
  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(() => {
      setMiniPlanePos((prev) => {
        let nx = prev.x + 1.2;
        let ny = prev.y - 0.7;
        if (nx > 85 || ny < 15) {
          nx = 15;
          ny = 75;
        }
        return { x: nx, y: ny, heading: 45 };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isInView]);

  // Vrate oscillation in Tile 3
  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(() => {
      setVrate((prev) => {
        const delta = (Math.random() - 0.48) * 120;
        return Math.round(Math.max(1200, Math.min(2600, prev + delta)));
      });
    }, 600);
    return () => clearInterval(timer);
  }, [isInView]);

  return (
    <section
      ref={containerRef}
      className="py-24 px-6 sm:px-12 max-w-[1360px] mx-auto border-t border-[var(--line)] space-y-12"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Chip variant="signal">Live Capabilities</Chip>
            <span className="mono-label text-[11px] text-[var(--ink-2)]">
              ZERO SCREENSHOTS · LIVE HARDWARE-ACCELERATED
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Engineered for Airspace Observability
          </h2>
          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            Every component in Aeroloom is rendered natively from real ADS-B telemetry streams with sub-pixel cartography, mathematical dead reckoning, and honest data states.
          </p>
        </div>

        <Link href="/map" className="shrink-0">
          <span className="font-mono text-xs font-semibold text-[var(--signal)] hover:underline inline-flex items-center gap-1.5">
            Launch live observatory <Icon name="arrow-right" size={14} />
          </span>
        </Link>
      </div>

      {/* 12-Column Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Tile 1 (4-col): Mini Radar Map with Live Moving Aircraft */}
        <div className="md:col-span-4 p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] flex flex-col justify-between space-y-6 hover:-translate-y-0.5 hover:shadow-[var(--sh-2)] transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
              <span className="mono-label text-[10px] text-[var(--ink-2)]">RADAR SWEEP ENGINE</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--ink-3)]">60 FPS GLIDE</span>
          </div>

          {/* Mini Radar Visualizer */}
          <div className="relative w-full aspect-[4/3] rounded-[var(--r-md)] bg-[var(--paper)] border border-[var(--line)] overflow-hidden">
            {/* Range rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-3/4 rounded-full border border-[var(--line-strong)] opacity-40" />
              <div className="w-1/2 h-1/2 rounded-full border border-[var(--line-strong)] opacity-40" />
              <div className="w-1/4 h-1/4 rounded-full border border-[var(--line-strong)] opacity-40" />
              {/* Radar sweep beam */}
              <div className="absolute inset-0 border-t border-[var(--signal)]/30 rotate-45" />
            </div>

            {/* Static Waypoints */}
            <div className="absolute top-4 left-6 text-[8px] font-mono text-[var(--ink-4)]">WAYPOINT BEDEK</div>
            <div className="absolute bottom-4 right-6 text-[8px] font-mono text-[var(--ink-4)]">TERMINAL TMA</div>

            {/* Moving Aircraft Marker */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-100 text-[var(--signal)] fill-current"
              style={{ left: `${miniPlanePos.x}%`, top: `${miniPlanePos.y}%` }}
            >
              <div className="relative">
                <svg
                  viewBox="0 0 64 64"
                  width="22"
                  height="22"
                  style={{ transform: `rotate(${miniPlanePos.heading}deg)` }}
                >
                  <path d={SILHOUETTES['narrowbody'].bodyPath} />
                </svg>
                {/* Callsign tag */}
                <div className="absolute left-6 top-0 font-mono text-[9px] font-bold text-[var(--ink)] bg-[var(--surface)] px-1 rounded border border-[var(--line)] shadow-xs whitespace-nowrap">
                  DLH400 · FL340
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
              Continuous Dead Reckoning
            </h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Aircraft calculate vector velocity between transponder packets, gliding seamlessly across the canvas without server polling stutters.
            </p>
          </div>
        </div>

        {/* Tile 2 (4-col): Rolling Altitude Ramp & Color Strata */}
        <div className="md:col-span-4 p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] flex flex-col justify-between space-y-6 hover:-translate-y-0.5 hover:shadow-[var(--sh-2)] transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="altitude" size={14} className="text-[var(--ink-3)]" />
              <span className="mono-label text-[10px] text-[var(--ink-2)]">HYPSOMETRIC RAMP</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--ok)] font-semibold">10 STRATA</span>
          </div>

          {/* Altitude Strata Stack */}
          <div className="space-y-1.5 p-3 rounded-[var(--r-md)] bg-[var(--paper)] border border-[var(--line)] font-mono text-xs">
            {ALTITUDE_STRATA.slice(0, 5).map((stratum, idx) => (
              <div
                key={stratum.label}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: stratum.color }}
                  />
                  <span className="font-bold text-[var(--ink)]">{stratum.label}</span>
                </div>
                <span className="text-[var(--ink-3)] text-[10px]">
                  {stratum.altitudeRange}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
              Curated Optical Altitude Strata
            </h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Ten scientifically graded warm-paper tint swatches map vertical airspace corridors from ground taxi to transoceanic cruising altitudes.
            </p>
          </div>
        </div>

        {/* Tile 3 (4-col): Precision Vertical-Rate Dial */}
        <div className="md:col-span-4 p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] flex flex-col justify-between space-y-6 hover:-translate-y-0.5 hover:shadow-[var(--sh-2)] transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="vertical-rate-up" size={14} className="text-[var(--signal)]" />
              <span className="mono-label text-[10px] text-[var(--ink-2)]">VARIOMETER TELEMETRY</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--signal)] font-bold">CLIMBING</span>
          </div>

          {/* Variometer Dial Graphic */}
          <div className="p-4 rounded-[var(--r-md)] bg-[var(--paper)] border border-[var(--line)] flex flex-col items-center justify-center space-y-3">
            <div className="relative w-28 h-28 rounded-full border-2 border-[var(--line-strong)] bg-[var(--surface)] flex flex-col items-center justify-center shadow-inner">
              <span className="text-[8px] font-mono text-[var(--ink-4)] absolute top-2">UP</span>
              <span className="text-[8px] font-mono text-[var(--ink-4)] absolute bottom-2">DN</span>

              {/* Ticking rate number */}
              <div className="text-center">
                <span className="font-mono text-xl font-bold text-[var(--ink)] tabular-nums block">
                  +{vrate}
                </span>
                <span className="text-[9px] font-mono text-[var(--ink-3)]">FT / MIN</span>
              </div>

              {/* Arrow needle */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300"
                style={{ transform: `rotate(${(vrate / 3000) * 60 - 30}deg)` }}
              >
                <div className="w-1 h-10 bg-[var(--signal)] rounded-full -translate-y-4" />
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-mono text-[var(--ink-3)]">
              <span>ZERO DRIFT: ±0 FPM</span>
              <span>·</span>
              <span>SMOOTHED: 600ms</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
              Instantaneous Vertical Velocity
            </h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Barometric pressure differentials and Mode-S altimetry calculate instantaneous climb and descent rates with true vertical rate glyphs.
            </p>
          </div>
        </div>

        {/* Tile 4 (6-col): Airport Terminal Departures Board */}
        <div className="md:col-span-6 p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] flex flex-col justify-between space-y-6 hover:-translate-y-0.5 hover:shadow-[var(--sh-2)] transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="tower" size={14} className="text-[var(--ink)]" />
              <span className="mono-label text-[10px] text-[var(--ink-2)]">AERODROME TELETYPE</span>
            </div>
            <Link href="/airports" className="text-[10px] font-mono text-[var(--signal)] hover:underline">
              ALL AIRPORTS →
            </Link>
          </div>

          {/* Departures Board Ticker Table */}
          <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] overflow-hidden">
            <div className="grid grid-cols-12 px-3 py-2 bg-[var(--surface)] border-b border-[var(--line)] text-[9px] font-mono text-[var(--ink-3)] font-bold tracking-wider">
              <span className="col-span-3">FLIGHT</span>
              <span className="col-span-4">DESTINATION</span>
              <span className="col-span-2">GATE</span>
              <span className="col-span-3 text-right">STATUS</span>
            </div>
            <div className="divide-y divide-[var(--line)] text-xs font-mono">
              <div className="grid grid-cols-12 px-3 py-2 items-center hover:bg-[var(--surface)] transition-colors">
                <span className="col-span-3 font-bold text-[var(--ink)]">BAW178</span>
                <span className="col-span-4 text-[var(--ink-2)]">LHR → JFK</span>
                <span className="col-span-2 text-[var(--ink-3)]">B24</span>
                <span className="col-span-3 text-right font-semibold text-[var(--ok)]">AIRBORNE</span>
              </div>
              <div className="grid grid-cols-12 px-3 py-2 items-center hover:bg-[var(--surface)] transition-colors">
                <span className="col-span-3 font-bold text-[var(--ink)]">AIC101</span>
                <span className="col-span-4 text-[var(--ink-2)]">DEL → JFK</span>
                <span className="col-span-2 text-[var(--ink-3)]">T3</span>
                <span className="col-span-3 text-right font-semibold text-[var(--signal)]">CRUISING</span>
              </div>
              <div className="grid grid-cols-12 px-3 py-2 items-center hover:bg-[var(--surface)] transition-colors">
                <span className="col-span-3 font-bold text-[var(--ink)]">SIA317</span>
                <span className="col-span-4 text-[var(--ink-2)]">LHR → SIN</span>
                <span className="col-span-2 text-[var(--ink-3)]">A12</span>
                <span className="col-span-3 text-right font-semibold text-[var(--sky)]">DESCENT</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
              Terminal Movements &amp; METAR
            </h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Real 30 NM Terminal Maneuvering Area (TMA) radar coverage paired with NOAA plain-language decoded weather reports.
            </p>
          </div>
        </div>

        {/* Tile 5 (3-col): Interactive Omnisearch Simulator */}
        <div className="md:col-span-3 p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] flex flex-col justify-between space-y-6 hover:-translate-y-0.5 hover:shadow-[var(--sh-2)] transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="mono-label text-[10px] text-[var(--ink-2)]">OMNISEARCH INDEX</span>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-3)]">
              ⌘K
            </kbd>
          </div>

          {/* Typing Search Simulator */}
          <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--paper)] border border-[var(--line)] space-y-3">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded bg-[var(--surface)] border border-[var(--line-strong)]">
              <Icon name="search" size={14} className="text-[var(--signal)] shrink-0" />
              <div className="font-mono text-xs text-[var(--ink)] flex items-center min-h-[18px]">
                <span>{typedText}</span>
                <span className="w-1.5 h-3.5 bg-[var(--signal)] ml-0.5 animate-pulse" />
              </div>
            </div>

            <div className="text-[10px] font-mono text-[var(--ink-3)] space-y-1">
              <div className="flex justify-between">
                <span>INDEX MATCH</span>
                <span className="text-[var(--ok)]">VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span>QUERY LATENCY</span>
                <span>&lt; 20ms</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
              Tri-Entity Resolver
            </h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Instant search across active flights, IATA/ICAO aerodromes, and global airline operators.
            </p>
          </div>
        </div>

        {/* Tile 6 (3-col): Airspace Safety & Squawk Guard */}
        <div className="md:col-span-3 p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] flex flex-col justify-between space-y-6 hover:-translate-y-0.5 hover:shadow-[var(--sh-2)] transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="mono-label text-[10px] text-[var(--ink-2)]">SQUAWK TELEMETRY</span>
            <Chip variant="ok" dot>Normal</Chip>
          </div>

          {/* Transponder Octal Squawk Card */}
          <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--paper)] border border-[var(--line)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[9px] text-[var(--ink-3)]">ASSIGNED TRANSPONDER</span>
              <span className="font-mono text-xs font-bold text-[var(--ink)]">OCTAL MODE-A</span>
            </div>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--line)] text-center">
              <span className="font-mono text-2xl font-bold tracking-widest text-[var(--ink)]">
                1200
              </span>
              <span className="block text-[8px] font-mono text-[var(--ink-3)] mt-0.5">
                VFR STANDARD CONUS SQUAWK
              </span>
            </div>
            <div className="text-[9px] font-mono text-[var(--bad)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
              <span className="text-[var(--ink-3)]">EMERGENCY MONITOR: 7700/7600 ARMED</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
              Airspace Safety Guard
            </h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Automated classification of emergency transponder codes with zero false alarms.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
