import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';

export const metadata = {
  title: 'Data Sources & Telemetry Provenance — Aeroloom',
  description: 'Complete transparency register of upstream telemetry feeds, cartography providers, update latency, and honest data architecture.',
};

export default function AboutDataPage() {
  const sources = [
    {
      name: 'airplanes.live',
      category: 'PRIMARY LIVE ADS-B TELEMETRY',
      description: 'Global crowdsourced ADS-B/Mode-S transponder feeder collective providing uninhibited reception of airborne and surface transponders.',
      latency: '2–4 seconds',
      frequency: '6s server cache cycle',
      terms: 'Free for open-source & non-commercial research',
      attribution: 'Flight data courtesy of airplanes.live community feeders.',
      url: 'https://airplanes.live',
    },
    {
      name: 'adsb.lol',
      category: 'FAILOVER TELEMETRY STREAM',
      description: 'Secondary automated failover provider in Aeroloom’s chained provider pipeline. Engaged if primary endpoints report latency or error spikes.',
      latency: '3–6 seconds',
      frequency: 'Failover on demand',
      terms: 'Open-source community collective',
      attribution: 'ADS-B telemetry aggregated via adsb.lol open collective.',
      url: 'https://adsb.lol',
    },
    {
      name: 'aviationweather.gov (NOAA / NWS)',
      category: 'METEOROLOGICAL OBSERVATIONS (METAR)',
      description: 'Official global aerodrome meteorological reports, surface wind vectors, barometric altimeter settings, cloud ceilings, and flight categories.',
      latency: 'Near real-time (updated upon station broadcast)',
      frequency: '60s server cache',
      terms: 'US Government Public Domain (17 U.S.C. § 105)',
      attribution: 'Meteorological observations provided by NOAA / National Weather Service.',
      url: 'https://aviationweather.gov',
    },
    {
      name: 'OpenFreeMap & OpenStreetMap',
      category: 'VECTOR CARTOGRAPHY',
      description: 'Zero-token vector basemap infrastructure styled specifically for Aeroloom in soft paper tones without commercial tracker scripts or vendor keys.',
      latency: 'Static vector tile CDN',
      frequency: 'Pre-rendered tile pyramids',
      terms: 'Open Database License (ODbL) © OpenStreetMap contributors',
      attribution: 'Map data © OpenStreetMap contributors under ODbL.',
      url: 'https://openfreemap.org',
    },
    {
      name: 'RainViewer',
      category: 'CONVECTIVE PRECIPITATION RADAR',
      description: 'Global composite Doppler radar tile overlay for monitoring severe convective weather patterns and squall lines.',
      latency: '5–10 minutes behind real-time radar sweeps',
      frequency: 'On-demand layer toggle',
      terms: 'Free tier with required branding attribution',
      attribution: 'Radar imagery © RainViewer.',
      url: 'https://www.rainviewer.com',
    },
  ];

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
              <span className="mono-label text-[11px] text-[var(--ink-2)] hidden sm:inline">Provenance</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/airports" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm">
                Airports
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
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Editorial Title Section */}
        <section className="space-y-4 border-b border-[var(--line)] pb-8">
          <div className="flex items-center gap-2">
            <Chip variant="ok" dot>Honest Architecture</Chip>
            <Chip variant="neutral">Zero Mock Flight Data</Chip>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-[var(--ink)] tracking-tight">
            Data Sources, Telemetry &amp; Provenance
          </h1>
          <p className="text-lg text-[var(--ink-2)] leading-relaxed max-w-2xl">
            Aeroloom operates on a strict policy of architectural honesty: real flight positions are captured live from transponder broadcasts. We never invent flight routes, synthesize mock schedules, or conceal telemetry latencies.
          </p>
        </section>

        {/* Core Principles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Panel variant="surface" radius="md" padding="md" className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] flex items-center justify-center text-[var(--signal)] mb-3">
              <Icon name="radar" size={16} />
            </div>
            <h3 className="font-mono text-sm font-bold text-[var(--ink)]">100% Real Transponders</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Every dot on the radar corresponds to a real Mode-S or ADS-B transponder packet received by community SDR antennae.
            </p>
          </Panel>

          <Panel variant="surface" radius="md" padding="md" className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] flex items-center justify-center text-[var(--ok)] mb-3">
              <Icon name="shield-check" size={16} />
            </div>
            <h3 className="font-mono text-sm font-bold text-[var(--ink)]">Server Request Coalescing</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              To shield volunteer feeder servers from load spikes, duplicate requests in identical spatial bounds are collapsed into a single upstream call.
            </p>
          </Panel>

          <Panel variant="surface" radius="md" padding="md" className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] flex items-center justify-center text-[var(--sky)] mb-3">
              <Icon name="compass" size={16} />
            </div>
            <h3 className="font-mono text-sm font-bold text-[var(--ink)]">Dead-Reckoned Gliding</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Client frames run at 60 fps calculating continuous forward motion along magnetic track heading so contacts glide seamlessly between packet bursts.
            </p>
          </Panel>
        </section>

        {/* Upstream Feeds Register */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="mono-label text-xs text-[var(--ink-3)]">
              UPSTREAM TELEMETRY &amp; CARTOGRAPHY REGISTER
            </span>
            <span className="text-xs font-mono text-[var(--ink-3)]">5 REGISTERED PROVIDERS</span>
          </div>

          <div className="space-y-4">
            {sources.map((src) => (
              <Panel key={src.name} variant="surface" radius="md" padding="lg" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
                  <div>
                    <span className="mono-label text-[10px] text-[var(--ink-3)] block mb-0.5">
                      {src.category}
                    </span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-2xl text-[var(--ink)] hover:text-[var(--signal)] transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{src.name}</span>
                      <Icon name="external-link" size={14} />
                    </a>
                  </div>
                  <Chip variant="neutral">{src.latency}</Chip>
                </div>

                <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                  {src.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                  <div className="p-2.5 rounded bg-[var(--paper)] border border-[var(--line)]">
                    <span className="text-[var(--ink-3)] block text-[10px]">CACHE / REFRESH</span>
                    <span className="text-[var(--ink)] font-medium">{src.frequency}</span>
                  </div>
                  <div className="p-2.5 rounded bg-[var(--paper)] border border-[var(--line)]">
                    <span className="text-[var(--ink-3)] block text-[10px]">LICENSING &amp; TERMS</span>
                    <span className="text-[var(--ink)] font-medium">{src.terms}</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[var(--ink-3)] pt-2 border-t border-[var(--line)]">
                  ATTRIBUTION: {src.attribution}
                </div>
              </Panel>
            ))}
          </div>
        </section>

        {/* Architectural Defense Layer */}
        <section className="space-y-4 rounded-[var(--r-lg)] border border-[var(--line-strong)] bg-[var(--surface)] p-6 md:p-8">
          <div className="mono-label text-xs text-[var(--ink-3)]">SYSTEM INTEGRITY SAFEGUARDS</div>
          <h2 className="font-serif text-2xl md:text-3xl text-[var(--ink)]">
            How Aeroloom Respects Free Tier Infrastructure
          </h2>
          <div className="space-y-3 text-sm text-[var(--ink-2)] leading-relaxed">
            <p>
              1. <strong>Zero Direct Browser Queries:</strong> Browsers are completely prohibited from querying upstream APIs directly. All traffic is brokered by Next.js server route handlers.
            </p>
            <p>
              2. <strong>Multi-Tier Caching:</strong> Every spatial boundary lookup is cached in memory with Upstash Redis failover. Viewport bounds are quantized to 0.05° grid tiles so users looking at the same city sector share identical responses.
            </p>
            <p>
              3. <strong>Circuit Breakers:</strong> If an upstream provider returns HTTP 429 or 5xx, the system switches silently to the secondary failover provider while serving the last-known position snapshot with a <span className="font-mono text-xs px-1 bg-[var(--paper-2)] rounded">degraded: true</span> flag.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--line)] pt-6 text-xs font-mono text-[var(--ink-3)] flex items-center justify-between">
          <span>AEROLOOM AVIATION REPOSITORY</span>
          <span>DOCS/DATA-SOURCES.MD SPECIFICATION</span>
        </footer>
      </main>
    </div>
  );
}
