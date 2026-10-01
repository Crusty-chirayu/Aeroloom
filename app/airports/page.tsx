'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { GLOBAL_AIRPORTS } from '@/lib/airports/airportData';

// Map country to broad global regions
function getRegion(country: string, icao: string): string {
  const code = icao.toUpperCase();
  if (code.startsWith('K') || code.startsWith('C') || country.includes('United States') || country.includes('Canada') || country.includes('Mexico') || country.includes('Brazil')) {
    return 'Americas';
  }
  if (code.startsWith('E') || code.startsWith('L') || country.includes('United Kingdom') || country.includes('France') || country.includes('Germany') || country.includes('Netherlands') || country.includes('Spain') || country.includes('Italy') || country.includes('Switzerland')) {
    return 'Europe';
  }
  if (code.startsWith('O') || country.includes('United Arab Emirates') || country.includes('Qatar') || country.includes('Saudi Arabia') || country.includes('South Africa') || country.includes('Egypt')) {
    return 'Middle East & Africa';
  }
  return 'Asia-Pacific';
}

export default function AirportsDirectoryPage() {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  const filteredAirports = useMemo(() => {
    const term = search.trim().toUpperCase();
    return GLOBAL_AIRPORTS.filter((a) => {
      const region = getRegion(a.country, a.icao);
      const matchRegion = selectedRegion === 'ALL' || region === selectedRegion;
      if (!matchRegion) return false;

      if (!term) return true;
      return (
        a.iata.toUpperCase().includes(term) ||
        a.icao.toUpperCase().includes(term) ||
        a.name.toUpperCase().includes(term) ||
        a.city.toUpperCase().includes(term) ||
        a.country.toUpperCase().includes(term)
      );
    });
  }, [search, selectedRegion]);

  const regions = ['ALL', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* Editorial App Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/map" className="shrink-0">
              <Button variant="ghost" size="sm" icon="arrow-left">
                Map
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif text-lg text-[var(--ink)]">Aeroloom</span>
              <span className="text-[var(--ink-4)] hidden sm:inline">/</span>
              <span className="mono-label text-[11px] text-[var(--ink-2)] hidden sm:inline">Airports</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/search" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" icon="search">
                Search
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="ink" size="sm" icon="plane">
                Radar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1360px] mx-auto px-6 py-10 space-y-8">
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <div className="mono-label text-xs text-[var(--ink-3)] uppercase mb-1">
              AERONAUTICAL WAYPOINT DIRECTORY
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--ink)] tracking-tight">
              Global Aerodromes &amp; Gateways
            </h1>
            <p className="text-sm text-[var(--ink-2)] mt-2 max-w-xl">
              Verified aeronautical coordinates, field elevations, and terminal control sectors for major international hubs ({filteredAirports.length} displayed).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip variant="neutral" dot>{GLOBAL_AIRPORTS.length} Indexed Stations</Chip>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="w-full md:max-w-md">
            <Input
              icon="search"
              placeholder="Search by IATA, ICAO, city, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              clearable
              onClear={() => setSearch('')}
            />
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--line)]">
            {regions.map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-3 py-1.5 rounded-[var(--r-sm)] font-mono text-xs transition-colors ${
                  selectedRegion === reg
                    ? 'bg-[var(--paper)] text-[var(--ink)] shadow-sm font-semibold border border-[var(--line)]'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {reg === 'ALL' ? 'All Regions' : reg}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Typographic Table */}
        <div className="rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-3)] font-mono text-[10px] tracking-wider uppercase">
                  <th className="py-3 px-4 sm:px-6">CODE</th>
                  <th className="py-3 px-4 sm:px-6">AERODROME &amp; METROPOLITAN AREA</th>
                  <th className="py-3 px-4 sm:px-6 hidden sm:table-cell">REGION / COUNTRY</th>
                  <th className="py-3 px-4 sm:px-6 hidden md:table-cell">COORDINATES</th>
                  <th className="py-3 px-4 sm:px-6 hidden lg:table-cell">ELEVATION</th>
                  <th className="py-3 px-4 sm:px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-sm font-sans">
                {filteredAirports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--ink-3)] font-mono text-xs">
                      No aerodromes found matching &ldquo;{search}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredAirports.map((apt) => {
                    const region = getRegion(apt.country, apt.icao);
                    return (
                      <tr
                        key={apt.icao}
                        className="hover:bg-[var(--paper-2)] transition-colors group"
                      >
                        {/* Code */}
                        <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-bold text-[var(--ink)] group-hover:text-[var(--signal)] transition-colors">
                              {apt.iata}
                            </span>
                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-3)]">
                              {apt.icao}
                            </span>
                          </div>
                        </td>

                        {/* Station Name & City */}
                        <td className="py-3 px-4 sm:px-6">
                          <Link
                            href={`/airport/${apt.iata.toLowerCase()}`}
                            className="block font-medium text-[var(--ink)] hover:underline"
                          >
                            {apt.name}
                          </Link>
                          <span className="text-xs text-[var(--ink-2)] block sm:hidden">
                            {apt.city}, {apt.country}
                          </span>
                        </td>

                        {/* Region & Country */}
                        <td className="py-3 px-4 sm:px-6 hidden sm:table-cell whitespace-nowrap text-xs text-[var(--ink-2)]">
                          <div>{apt.city}, {apt.country}</div>
                          <span className="font-mono text-[10px] text-[var(--ink-3)]">{region}</span>
                        </td>

                        {/* Coordinates */}
                        <td className="py-3 px-4 sm:px-6 hidden md:table-cell whitespace-nowrap font-mono text-xs text-[var(--ink-2)]">
                          {apt.latitude.toFixed(2)}°, {apt.longitude.toFixed(2)}°
                        </td>

                        {/* Elevation */}
                        <td className="py-3 px-4 sm:px-6 hidden lg:table-cell whitespace-nowrap font-mono text-xs text-[var(--ink-2)]">
                          {apt.elevationFt !== undefined ? `${apt.elevationFt} FT` : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Link href={`/airport/${apt.iata.toLowerCase()}`}>
                              <Button variant="ghost" size="sm">
                                Dossier
                              </Button>
                            </Link>
                            <Link href={`/map?lat=${apt.latitude}&lng=${apt.longitude}&z=10`}>
                              <Button variant="outline" size="sm" icon="radar">
                                Radar
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Directory Metadata Footer */}
        <footer className="border-t border-[var(--line)] pt-6 text-xs font-mono text-[var(--ink-3)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>STANDARDS: ICAO DOC 7910 · WGS-84 GEODETIC DATUM</div>
          <div>AEROLOOM AERODROME REPOSITORY</div>
        </footer>
      </main>
    </div>
  );
}
