'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  ArrowLeft,
  MapPin,
  Compass,
  Crosshair,
  ExternalLink,
  Plane,
} from 'lucide-react';
import { GLOBAL_AIRPORTS } from '@/lib/airports/airportData';
import type { AirportInfo } from '@/lib/providers/positions/types';

export default function AirportsDirectoryPage() {
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');

  // Extract unique countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    GLOBAL_AIRPORTS.forEach((a) => {
      if (a.country) set.add(a.country);
    });
    return Array.from(set).sort();
  }, []);

  // Filtered airports
  const filteredAirports = useMemo(() => {
    const term = search.trim().toUpperCase();
    return GLOBAL_AIRPORTS.filter((a) => {
      const matchCountry = selectedCountry === 'ALL' || a.country === selectedCountry;
      if (!matchCountry) return false;

      if (!term) return true;
      return (
        a.iata.toUpperCase().includes(term) ||
        a.icao.toUpperCase().includes(term) ||
        a.name.toUpperCase().includes(term) ||
        a.city.toUpperCase().includes(term)
      );
    });
  }, [search, selectedCountry]);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-sky-500/30">
      {/* Sticky Atmospheric Header */}
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
              AIRPORT DIRECTORY
            </span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          DASHBOARD
        </Link>
      </header>

      {/* Main Directory Body */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-sky-400" />
              GLOBAL AVIATION HUBS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Curated international gateways, metropolitan corridors, and regional airspaces ({filteredAirports.length} indexed).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-800/80 text-sky-300">
              ZERO-API CACHED DATASET
            </span>
          </div>
        </div>

        {/* Search & Country Filter Controls */}
        <div className="p-4 rounded-2xl bg-[#080d1a] border border-[#1f293d] flex flex-col sm:flex-row gap-3 font-mono text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by IATA, ICAO, name, or city (e.g. JFK, EGLL, Tokyo)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#040711] border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#040711] border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500/60"
            >
              <option value="ALL">All Countries ({countries.length})</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Airport Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
          {filteredAirports.map((airport) => (
            <div
              key={airport.icao}
              className="p-5 rounded-2xl bg-[#080d1a] border border-[#1f293d] hover:border-sky-500/50 transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                        {airport.iata}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {airport.icao}
                      </span>
                    </div>
                    <span className="text-xs text-sky-400 font-semibold block mt-0.5">
                      {airport.city}, {airport.country}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans line-clamp-1">
                  {airport.name}
                </p>

                <div className="pt-2 border-t border-[#1f293d]/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {airport.latitude.toFixed(3)}°, {airport.longitude.toFixed(3)}°
                  </span>
                  {airport.elevationFt && (
                    <span>ELEV: {airport.elevationFt.toLocaleString()} FT</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1f293d]/60 text-xs">
                <Link
                  href={`/airport/${airport.iata.toLowerCase()}`}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-center transition-colors flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>DETAILS</span>
                </Link>

                <Link
                  href={`/?stage=observatory&select=${airport.iata.toLowerCase()}`}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-center transition-colors flex items-center justify-center gap-1 font-semibold"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>RADAR</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
