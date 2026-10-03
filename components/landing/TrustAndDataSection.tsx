'use client';

import React from 'react';
import Link from 'next/link';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function TrustAndDataSection() {
  return (
    <section className="py-24 px-6 sm:px-12 max-w-[1360px] mx-auto border-t border-[var(--line)] space-y-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Chip variant="ok" dot>Architectural Honesty</Chip>
            <Chip variant="neutral">Open Provenance</Chip>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Data Integrity Without Compromise
          </h2>
          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            Aeroloom operates on a strict policy of telemetry honesty. We do not invent simulated flights, synthesize mock route corridors, or obscure radio reception latency.
          </p>
        </div>

        <Link href="/about/data" className="shrink-0">
          <Button variant="outline" size="sm" icon="arrow-right" iconPosition="right">
            Full Provenance Register (/about/data)
          </Button>
        </Link>
      </div>

      {/* 3 Real Numbers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] space-y-3 shadow-sm">
          <div className="font-mono text-3xl sm:text-4xl font-bold text-[var(--signal)] tabular-nums">
            100%
          </div>
          <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
            Crowdsourced Transponders
          </h3>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Every radar blip is physically received by community Software Defined Radio (SDR) antennae via airplanes.live and adsb.lol open feeders.
          </p>
          <div className="pt-2 text-[10px] font-mono text-[var(--ok-ink)] font-semibold flex items-center gap-1.5">
            <Icon name="check" size={12} />
            <span>ZERO SYNTHETIC OR SIMULATED TRAFFIC</span>
          </div>
        </div>

        <div className="p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] space-y-3 shadow-sm">
          <div className="font-mono text-3xl sm:text-4xl font-bold text-[var(--ink)] tabular-nums">
            2–10s
          </div>
          <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
            Edge Caching &amp; Coalescing
          </h3>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Spatial bounding boxes are quantized to 0.05° grid bins. Duplicate concurrent client queries are collapsed into a single upstream call to protect volunteer nodes.
          </p>
          <div className="pt-2 text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1.5">
            <Icon name="shield-check" size={12} className="text-[var(--ok-ink)]" />
            <span>COMMUNITY FEEDER PROTECTION</span>
          </div>
        </div>

        <div className="p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] space-y-3 shadow-sm">
          <div className="font-mono text-3xl sm:text-4xl font-bold text-[var(--ink)] tabular-nums">
            0 KB
          </div>
          <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
            Commercial Tracking Scripts
          </h3>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Vector tiles from OpenFreeMap and OpenStreetMap are served keyless and tracker-free. Zero ad beacons, zero third-party telemetry analytics, and zero paywalls.
          </p>
          <div className="pt-2 text-[10px] font-mono text-[var(--ok-ink)] font-semibold flex items-center gap-1.5">
            <Icon name="check" size={12} />
            <span>ODbL OPEN DATABASE LICENSE COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* Coverage Scope & Feed Latency Register */}
      <div className="p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3 text-xs font-mono">
          <span className="mono-label text-[10px] text-[var(--ink-3)] font-bold">
            FEED TELEMETRY ARCHITECTURE &amp; COVERAGE LIMITS
          </span>
          <span className="text-[var(--ink-3)]">UPDATED CONTINUOUSLY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-[var(--ink-3)] block text-[10px]">PRIMARY FEED</span>
            <span className="font-bold text-[var(--ink)] block">airplanes.live</span>
            <span className="text-[10px] text-[var(--ink-3)]">Global volunteer SDR network</span>
          </div>
          <div className="space-y-1">
            <span className="text-[var(--ink-3)] block text-[10px]">BACKUP FAILOVER</span>
            <span className="font-bold text-[var(--ink)] block">adsb.lol</span>
            <span className="text-[10px] text-[var(--ink-3)]">Automatic chained fallback</span>
          </div>
          <div className="space-y-1">
            <span className="text-[var(--ink-3)] block text-[10px]">WEATHER FEED</span>
            <span className="font-bold text-[var(--ink)] block">aviationweather.gov</span>
            <span className="text-[10px] text-[var(--ink-3)]">Official NOAA / NWS METAR</span>
          </div>
          <div className="space-y-1">
            <span className="text-[var(--ink-3)] block text-[10px]">CARTOGRAPHY</span>
            <span className="font-bold text-[var(--ink)] block">OpenFreeMap / OSM</span>
            <span className="text-[10px] text-[var(--ink-3)]">Custom paper vector style</span>
          </div>
        </div>
      </div>
    </section>
  );
}
