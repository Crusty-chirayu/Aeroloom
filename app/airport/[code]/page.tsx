'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';
import { getAirportByIata, getAirportByIcao } from '@/lib/airports/airportData';
import { AirportTerminalMap } from '@/components/airport/AirportTerminalMap';
import { MetarWeatherCard } from '@/components/airport/MetarWeatherCard';
import { AirportRadarScope } from '@/components/airport/AirportRadarScope';
import { AirportRadarScopeBentoTile } from '@/components/airport/AirportRadarScopeBentoTile';
import type { AircraftState, WeatherReport } from '@/lib/providers/types';

interface AirportPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function AirportDetailPage({ params }: AirportPageProps) {
  const resolvedParams = use(params);
  const code = (resolvedParams.code || '').toUpperCase();

  const airport = getAirportByIata(code) || getAirportByIcao(code);

  const [weather, setWeather] = useState<WeatherReport | null>(null);
  const [traffic, setTraffic] = useState<AircraftState[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Fetch METAR weather and nearby traffic
  const fetchAirportData = useCallback(async () => {
    if (!airport) return;

    // 1. Fetch weather
    try {
      const wRes = await fetch(`/api/airport/${airport.icao}/weather`);
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData.success && wData.weather) {
          setWeather(wData.weather);
        }
      }
    } catch {
      // Degraded weather
    } finally {
      setIsLoadingWeather(false);
    }

    // 2. Fetch traffic
    try {
      const tRes = await fetch(`/api/airport/${airport.icao}/traffic`);
      if (tRes.ok) {
        const tData = await tRes.json();
        if (tData.success && Array.isArray(tData.aircraft)) {
          setTraffic(tData.aircraft);
        }
      }
    } catch {
      // Degraded traffic
    } finally {
      setIsLoadingTraffic(false);
    }
  }, [airport]);

  useEffect(() => {
    if (airport) {
      document.title = `${airport.name} (${airport.iata} / ${airport.icao}) · Aeroloom`;
    } else {
      document.title = `Airport ${code} · Aeroloom`;
    }
    const timer = setTimeout(() => {
      fetchAirportData();
    }, 0);
    const interval = setInterval(fetchAirportData, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchAirportData, airport, code]);

  // Update local clock based on longitude estimate (or UTC)
  useEffect(() => {
    if (!airport) return;
    const updateClock = () => {
      const now = new Date();
      // Estimate UTC offset hours from longitude
      const offsetHours = Math.round(airport.longitude / 15);
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const localDate = new Date(utcMs + 3600000 * offsetHours);
      setCurrentTime(
        localDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, [airport]);

  // Designed Error / Not Found State
  if (!airport) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between p-6 md:p-12 max-w-[1360px] mx-auto">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <Link href="/airports">
            <Button variant="ghost" size="sm" icon="arrow-left">
              Airports Directory
            </Button>
          </Link>
          <span className="mono-label text-[11px] text-[var(--ink-3)]">
            AERODROME CATALOGUE
          </span>
        </header>

        <main className="py-16 max-w-xl mx-auto text-center space-y-6">
          <Chip variant="bad">Unrecognized Aerodrome</Chip>
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--ink)]">
            Airport Code &ldquo;{code}&rdquo; Not Found
          </h1>
          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            The code entered does not match an indexed IATA or ICAO aerodrome station in Aeroloom&apos;s verified global directory.
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <Link href="/airports">
              <Button variant="ink" size="md" icon="compass">
                Browse All Hubs
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="outline" size="md" icon="radar">
                Live Radar Map
              </Button>
            </Link>
          </div>
        </main>

        <footer className="border-t border-[var(--line)] pt-4 text-xs font-mono text-[var(--ink-3)] text-center">
          AEROLOOM AVIATION REPOSITORY · STANDARDS ISO 3166 / ICAO DOC 7910
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* Editorial App Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/airports" className="shrink-0">
              <Button variant="ghost" size="sm" icon="arrow-left">
                Airports
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif text-lg text-[var(--ink)]">Aeroloom</span>
              <span className="text-[var(--ink-4)] hidden sm:inline">/</span>
              <span className="mono-label text-[11px] text-[var(--ink-2)] hidden sm:inline">Airport</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/map?lat=${airport.latitude}&lng=${airport.longitude}&z=10`}>
              <Button variant="ink" size="sm" icon="plane">
                Radar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1360px] mx-auto px-6 py-10 space-y-10">
        {/* Aerodrome Identity Header */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="signal">INTERNATIONAL AERODROME</Chip>
            <Chip variant="neutral">{airport.country}</Chip>
            {weather?.flightCategory && (
              <Chip
                variant={
                  weather.flightCategory === 'VFR'
                    ? 'ok'
                    : weather.flightCategory === 'MVFR'
                    ? 'sky'
                    : weather.flightCategory === 'IFR'
                    ? 'warn'
                    : 'bad'
                }
                dot
              >
                {weather.flightCategory} CONDITIONS
              </Chip>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--line)] pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-3xl md:text-4xl font-bold text-[var(--ink)]">
                  {airport.iata}
                </span>
                <span className="font-mono text-lg px-2 py-0.5 rounded-[var(--r-sm)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-2)]">
                  {airport.icao}
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-6xl text-[var(--ink)] tracking-tight">
                {airport.name}
              </h1>
              <p className="font-sans text-base text-[var(--ink-2)] mt-1">
                Serving {airport.city}, {airport.country}
              </p>
            </div>

            {/* Aerodrome Coordinates & Clock */}
            <div className="flex flex-wrap items-center gap-6 font-mono text-sm text-[var(--ink-2)]">
              {currentTime && (
                <div>
                  <span className="mono-label text-[10px] text-[var(--ink-3)] block">EST. LOCAL TIME</span>
                  <span className="font-bold text-[var(--ink)] text-base tabular-nums">
                    {currentTime}
                  </span>
                </div>
              )}
              <div>
                <span className="mono-label text-[10px] text-[var(--ink-3)] block">FIELD ELEVATION</span>
                <span className="font-bold text-[var(--ink)] text-base">
                  {airport.elevationFt !== undefined ? `${airport.elevationFt} FT MSL` : 'SEA LEVEL'}
                </span>
              </div>
              <div>
                <span className="mono-label text-[10px] text-[var(--ink-3)] block">COORDINATES</span>
                <span className="font-bold text-[var(--ink)] text-base">
                  {airport.latitude.toFixed(4)}°, {airport.longitude.toFixed(4)}°
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Weather Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="mono-label text-[11px] text-[var(--ink-3)]">
              METEOROLOGICAL CONDITIONS (METAR)
            </span>
            <span className="text-xs font-mono text-[var(--ink-2)]">
              NOAA / AVIATIONWEATHER.GOV
            </span>
          </div>

          <MetarWeatherCard weather={weather} isLoading={isLoadingWeather} />
        </section>

        {/* ATC Radar Scope Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="mono-label text-[11px] text-[var(--ink-3)]">
              AIR TRAFFIC CONTROL (ATC) RADAR SCOPE
            </span>
            <span className="text-xs font-mono text-[var(--ink-2)]">
              PRIMARY / SECONDARY SURVEILLANCE RADAR
            </span>
          </div>

          <AirportRadarScope
            airport={airport}
            aircraft={traffic}
            isLoading={isLoadingTraffic}
          />
        </section>

        {/* Dual Section: Terminal Radar Map & Bento Tile Preview */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Map Column */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[11px] text-[var(--ink-3)]">
                TERMINAL MANEUVERING AREA (30 NM TMA)
              </span>
              <span className="text-xs font-mono text-[var(--ink-2)]">
                {traffic.length} AIRCRAFT TRACKED
              </span>
            </div>

            <AirportTerminalMap airport={airport} aircraft={traffic} />
          </div>

          {/* Traffic & Bento Column */}
          <div className="lg:col-span-5 space-y-6">
            <AirportRadarScopeBentoTile
              airport={airport}
              traffic={traffic}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="mono-label text-[11px] text-[var(--ink-3)]">
                  AIRCRAFT NEAR THIS AIRPORT
                </span>
                <span className="text-xs font-mono text-[var(--ink-2)]">
                  WITHIN 35 NM
                </span>
              </div>

              <Panel variant="surface" radius="md" padding="md" className="space-y-4 max-h-[320px] overflow-y-auto">
                {isLoadingTraffic ? (
                  <div className="space-y-3 animate-pulse py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-[var(--paper-2)] rounded" />
                    ))}
                  </div>
                ) : traffic.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[var(--paper-2)] flex items-center justify-center mx-auto text-[var(--ink-3)]">
                      <Icon name="radar" size={18} />
                    </div>
                    <div className="font-serif text-lg text-[var(--ink)]">Clear Airspace</div>
                    <p className="text-xs text-[var(--ink-3)] max-w-xs mx-auto">
                      No transponder-equipped aircraft currently detected within 35 nautical miles of {airport.iata}.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--line)]">
                    {traffic.slice(0, 10).map((ac) => (
                      <Link
                        key={ac.id}
                        href={`/flight/${ac.callsign.toLowerCase()}`}
                        className="py-2.5 flex items-center justify-between hover:bg-[var(--paper-2)] px-2 -mx-2 rounded transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[var(--paper-2)] group-hover:bg-[var(--paper)] flex items-center justify-center text-[var(--ink)] border border-[var(--line)]">
                            <Icon name="plane" size={14} />
                          </div>
                          <div>
                            <div className="font-mono text-sm font-bold text-[var(--ink)] group-hover:text-[var(--signal)] transition-colors">
                              {ac.callsign}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--ink-3)]">
                              {ac.typeCode || 'AIRCRAFT'} · {typeof ac.airline === 'object' && ac.airline ? ac.airline.name : ac.airline || 'Commercial'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          <div className="font-semibold text-[var(--ink)]">
                            {ac.altitudeFt.toLocaleString()} FT
                          </div>
                          <div className="text-[11px] text-[var(--ink-3)]">
                            {ac.groundSpeedKt} KT · {ac.trackDeg}°
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </section>

        {/* Airport Operational & Physical Specifications */}
        <section className="space-y-4">
          <span className="mono-label text-[11px] text-[var(--ink-3)] block border-b border-[var(--line)] pb-2">
            AERODROME PHYSICAL SPECIFICATIONS &amp; WAYPOINTS
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Panel variant="surface" radius="md" padding="md">
              <span className="mono-label text-[10px] text-[var(--ink-3)] block">IATA / ICAO</span>
              <span className="font-mono text-xl font-bold text-[var(--ink)]">
                {airport.iata} / {airport.icao}
              </span>
              <span className="text-[11px] font-mono text-[var(--ink-3)] block mt-0.5">ICAO DOC 7910</span>
            </Panel>

            <Panel variant="surface" radius="md" padding="md">
              <span className="mono-label text-[10px] text-[var(--ink-3)] block">GEOGRAPHIC LATITUDE</span>
              <span className="font-mono text-xl font-bold text-[var(--ink)]">
                {airport.latitude.toFixed(4)}°
              </span>
              <span className="text-[11px] font-mono text-[var(--ink-3)] block mt-0.5">WGS-84 ELLIPSOID</span>
            </Panel>

            <Panel variant="surface" radius="md" padding="md">
              <span className="mono-label text-[10px] text-[var(--ink-3)] block">GEOGRAPHIC LONGITUDE</span>
              <span className="font-mono text-xl font-bold text-[var(--ink)]">
                {airport.longitude.toFixed(4)}°
              </span>
              <span className="text-[11px] font-mono text-[var(--ink-3)] block mt-0.5">PRIME MERIDIAN</span>
            </Panel>

            <Panel variant="surface" radius="md" padding="md">
              <span className="mono-label text-[10px] text-[var(--ink-3)] block">AERODROME ELEVATION</span>
              <span className="font-mono text-xl font-bold text-[var(--ink)]">
                {airport.elevationFt ?? 0} FT
              </span>
              <span className="text-[11px] font-mono text-[var(--ink-3)] block mt-0.5">MEAN SEA LEVEL (MSL)</span>
            </Panel>
          </div>
        </section>

        {/* Honest Provenance Footnote */}
        <footer className="border-t border-[var(--line)] pt-8 pb-12 space-y-4 text-xs font-mono text-[var(--ink-3)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[var(--ink-2)]">
                HONEST TELEMETRY NOTICE: Aeroloom displays live transponder aircraft within terminal control airspace. Scheduled airline arrivals and departures boards are omitted because no free, verified public API exists without fake data.
              </p>
              <p className="mt-1">
                Meteorological data sourced directly from NOAA aviationweather.gov.
              </p>
            </div>
            <Link href="/about/data" className="shrink-0">
              <Button variant="outline" size="sm">
                Data Transparency
              </Button>
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
