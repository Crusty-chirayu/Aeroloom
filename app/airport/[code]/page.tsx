'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  MapPin,
  Compass,
  Crosshair,
  Plane,
  Activity,
  Layers,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  getAirportByIata,
  getAirportByIcao,
  calculateDistanceNm,
} from '@/lib/airports/airportData';
import type { AircraftPosition, AirportInfo } from '@/lib/providers/positions/types';
import { formatAltitude, formatSpeed } from '@/lib/map/aircraftGeoJson';
import { enrichAircraftPositions } from '@/lib/providers/enrichment';

interface AirportDetailPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function AirportDetailPage({ params }: AirportDetailPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();

  const airport: AirportInfo | undefined =
    getAirportByIata(code) || getAirportByIcao(code);

  const [nearbyAircraft, setNearbyAircraft] = useState<
    Array<AircraftPosition & { distanceToAirportNm: number }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!airport) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadNearbyTraffic() {
      setIsLoading(true);
      try {
        const url = `/api/aircraft/live?lat=${airport?.latitude.toFixed(4)}&lon=${airport?.longitude.toFixed(4)}&radius=60`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.aircraft)) {
            const enriched = enrichAircraftPositions(json.aircraft);
            const withDist = enriched
              .map((ac) => {
                const dist = calculateDistanceNm(
                  airport!.latitude,
                  airport!.longitude,
                  ac.latitude,
                  ac.longitude
                );
                return { ...ac, distanceToAirportNm: Math.round(dist) };
              })
              .sort((a, b) => a.distanceToAirportNm - b.distanceToAirportNm);

            if (!isCancelled) {
              setNearbyAircraft(withDist);
              setIsLoading(false);
            }
            return;
          }
        }
      } catch {
        // error handling
      }

      if (!isCancelled) {
        setIsLoading(false);
      }
    }

    loadNearbyTraffic();
    return () => {
      isCancelled = true;
    };
  }, [airport]);

  if (!airport) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 font-mono p-8 flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-rose-400" />
        <h1 className="text-xl font-bold">AIRPORT CODE &ldquo;{code}&rdquo; NOT RECOGNIZED</h1>
        <p className="text-xs text-slate-400">
          The requested identifier was not found in the curated open airport dataset.
        </p>
        <Link
          href="/airports"
          className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
        >
          RETURN TO AIRPORT DIRECTORY
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-sky-500/30">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#1f293d]/80 bg-[#080d1a]/85 backdrop-blur-xl px-4 py-3 sm:px-8 flex items-center justify-between font-mono">
        <div className="flex items-center gap-4">
          <Link
            href="/airports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ALL AIRPORTS</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-white uppercase">AEROLOOM</span>
            <span className="text-slate-600 font-light">/</span>
            <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
              {airport.iata} TERMINAL AIRSPACE
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-sky-500/20 font-mono"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>VIEW IN OBSERVATORY</span>
        </Link>
      </header>

      {/* Main Terminal Dossier */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-8 space-y-6">
        {/* Airport Identity Card */}
        <div className="p-6 rounded-2xl bg-[#080d1a] border border-[#1f293d] shadow-2xl relative overflow-hidden font-mono">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1f293d]/80">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-3xl font-bold text-white tracking-wider">
                    {airport.iata}
                  </h1>
                  <span className="text-sm px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    ICAO: {airport.icao}
                  </span>
                </div>
                <h2 className="text-base text-slate-200 font-semibold mt-1 font-sans">
                  {airport.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{airport.city}, {airport.country}</span>
                  {airport.timezone && <span>&bull; {airport.timezone}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                {airport.latitude.toFixed(4)}°, {airport.longitude.toFixed(4)}°
              </span>
              {airport.elevationFt && (
                <span>ELEVATION: {airport.elevationFt.toLocaleString()} FT MSL</span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="text-[11px] text-slate-500">
              Coverage radius: 60 Nautical Miles &bull; Observed airborne transponder telemetry
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px]">
              {nearbyAircraft.length} AIRCRAFT WITHIN 60 NM
            </span>
          </div>
        </div>

        {/* Nearby Observed Airspace Section */}
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plane className="w-4 h-4 text-sky-400" />
              <span>NEARBY OBSERVED TRAFFIC ({nearbyAircraft.length})</span>
            </h3>
            <span className="text-[10px] text-slate-500">
              LIVE ADS-B FEED (SORTED BY PROXIMITY)
            </span>
          </div>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Activity className="w-5 h-5 text-sky-400 animate-spin" />
              <span>SCANNING RADAR SECTOR AROUND {airport.iata}...</span>
            </div>
          ) : nearbyAircraft.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nearbyAircraft.map((ac) => (
                <div
                  key={ac.id}
                  className="p-4 rounded-xl bg-[#080d1a] border border-[#1f293d] hover:border-sky-500/40 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white tracking-wider group-hover:text-sky-300 transition-colors">
                        {ac.callsign || ac.id.toUpperCase()}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-300 font-semibold">
                        {ac.distanceToAirportNm} NM
                      </span>
                    </div>

                    {ac.airline && (
                      <span className="text-[11px] text-sky-400 font-semibold block truncate">
                        {ac.airline.name}
                      </span>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                      <span>{formatAltitude(ac.altitude, ac.isGround)}</span>
                      <span>&bull;</span>
                      <span>{formatSpeed(ac.speed)}</span>
                      <span>&bull;</span>
                      <span>{ac.aircraftType || 'GEN'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1f293d]/60 text-xs">
                    <Link
                      href={`/flight/${ac.id}`}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span>DOSSIER</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <Link
                      href={`/?select=${ac.id}&stage=observatory`}
                      className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>TRACK</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#080d1a] border border-[#1f293d] text-center space-y-2">
              <Plane className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">NO AIRCRAFT WITHIN 60 NM RADAR</p>
              <p className="text-xs text-slate-500">
                No active airborne transponders detected in the immediate terminal sector.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
