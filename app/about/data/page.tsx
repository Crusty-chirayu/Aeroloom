import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';

export default function AboutDataPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between p-6 md:p-12 max-w-[1360px] mx-auto">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" icon="arrow-left">
            Home
          </Button>
        </Link>
        <span className="mono-label text-[11px] text-[var(--ink-3)]">
          DATA TRANSPARENCY & PROVENANCE
        </span>
      </header>

      <main className="py-12 max-w-3xl space-y-10">
        <div>
          <Chip variant="ok" dot>Honest Architecture</Chip>
          <h1 className="font-serif text-4xl md:text-6xl text-[var(--ink)] tracking-tight mt-3">
            Data Sources &amp; Coverage
          </h1>
          <p className="text-lg text-[var(--ink-2)] mt-3 leading-relaxed">
            Aeroloom operates on an honest data policy: real live flight positions are never invented, simulated, or masked with fake data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel variant="surface" radius="md" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--ink-3)]">PRIMARY TELEMETRY</span>
              <Chip variant="signal">Live ADS-B</Chip>
            </div>
            <h3 className="font-serif text-2xl text-[var(--ink)]">airplanes.live &amp; adsb.lol</h3>
            <p className="text-sm text-[var(--ink-2)] leading-relaxed">
              Crowdsourced ADS-B receiver network feeds. Upstream queries are batched and cached with a 6-second circuit breaker to maintain zero-cost infrastructure without abusing community bandwidth.
            </p>
          </Panel>

          <Panel variant="surface" radius="md" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--ink-3)]">CARTOGRAPHY</span>
              <Chip variant="sky">Vector Tiles</Chip>
            </div>
            <h3 className="font-serif text-2xl text-[var(--ink)]">OpenFreeMap &amp; OpenStreetMap</h3>
            <p className="text-sm text-[var(--ink-2)] leading-relaxed">
              Open vector map tile infrastructure rendered via MapLibre GL JS without vendor tokens. Map data under Open Database License (ODbL).
            </p>
          </Panel>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--line)]">
          <h2 className="font-serif text-2xl text-[var(--ink)]">Latency &amp; Refresh Cycle</h2>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed">
            Client radar queries poll server route handlers at ~6s to 8s intervals. In-memory dead-reckoning interpolates positions in 60 fps requestAnimationFrame loops so aircraft glide realistically between transponder bursts.
          </p>
          <div className="pt-2">
            <Link href="/dev/kit">
              <Button variant="outline" size="md" icon="arrow-right" iconPosition="right">
                Explore Component Kit (/dev/kit)
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] pt-4 text-xs font-mono text-[var(--ink-3)] flex items-center justify-between">
        <span>DOCUMENTATION: docs/data-sources.md</span>
        <span>AEROLOOM TELEMETRY PIPELINE</span>
      </footer>
    </div>
  );
}
