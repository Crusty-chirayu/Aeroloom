import React from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';

export const metadata = {
  title: 'Flight Safety & Telemetry Disclaimer — Aeroloom',
  description: 'Aviation safety advisory, crowdsourced receiver boundaries, and operational non-reliance notice for Aeroloom.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-85 transition-opacity" aria-label="Aeroloom Home">
            <AeroloomLogo variant="lockup" size="sm" />
          </Link>
          <Link href="/map">
            <Button variant="outline" size="sm" icon="radio">
              Live Radar
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[800px] mx-auto px-6 sm:px-12 py-16 space-y-12">
        <div className="space-y-4">
          <Chip variant="bad" dot>MANDATORY AVIATION SAFETY ADVISORY</Chip>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Safety &amp; Telemetry Disclaimer
          </h1>
          <p className="font-mono text-xs text-[var(--ink-3)]">
            REGULATORY NOTICE · FAA / EASA / ICAO NON-CERTIFIED APPARATUS
          </p>
        </div>

        {/* Primary Callout Box */}
        <Panel variant="surface" className="p-6 bg-[var(--signal-wash)] border-2 border-[var(--signal)] space-y-3">
          <h2 className="font-mono text-sm font-bold text-[var(--signal-ink)] uppercase tracking-wider">
            CRITICAL NOTICE FOR PILOTS, AIR TRAFFIC CONTROLLERS &amp; DISPATCHERS
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink)] leading-relaxed">
            Aeroloom is <strong>NOT AN APPROVED FLIGHT NAVIGATION INSTRUMENT</strong> and is not certified under FAA TSO, EASA ETSO, or ICAO safety standards. <strong>Never</strong> use this website, its maps, its Doppler radar layers, or its AI flight assistant for real-world aircraft navigation, air-to-air separation, terrain avoidance, emergency ditching procedures, or live flight operations.
          </p>
        </Panel>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            1. Physical Nature of Crowdsourced ADS-B
          </h2>
          <p>
            Aeroloom relies on open radio signals broadcasted on 1090 MHz and 978 MHz UAT by commercial and general aviation transponders, received by volunteer terrestrial antennas:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[var(--ink-2)]">
            <li><strong>Line-of-Sight Limitations:</strong> Ground obstacles, mountain ranges, and curvature of the earth block signals below certain altitudes when an aircraft is far from an active receiver.</li>
            <li><strong>Oceanic &amp; Remote Voids:</strong> Over deep oceans and polar regions, terrestrial antennas are absent. Flight tracks in these zones are interpolated or unmonitored.</li>
            <li><strong>Multilateration (MLAT) Error Margins:</strong> Non-ADS-B Mode-S aircraft located via MLAT rely on time-difference-of-arrival calculations between multiple receivers, which may introduce position uncertainty of 0.5–3 nautical miles.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            2. Weather Radar &amp; Convective Cell Latency
          </h2>
          <p>
            The weather radar overlay provided by RainViewer aggregates regional Doppler radar sweeps. Due to volume scan processing and composite mosaic generation, radar frames displayed on the map are typically <strong>5 to 15 minutes behind real time</strong>. In severe convective squalls, storm cells can move or intensify dramatically within that interval. Never utilize this overlay for storm penetration or avoidance.
          </p>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            3. AI Assistant Limitations
          </h2>
          <p>
            The <strong>Ask Aeroloom</strong> assistant provides grounded telemetry analysis based on point-in-time snapshot data. It is an experimental natural language interface and must not be used as an official briefing source.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
