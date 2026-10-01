import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between p-6 md:p-12 max-w-[1360px] mx-auto">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Link href="/map">
          <Button variant="ghost" size="sm" icon="arrow-left">
            Live Radar
          </Button>
        </Link>
        <span className="mono-label text-[11px] text-[var(--ink-3)]">
          TRANSPONDER TRANSPARENCY
        </span>
      </header>

      <main className="py-16 max-w-xl mx-auto text-center space-y-6">
        {/* Subtle Silhouette Illustration with concentric radar rings */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[var(--line)] opacity-60" />
          <div className="absolute inset-3 rounded-full border border-[var(--line)] opacity-80" />
          <div className="absolute inset-6 rounded-full border border-dashed border-[var(--signal)]/30 animate-pulse" />
          <svg
            viewBox="0 0 64 64"
            width="44"
            height="44"
            className="fill-[var(--ink)] opacity-70 relative z-10"
          >
            <path d={SILHOUETTES.unknown.bodyPath} />
          </svg>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Chip variant="bad" dot>Squawk 7600 · Lost Contact</Chip>
          <Chip variant="neutral">Code 404</Chip>
        </div>

        <h1 className="font-serif text-5xl md:text-6xl text-[var(--ink)] tracking-tight">
          Airspace Sector <span className="italic font-normal">Void</span>
        </h1>

        <p className="text-base text-[var(--ink-2)] leading-relaxed max-w-md mx-auto">
          The requested flight transponder address, aerodrome station, or dossier could not be resolved on current radar sweeps.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/map">
            <Button variant="ink" size="md" icon="plane">
              Return to Live Radar
            </Button>
          </Link>
          <Link href="/airports">
            <Button variant="outline" size="md" icon="compass">
              Airports Index
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="ghost" size="md" icon="search">
              Omnisearch (⌘K)
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] pt-4 text-xs font-mono text-[var(--ink-3)] text-center">
        AEROLOOM RADAR OBSERVABILITY · UNMAPPED SECTOR COORDINATE
      </footer>
    </div>
  );
}
