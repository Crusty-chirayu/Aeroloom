'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-[var(--line-strong)] bg-[var(--paper)] pt-20 pb-12 px-6 sm:px-12 overflow-hidden select-none">
      <div className="max-w-[1360px] mx-auto space-y-16">
        {/* Top Action & Invitation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[var(--ink)] tracking-tight leading-[1.05]">
              Experience Airspace Observability.
            </h2>
            <p className="text-base text-[var(--ink-2)] leading-relaxed">
              Open the live map to inspect active transponder returns, track long-haul great circle corridors, and decode aerodrome meteorology in real time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link href="/map" className="w-full sm:w-auto">
              <Button
                variant="signal"
                size="lg"
                icon="arrow-right"
                iconPosition="right"
                className="w-full sm:w-auto shadow-md group"
              >
                <span>Launch Live Radar Map</span>
              </Button>
            </Link>
            <Link href="/airports" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" icon="compass" className="w-full sm:w-auto">
                <span>Airport Directory</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Giant Instrument Serif Full-Width Wordmark Rising In */}
        <div className="pt-8 border-t border-[var(--line)] overflow-hidden">
          <div className="font-serif text-[clamp(3.5rem,11.5vw,10.5rem)] leading-[0.85] tracking-tighter text-[var(--ink)] font-normal text-center select-none opacity-90 hover:opacity-100 transition-opacity py-4">
            Aeroloom
          </div>
        </div>

        {/* Minimal Editorial Footer Links & Colophon */}
        <div className="border-t border-[var(--line)] pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs font-mono text-[var(--ink-3)]">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/map" className="hover:text-[var(--ink)] transition-colors">
              Radar Map
            </Link>
            <span>·</span>
            <Link href="/airports" className="hover:text-[var(--ink)] transition-colors">
              Airports
            </Link>
            <span>·</span>
            <Link href="/about/data" className="hover:text-[var(--ink)] transition-colors">
              Data &amp; Provenance
            </Link>
            <span>·</span>
            <Link href="/search" className="hover:text-[var(--ink)] transition-colors">
              Omnisearch
            </Link>
            <span>·</span>
            <Link href="/dev/aircraft" className="hover:text-[var(--ink)] transition-colors">
              Aircraft Silhouettes
            </Link>
            <span>·</span>
            <Link href="/dev/kit" className="hover:text-[var(--ink)] transition-colors">
              Design Kit
            </Link>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
            <span>LIGHT THEME · ARCHITECTURAL HONESTY · ZERO DARK MATTER</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
