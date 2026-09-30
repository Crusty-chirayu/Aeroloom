'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { getAirportByIata, getAirportByIcao } from '@/lib/airports/airportData';

interface AirportPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function AirportDetailPage({ params }: AirportPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();
  const airport = getAirportByIata(code) || getAirportByIcao(code);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between p-6 md:p-12 max-w-[1360px] mx-auto">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Link href="/airports">
          <Button variant="ghost" size="sm" icon="arrow-left">
            Airports Directory
          </Button>
        </Link>
        <span className="mono-label text-[11px] text-[var(--ink-3)]">
          AIRPORT PROFILE STUB · PHASE 4 FULL BUILD
        </span>
      </header>

      <main className="py-12 max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Chip variant="signal">Phase 4 Target</Chip>
          {airport && <Chip variant="ok" dot>{airport.country}</Chip>}
        </div>

        <h1 className="font-serif text-5xl md:text-6xl text-[var(--ink)] tracking-tight">
          {airport ? airport.name : `Airport ${code}`}
        </h1>

        {airport ? (
          <Panel variant="surface" padding="md" radius="md" className="space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--ink-3)]">IATA / ICAO:</span>
              <span className="font-bold text-[var(--ink)]">{airport.iata} / {airport.icao}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--ink-3)]">Location:</span>
              <span className="text-[var(--ink)]">{airport.city}, {airport.country}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--ink-3)]">Coordinates:</span>
              <span className="text-[var(--ink)]">{airport.latitude.toFixed(4)}°, {airport.longitude.toFixed(4)}°</span>
            </div>
            {airport.elevationFt && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-3)]">Field Elevation:</span>
                <span className="text-[var(--ink)]">{airport.elevationFt} FT MSL</span>
              </div>
            )}
          </Panel>
        ) : (
          <p className="text-sm text-[var(--ink-3)]">
            Airport identifier &ldquo;{code}&rdquo; recorded for Phase 4 live METAR and terminal radar.
          </p>
        )}

        <div className="pt-4">
          <Link href="/dev/kit">
            <Button variant="outline" size="md" icon="arrow-right" iconPosition="right">
              Return to Component Kit (/dev/kit)
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] pt-4 text-xs font-mono text-[var(--ink-3)]">
        ROUTE: /airport/{code} · EDITORIAL AVIATION FOUNDATION
      </footer>
    </div>
  );
}
