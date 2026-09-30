'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { GLOBAL_AIRPORTS } from '@/lib/airports/airportData';

export default function AirportsDirectoryPage() {
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');

  const countries = useMemo(() => {
    const set = new Set<string>();
    GLOBAL_AIRPORTS.forEach((a) => {
      if (a.country) set.add(a.country);
    });
    return Array.from(set).sort();
  }, []);

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
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" icon="arrow-left">
              Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg text-[var(--ink)]">Aeroloom</span>
            <span className="text-[var(--ink-4)]">/</span>
            <span className="mono-label text-[11px] text-[var(--ink-2)]">Airports Directory</span>
          </div>
        </div>

        <Link href="/dev/kit">
          <Button variant="outline" size="sm" icon="layers">
            Kit
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-[1360px] mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--ink)] tracking-tight">
              Global Aviation Hubs
            </h1>
            <p className="text-sm text-[var(--ink-3)] mt-2">
              Curated international gateways, metropolitan corridors, and regional hubs ({filteredAirports.length} indexed).
            </p>
          </div>
          <Chip variant="neutral" dot>{GLOBAL_AIRPORTS.length} Curated Airspaces</Chip>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:max-w-md">
            <Input
              icon="search"
              placeholder="Filter by IATA, ICAO, city, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              clearable
              onClear={() => setSearch('')}
            />
          </div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="h-10 px-3.5 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--line-strong)] text-sm font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--signal)] focus:ring-1 focus:ring-[var(--signal)]"
          >
            <option value="ALL">All Countries ({countries.length})</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAirports.map((airport) => (
            <Panel key={airport.icao} variant="surface" radius="md" padding="md" className="flex flex-col justify-between gap-4 hover:border-[var(--ink-3)] transition-all">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold text-[var(--ink)]">{airport.iata}</span>
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded-[var(--r-sm)] bg-[var(--paper-2)] text-[var(--ink-3)]">
                        {airport.icao}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-[var(--signal-ink)] block mt-0.5">
                      {airport.city}, {airport.country}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] flex items-center justify-center text-[var(--ink-2)]">
                    <Icon name="map-pin" size={14} />
                  </div>
                </div>

                <p className="text-sm text-[var(--ink-2)] line-clamp-1">{airport.name}</p>

                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between font-mono text-[11px] text-[var(--ink-3)]">
                  <span>{airport.latitude.toFixed(2)}°, {airport.longitude.toFixed(2)}°</span>
                  {airport.elevationFt && <span>ELEV: {airport.elevationFt} FT</span>}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex items-center gap-2">
                <Link href={`/airport/${airport.iata.toLowerCase()}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Details
                  </Button>
                </Link>
                <Link href={`/map?airport=${airport.iata.toLowerCase()}`} className="flex-1">
                  <Button variant="ghost" size="sm" icon="compass" className="w-full">
                    Radar
                  </Button>
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      </main>
    </div>
  );
}
