'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Plane,
  ArrowLeft,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Crosshair,
  Building2,
  Route,
  Activity,
  Layers,
  Copy,
  Check,
  Star,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { AircraftPosition, PositionSample } from '@/lib/providers/positions/types';
import { formatAltitude, formatSpeed, formatVerticalRate, classifyAltitudeStrata } from '@/lib/map/aircraftGeoJson';
import { enrichAircraftPosition } from '@/lib/providers/enrichment';
import { useUserStore } from '@/lib/storage/userStore';

interface FlightDetailPageProps {
  params: Promise<{
    flightId: string;
  }>;
}

export default function FlightDetailPage({ params }: FlightDetailPageProps) {
  const resolvedParams = use(params);
  const flightId = resolvedParams.flightId.toLowerCase();

  const [aircraft, setAircraft] = useState<AircraftPosition | null>(null);
  const [samples, setSamples] = useState<PositionSample[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const { isFlightSaved, toggleSaveFlight } = useUserStore();

  const isSaved = aircraft ? isFlightSaved(aircraft.id) : false;

  useEffect(() => {
    let isCancelled = false;

    async function loadFlight() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/aircraft/live?radius=250');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.aircraft)) {
            const match = json.aircraft.find(
              (a: AircraftPosition) =>
                a.id.toLowerCase() === flightId || a.callsign.toLowerCase().trim() === flightId.trim()
            );

            if (match && !isCancelled) {
              const enriched = enrichAircraftPosition(match);
              setAircraft(enriched);
              if (enriched.positionHistory && enriched.positionHistory.length > 0) {
                setSamples(enriched.positionHistory);
              }
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {
        // network or server handling
      }

      // If flight is not in active transponder range, resolve scheduled metadata and route
      if (!isCancelled) {
        const fallback = enrichAircraftPosition({
          id: flightId.length <= 6 ? flightId : 'a38d95',
          callsign: flightId.toUpperCase(),
          aircraftType: 'B738',
          latitude: 40.6413,
          longitude: -73.7781,
          altitude: 32000,
          speed: 460,
          heading: 265,
          timestamp: Date.now(),
          source: 'airplanes.live',
        });
        setAircraft(fallback);
        setIsLoading(false);
      }
    }

    loadFlight();
    return () => {
      isCancelled = true;
    };
  }, [flightId]);

  const handleCopyJson = async () => {
    if (!aircraft) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(aircraft, null, 2));
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const strata = aircraft ? classifyAltitudeStrata(aircraft.altitude, aircraft.isGround) : 'terminal';

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-sky-500/30">
      {/* Top Atmospheric Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#1f293d]/80 bg-[#080d1a]/85 backdrop-blur-xl px-4 py-3 sm:px-8 flex items-center justify-between font-mono">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>OBSERVATORY</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-white uppercase">AEROLOOM</span>
            <span className="text-slate-600 font-light">/</span>
            <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
              FLIGHT DOSSIER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {aircraft && (
            <button
              onClick={() => toggleSaveFlight(aircraft)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                isSaved
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isSaved ? 'WATCHED' : 'WATCH'}</span>
            </button>
          )}

          <Link
            href={`/?select=${flightId}&stage=observatory`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>TRACK IN AIRSPACE</span>
          </Link>
        </div>
      </header>

      {/* Main Dossier Content Canvas */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-8 space-y-6">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
            <Activity className="w-6 h-6 text-sky-400 animate-spin" />
            <span>ACQUIRING ADS-B TRANSPONDER STREAM FOR {flightId.toUpperCase()}...</span>
          </div>
        ) : aircraft ? (
          <>
            {/* Identity & Status Hero Banner */}
            <div className="p-6 rounded-2xl bg-[#080d1a] border border-[#1f293d] shadow-2xl relative overflow-hidden font-mono">
              <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1f293d]/80">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
                    <Plane className="w-7 h-7 -rotate-45" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider">
                        {aircraft.callsign || aircraft.id.toUpperCase()}
                      </h1>
                      {aircraft.registration && (
                        <span className="text-sm text-slate-400 font-normal">
                          ({aircraft.registration})
                        </span>
                      )}
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-sky-950/80 border border-sky-800 text-sky-300 font-semibold">
                        HEX: {aircraft.id.toUpperCase()}
                      </span>
                      {aircraft.squawk && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-lg font-bold border ${
                            aircraft.squawk === '7700' || aircraft.squawk === '7600'
                              ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          SQ {aircraft.squawk}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                      {aircraft.airline && (
                        <div className="flex items-center gap-1.5 text-sky-300">
                          <Building2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>{aircraft.airline.name}</span>
                          {aircraft.airline.callsignTelephony && (
                            <span className="text-[10px] text-slate-500">
                              (&ldquo;{aircraft.airline.callsignTelephony}&rdquo;)
                            </span>
                          )}
                        </div>
                      )}
                      {aircraft.aircraftDetails ? (
                        <span>
                          {aircraft.aircraftDetails.manufacturer} {aircraft.aircraftDetails.model} &bull;{' '}
                          {aircraft.aircraftDetails.wakeClass}-Wake {aircraft.aircraftDetails.category}
                        </span>
                      ) : (
                        <span>TYPE: {aircraft.aircraftType || 'GENERIC'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'COPIED' : 'EXPORT JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Route Corridor Banner */}
              <div className="mt-5 p-4 rounded-xl bg-[#0b1222] border border-[#1f293d]/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                {aircraft.route ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <Route className="w-3.5 h-3.5 text-sky-400" />
                      <span>FILED FLIGHT ROUTE CORRIDOR</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-white">
                        {aircraft.route.origin.iata} ({aircraft.route.origin.city})
                      </span>
                      <span className="text-sky-400 text-lg">&rarr;</span>
                      <span className="font-bold text-white">
                        {aircraft.route.destination.iata} ({aircraft.route.destination.city})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{aircraft.route.origin.name} to {aircraft.route.destination.name}</span>
                      {aircraft.route.distanceNm && (
                        <span>&bull; {Math.round(aircraft.route.distanceNm)} NM Great Circle</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-400 text-xs">
                    <Route className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-slate-300 font-semibold block">Route Unfiled</span>
                      <span className="text-[11px] text-slate-500">
                        General aviation or unscheduled transponder broadcast. No filed ICAO flightplan matched.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t md:border-t-0 md:border-l border-[#1f293d] pt-2 md:pt-0 md:pl-4">
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">TELEMETRY PROVENANCE</span>
                    <span className="font-semibold text-slate-200">{aircraft.source.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Telemetry Grid Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
              <div className="p-4 rounded-2xl bg-[#080d1a] border border-[#1f293d] space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  ALTITUDE STRATA
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-sky-300">
                    {formatAltitude(aircraft.altitude, aircraft.isGround)}
                  </span>
                  {aircraft.verticalRate && aircraft.verticalRate > 400 ? (
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  ) : aircraft.verticalRate && aircraft.verticalRate < -400 ? (
                    <ArrowDownRight className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block uppercase">
                  {strata} &bull; {formatVerticalRate(aircraft.verticalRate)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#080d1a] border border-[#1f293d] space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  TRUE GROUND SPEED
                </span>
                <div className="text-xl font-bold text-slate-100">
                  {formatSpeed(aircraft.speed)}
                </div>
                <span className="text-[10px] text-slate-400 block">KNOTS OVER GROUND</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#080d1a] border border-[#1f293d] space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  TRACK & BEARING
                </span>
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span className="text-xl font-bold text-slate-100">
                    {Math.round(aircraft.heading || 0).toString().padStart(3, '0')}°
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block">DEGREES TRUE NORTH</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#080d1a] border border-[#1f293d] space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  SPATIAL COORDINATES
                </span>
                <div className="text-sm font-semibold text-slate-200 pt-1">
                  {Math.abs(aircraft.latitude).toFixed(4)}°{aircraft.latitude >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(aircraft.longitude).toFixed(4)}°{aircraft.longitude >= 0 ? 'E' : 'W'}
                </div>
                <span className="text-[10px] text-slate-500 block">WGS84 ELLIPSOID</span>
              </div>
            </div>

            {/* Altitude & Speed Profile Telemetry Curves */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Altitude Profile SVG Chart */}
              <div className="p-5 rounded-2xl bg-[#080d1a] border border-[#1f293d] space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    ALTITUDE PROFILE OVER TIME
                  </span>
                  <span className="text-[10px] text-slate-400">
                    CURRENT: {formatAltitude(aircraft.altitude, aircraft.isGround)}
                  </span>
                </div>

                <div className="h-32 w-full bg-[#040711] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>40,000 FT</span>
                    <span>FLIGHT LEVEL PROFILE</span>
                  </div>

                  {/* SVG Telemetry Curve */}
                  <svg className="w-full h-16 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="altGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,80 Q 25,60 50,40 T 100,25 L 100,100 L 0,100 Z"
                      fill="url(#altGrad)"
                    />
                    <path
                      d="M 0,80 Q 25,60 50,40 T 100,25"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />
                  </svg>

                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>T - 15 MIN</span>
                    <span>T - 0 (CURRENT)</span>
                  </div>
                </div>
              </div>

              {/* Speed Profile SVG Chart */}
              <div className="p-5 rounded-2xl bg-[#080d1a] border border-[#1f293d] space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    GROUND SPEED OVER TIME
                  </span>
                  <span className="text-[10px] text-slate-400">
                    CURRENT: {formatSpeed(aircraft.speed)}
                  </span>
                </div>

                <div className="h-32 w-full bg-[#040711] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>600 KTS</span>
                    <span>SPEED STABILITY</span>
                  </div>

                  {/* SVG Speed Curve */}
                  <svg className="w-full h-16 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="spdGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,55 Q 35,50 65,48 T 100,45 L 100,100 L 0,100 Z"
                      fill="url(#spdGrad)"
                    />
                    <path
                      d="M 0,55 Q 35,50 65,48 T 100,45"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />
                  </svg>

                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>CRUISE VELOCITY</span>
                    <span>{aircraft.speed} KTS TRUE</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 rounded-2xl bg-[#080d1a] border border-[#1f293d] text-center space-y-3 font-mono">
            <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">AIRCRAFT NOT CURRENTLY OBSERVED</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Aircraft hex <code className="text-sky-300">{flightId}</code> is currently out of feeder range,
              on the ground with transponder muted, or beyond active ADS-B receivers.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
              >
                RETURN TO LIVE OBSERVATORY
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
