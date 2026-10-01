'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';
import { AircraftBlueprint } from '@/components/aircraft/AircraftBlueprint';
import { FlightMiniMap } from '@/components/flight/FlightMiniMap';
import { FlightProfileCharts } from '@/components/flight/FlightProfileCharts';
import { getAircraftCategory } from '@/lib/map/typeMapping';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';
import type { AircraftState, TrackPoint, AirportInfo } from '@/lib/providers/types';

interface FlightPageProps {
  params: Promise<{
    flightId: string;
  }>;
}

export default function FlightDetailPage({ params }: FlightPageProps) {
  const resolvedParams = use(params);
  const flightId = (resolvedParams.flightId || '').toUpperCase();

  const [aircraft, setAircraft] = useState<AircraftState | null>(null);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Fetch flight telemetry & track
  const fetchFlightData = useCallback(async () => {
    try {
      // 1. Fetch live or recent state
      const res = await fetch(`/api/aircraft/${flightId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.aircraft) {
          setAircraft(data.aircraft);
          setErrorStatus(null);
        } else {
          setErrorStatus('not_found');
        }
      } else {
        setErrorStatus('not_found');
      }

      // 2. Fetch track breadcrumbs
      const trackRes = await fetch(`/api/aircraft/${flightId}/track`);
      if (trackRes.ok) {
        const trackData = await trackRes.json();
        if (trackData.success && Array.isArray(trackData.track)) {
          setTrackPoints(trackData.track);
        }
      }
    } catch {
      setErrorStatus('offline');
    } finally {
      setIsLoading(false);
    }
  }, [flightId]);

  useEffect(() => {
    document.title = `Flight ${flightId} Dossier · Aeroloom`;
    const timer = setTimeout(() => {
      fetchFlightData();
    }, 0);
    const interval = setInterval(fetchFlightData, 8000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchFlightData, flightId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const category = aircraft ? getAircraftCategory(aircraft.typeCode) : 'narrowbody';
  const silDef = SILHOUETTES[category] || SILHOUETTES.narrowbody;

  // Render Designed Not Airborne / Not Found State
  if (!isLoading && (errorStatus === 'not_found' || !aircraft)) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between p-6 md:p-12 max-w-[1360px] mx-auto">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <Link href="/map">
            <Button variant="ghost" size="sm" icon="arrow-left">
              Return to Live Radar
            </Button>
          </Link>
          <span className="mono-label text-[11px] text-[var(--ink-3)]">
            TRANSPONDER CONTACT ARCHIVE
          </span>
        </header>

        <main className="py-16 max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--paper-2)] border border-[var(--line)] mx-auto mb-2 text-[var(--ink-3)]">
            <svg viewBox="0 0 64 64" width="36" height="36" className="fill-current opacity-40">
              <path d={SILHOUETTES.unknown.bodyPath} />
            </svg>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Chip variant="neutral" dot>Status: Not Active</Chip>
            <Chip variant="sky">{flightId}</Chip>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl text-[var(--ink)] tracking-tight">
            Airframe <span className="italic font-normal">{flightId}</span> is not currently airborne.
          </h1>

          <p className="text-base text-[var(--ink-2)] leading-relaxed max-w-lg mx-auto">
            No live ADS-B Mode-S transponder returns were received in the current reception cycle. The flight may have landed, not yet departed, or be cruising outside feeder receiver coverage.
          </p>

          <Panel variant="surface" radius="md" padding="md" className="text-left space-y-3 max-w-md mx-auto">
            <span className="mono-label text-[11px] text-[var(--ink-3)] block border-b border-[var(--line)] pb-2">
              RECOMMENDED AIRSPACE QUERIES
            </span>
            <div className="space-y-2 text-sm">
              <Link href="/map" className="flex items-center justify-between hover:text-[var(--signal)] transition-colors">
                <span className="font-sans font-medium">Browse Live Radar Map</span>
                <Icon name="arrow-right" size={14} />
              </Link>
              <Link href="/airports" className="flex items-center justify-between hover:text-[var(--signal)] transition-colors">
                <span className="font-sans font-medium">Check Hub Airport Traffic</span>
                <Icon name="arrow-right" size={14} />
              </Link>
              <Link href="/search" className="flex items-center justify-between hover:text-[var(--signal)] transition-colors">
                <span className="font-sans font-medium">Summon Omnisearch (⌘K)</span>
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>

            <div className="pt-2 border-t border-[var(--line)]">
              <span className="mono-label text-[10px] text-[var(--ink-4)] block mb-1.5">
                SAMPLE ACTIVE AIRBORNE IDENTIFIERS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['DLH400', 'BAW178', 'UAE201', 'AFR006', 'SWA123'].map((code) => (
                  <Link
                    key={code}
                    href={`/flight/${code}`}
                    className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--paper-2)] hover:bg-[var(--signal-muted)] hover:text-[var(--signal)] border border-[var(--line)] transition-colors"
                  >
                    {code}
                  </Link>
                ))}
              </div>
            </div>
          </Panel>

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link href="/map">
              <Button variant="ink" size="md" icon="plane">
                Open Radar Map
              </Button>
            </Link>
            <Button variant="outline" size="md" onClick={() => fetchFlightData()} icon="refresh">
              Re-scan Transponder
            </Button>
          </div>
        </main>

        <footer className="border-t border-[var(--line)] pt-4 text-xs font-mono text-[var(--ink-3)] flex items-center justify-between">
          <span>IDENTIFIER: {flightId}</span>
          <span>AEROLOOM TELEMETRY ENGINE</span>
        </footer>
      </div>
    );
  }

  // Active Aircraft Data
  const getAirportCode = (apt?: string | AirportInfo): string => {
    if (!apt) return '';
    if (typeof apt === 'string') return apt;
    return apt.iata || apt.icao || apt.name || '';
  };

  const airlineName = typeof aircraft?.airline === 'object' && aircraft?.airline ? aircraft.airline.name : typeof aircraft?.airline === 'string' ? aircraft.airline : null;
  const hasRoute = !!(aircraft?.route?.origin && aircraft?.route?.destination);
  const originCode = getAirportCode(aircraft?.route?.origin) || 'ORIGIN';
  const destCode = getAirportCode(aircraft?.route?.destination) || 'DEST';

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* Editorial App Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/map" className="shrink-0">
              <Button variant="ghost" size="sm" icon="arrow-left">
                Radar
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif text-lg text-[var(--ink)]">Aeroloom</span>
              <span className="text-[var(--ink-4)] hidden sm:inline">/</span>
              <span className="mono-label text-[11px] text-[var(--ink-2)] hidden sm:inline">Dossier</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={isCopied ? 'check' : 'share'}
              onClick={handleCopyLink}
              className="hidden sm:inline-flex"
            >
              {isCopied ? 'Copied' : 'Share'}
            </Button>
            <Link href={`/map?lat=${aircraft?.lat || 0}&lng=${aircraft?.lon || 0}&z=9&flight=${aircraft?.id || flightId}`}>
              <Button variant="ink" size="sm" icon="plane">
                Radar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Dossier Content */}
      <main className="max-w-[1360px] mx-auto px-6 py-10 space-y-10">
        {/* Route & Ident Banner */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant={aircraft?.onGround ? 'neutral' : 'signal'} dot>
              {aircraft?.onGround ? 'SURFACE TAXI' : 'AIRBORNE CONTACT'}
            </Chip>
            {airlineName && <Chip variant="neutral">{airlineName}</Chip>}
            <Chip variant="sky">ICAO 24-BIT: {aircraft?.id.toUpperCase()}</Chip>
            {aircraft?.squawk && (
              <Chip
                variant={
                  aircraft.squawk === '7700' || aircraft.squawk === '7600'
                    ? 'bad'
                    : 'neutral'
                }
              >
                SQUAWK {aircraft.squawk}
              </Chip>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--line)] pb-8">
            <div>
              <div className="mono-label text-xs text-[var(--ink-3)] uppercase mb-1">
                {airlineName ? `${airlineName} · ` : ''}CALLSIGN IDENTIFIER
              </div>
              <h1 className="font-serif text-5xl md:text-7xl text-[var(--ink)] tracking-tight">
                {aircraft?.callsign || flightId}
              </h1>
              {hasRoute && (
                <p className="font-serif text-2xl md:text-3xl text-[var(--ink-2)] mt-2">
                  <span>{originCode}</span>
                  <span className="mx-3 text-[var(--signal)]">→</span>
                  <span>{destCode}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 font-mono text-sm text-[var(--ink-2)]">
              <div>
                <span className="mono-label text-[10px] text-[var(--ink-3)] block">LATITUDE / LONGITUDE</span>
                <span className="font-bold text-[var(--ink)] text-base">
                  {aircraft?.lat.toFixed(4)}°, {aircraft?.lon.toFixed(4)}°
                </span>
              </div>
              <div>
                <span className="mono-label text-[10px] text-[var(--ink-3)] block">SOURCE TELEMETRY</span>
                <span className="font-bold text-[var(--ink)] text-base capitalize">
                  {aircraft?.source || 'ADS-B Network'}
                </span>
              </div>
              <div>
                <span className="mono-label text-[10px] text-[var(--ink-3)] block">REFRESH CYCLE</span>
                <span className="font-bold text-[var(--ok)] text-base">
                  {aircraft?.ageSeconds !== undefined ? `${Math.round(aircraft.ageSeconds)}s ago` : 'Live'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Route Progress Bar */}
        <section className="bg-[var(--surface)] border border-[var(--line-strong)] rounded-[var(--r-lg)] p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-2)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--ink)]" />
              <span>{hasRoute ? originCode : 'DEPARTURE VECTOR'}</span>
            </div>
            <span className="mono-label text-[10px] text-[var(--ink-3)] tracking-wider">
              {hasRoute ? 'GREAT-CIRCLE ROUTE CORRIDOR' : 'TRANSPONDER HEADING VECTOR'}
            </span>
            <div className="flex items-center gap-2">
              <span>{hasRoute ? destCode : 'WAYPOINT DESTINATION'}</span>
              <span className="w-2 h-2 rounded-full bg-[var(--signal)]" />
            </div>
          </div>

          {/* Progress Track Line with Aircraft Silhouette */}
          <div className="relative w-full h-8 flex items-center">
            {/* Background line */}
            <div className="w-full h-1 bg-[var(--line-strong)] rounded-full" />
            {/* Active completed path */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--signal)] rounded-full"
              style={{ width: hasRoute ? '55%' : '65%' }}
            />
            {/* Positioned Aircraft Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
              style={{ left: hasRoute ? '55%' : '65%' }}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--paper)] border-2 border-[var(--signal)] shadow-md flex items-center justify-center text-[var(--ink)]">
                <svg
                  viewBox="0 0 64 64"
                  width="18"
                  height="18"
                  style={{ transform: `rotate(${(aircraft?.trackDeg || 90) - 90}deg)` }}
                  className="fill-current"
                >
                  <path d={silDef.bodyPath} />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] text-[var(--ink-3)]">
            <span>TRUE TRACK: {aircraft?.trackDeg}°</span>
            <span>GROUND SPEED: {aircraft?.groundSpeedKt} KT</span>
            <span>ALTITUDE: {aircraft?.altitudeFt.toLocaleString()} FT</span>
          </div>
        </section>

        {/* Telemetry Stat Grid (Mono Table) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Panel variant="surface" radius="md" padding="md" className="space-y-1">
            <span className="mono-label text-[10px] text-[var(--ink-3)] block">PRESSURE ALTITUDE</span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)] tabular-nums">
              {aircraft?.altitudeFt.toLocaleString()} <span className="text-xs font-normal text-[var(--ink-3)]">FT</span>
            </div>
            <span className="text-xs text-[var(--ink-2)] block font-mono">
              FL{Math.round((aircraft?.altitudeFt || 0) / 100)}
            </span>
          </Panel>

          <Panel variant="surface" radius="md" padding="md" className="space-y-1">
            <span className="mono-label text-[10px] text-[var(--ink-3)] block">GROUND SPEED</span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)] tabular-nums">
              {aircraft?.groundSpeedKt} <span className="text-xs font-normal text-[var(--ink-3)]">KT</span>
            </div>
            <span className="text-xs text-[var(--ink-2)] block font-mono">
              {Math.round((aircraft?.groundSpeedKt || 0) * 1.852)} KM/H
            </span>
          </Panel>

          <Panel variant="surface" radius="md" padding="md" className="space-y-1">
            <span className="mono-label text-[10px] text-[var(--ink-3)] block">VERTICAL RATE</span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)] tabular-nums flex items-center gap-1">
              <span>{aircraft?.verticalRateFpm !== undefined ? (aircraft.verticalRateFpm > 0 ? `+${aircraft.verticalRateFpm}` : aircraft.verticalRateFpm) : 0}</span>
              <span className="text-xs font-normal text-[var(--ink-3)]">FPM</span>
            </div>
            <span className="text-xs text-[var(--ink-2)] block font-mono">
              {aircraft?.verticalRateFpm && aircraft.verticalRateFpm > 100 ? 'CLIMBING' : aircraft?.verticalRateFpm && aircraft.verticalRateFpm < -100 ? 'DESCENDING' : 'LEVEL CRUISE'}
            </span>
          </Panel>

          <Panel variant="surface" radius="md" padding="md" className="space-y-1">
            <span className="mono-label text-[10px] text-[var(--ink-3)] block">MAGNETIC TRACK</span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)] tabular-nums">
              {aircraft?.trackDeg}°
            </div>
            <span className="text-xs text-[var(--ink-2)] block font-mono">
              HEADING VECTOR
            </span>
          </Panel>

          <Panel variant="surface" radius="md" padding="md" className="space-y-1">
            <span className="mono-label text-[10px] text-[var(--ink-3)] block">TRANSPONDER</span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--signal-ink)] tabular-nums">
              {aircraft?.squawk || 'AUTO'}
            </div>
            <span className="text-xs text-[var(--ink-2)] block font-mono">
              MODE 3/A SQUAWK
            </span>
          </Panel>

          <Panel variant="surface" radius="md" padding="md" className="space-y-1">
            <span className="mono-label text-[10px] text-[var(--ink-3)] block">CATEGORY TYPE</span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)] uppercase">
              {aircraft?.typeCode || category.slice(0, 4)}
            </div>
            <span className="text-xs text-[var(--ink-2)] block font-mono capitalize truncate">
              {category}
            </span>
          </Panel>
        </section>

        {/* Dual Section: Altitude/Speed Time-Series & Embedded Mini-Map */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SVG Flight Profile */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[11px] text-[var(--ink-3)]">
                FLIGHT LEVEL PROFILE &amp; VELOCITY
              </span>
              <span className="text-xs font-mono text-[var(--ink-2)]">
                DRAW-IN TRAJECTORY
              </span>
            </div>
            <FlightProfileCharts
              trackPoints={trackPoints}
              currentAltitude={aircraft?.altitudeFt || 30000}
              currentSpeed={aircraft?.groundSpeedKt || 450}
            />
          </div>

          {/* Embedded Mini Radar Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[11px] text-[var(--ink-3)]">
                SECTOR TACTICAL RADAR
              </span>
              <span className="text-xs font-mono text-[var(--ink-2)]">
                {trackPoints.length > 0 ? `${trackPoints.length} BREADCRUMBS` : 'LIVE POSITION'}
              </span>
            </div>
            {aircraft && (
              <FlightMiniMap
                lat={aircraft.lat}
                lon={aircraft.lon}
                trackDeg={aircraft.trackDeg}
                category={category}
                trackPoints={trackPoints}
                callsign={aircraft.callsign || flightId}
              />
            )}
          </div>
        </section>

        {/* Airframe Technical Blueprint linework */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="mono-label text-[11px] text-[var(--ink-3)] block">
                AIRFRAME GENERAL ARRANGEMENT
              </span>
              <h2 className="font-serif text-2xl md:text-3xl text-[var(--ink)] mt-0.5">
                Technical 3-View Blueprint: <span className="capitalize">{category}</span>
              </h2>
            </div>
            {aircraft?.registration && (
              <Chip variant="neutral">REG: {aircraft.registration}</Chip>
            )}
          </div>

          <AircraftBlueprint
            category={category}
            specificModel={aircraft?.typeCode}
          />
        </section>

        {/* Honest Provenance Footnote */}
        <footer className="border-t border-[var(--line)] pt-8 pb-12 space-y-4 text-xs font-mono text-[var(--ink-3)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[var(--ink-2)]">
                DATA PROVENANCE: Telemetry captured via Mode-S/ADS-B 1090 MHz receiver community feeds ({aircraft?.source || 'airplanes.live & adsb.lol'}).
              </p>
              <p className="mt-1">
                Routing corridors and schedules are rendered only when filed in verified aeronautical indexes. Aeroloom never fabricates missing flight paths.
              </p>
            </div>
            <Link href="/about/data" className="shrink-0">
              <Button variant="outline" size="sm">
                Data Transparency Document
              </Button>
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
