'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { CommandPalette } from '@/components/ui/CommandPalette';

export default function SearchPage() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between p-6 md:p-12 max-w-[1360px] mx-auto">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" icon="arrow-left">
            Home
          </Button>
        </Link>
        <span className="mono-label text-[11px] text-[var(--ink-3)]">
          GLOBAL OMNISEARCH · ⌘K
        </span>
      </header>

      <main className="py-16 max-w-xl mx-auto text-center space-y-6">
        <Chip variant="signal">Command Palette</Chip>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--ink)]">
          Search Flights, Airports & Routes
        </h1>
        <p className="text-base text-[var(--ink-2)]">
          Press <kbd className="px-2 py-0.5 font-mono text-xs bg-[var(--paper-2)] rounded border border-[var(--line)]">⌘K</kbd> or <kbd className="px-2 py-0.5 font-mono text-xs bg-[var(--paper-2)] rounded border border-[var(--line)]">/</kbd> anywhere in the application to summon the command bar.
        </p>

        <div>
          <Button
            variant="ink"
            size="lg"
            icon="search"
            onClick={() => setOpen(true)}
          >
            Open Command Palette (⌘K)
          </Button>
        </div>

        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          onSelectFlight={(callsign) => {
            window.location.href = `/flight/${callsign.toLowerCase()}`;
          }}
          onSelectAirport={(icao) => {
            window.location.href = `/airport/${icao.toLowerCase()}`;
          }}
        />
      </main>

      <footer className="border-t border-[var(--line)] pt-4 text-xs font-mono text-[var(--ink-3)] text-center">
        ROUTE: /search · AIRSPACE INTELLIGENCE COMMAND
      </footer>
    </div>
  );
}
