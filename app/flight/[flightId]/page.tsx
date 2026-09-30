'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';

interface FlightPageProps {
  params: Promise<{
    flightId: string;
  }>;
}

export default function FlightDetailPage({ params }: FlightPageProps) {
  const resolvedParams = use(params);
  const flightId = resolvedParams.flightId.toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between p-6 md:p-12 max-w-[1360px] mx-auto">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" icon="arrow-left">
            Home
          </Button>
        </Link>
        <span className="mono-label text-[11px] text-[var(--ink-3)]">
          FLIGHT DOSSIER STUB · PHASE 4 FULL BUILD
        </span>
      </header>

      <main className="py-12 max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Chip variant="signal">Phase 4 Target</Chip>
          <Chip variant="sky" dot>Editorial Layout</Chip>
        </div>

        <h1 className="font-serif text-5xl md:text-6xl text-[var(--ink)] tracking-tight">
          Flight Dossier: <span className="italic font-normal">{flightId}</span>
        </h1>

        <Panel variant="surface" padding="md" radius="md" className="space-y-4">
          <p className="text-sm text-[var(--ink-2)] leading-relaxed">
            The full editorial flight page featuring route progress lines, technical blueprint line-drawings, altitude and speed sparklines, and verified schedule details will be constructed in Phase 4.
          </p>
          <div className="pt-2 font-mono text-xs text-[var(--ink-3)] flex items-center justify-between border-t border-[var(--line)]">
            <span>TARGET IDENTIFIER:</span>
            <span className="font-bold text-[var(--ink)]">{flightId}</span>
          </div>
        </Panel>

        <div className="pt-4 flex items-center gap-3">
          <Link href="/dev/kit">
            <Button variant="outline" size="md" icon="arrow-right" iconPosition="right">
              Inspect Component Kit (/dev/kit)
            </Button>
          </Link>
          <Link href="/map">
            <Button variant="ghost" size="md" icon="plane">
              Live Map
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] pt-4 text-xs font-mono text-[var(--ink-3)]">
        ROUTE: /flight/{flightId} · WCAG AA COMPLIANT
      </footer>
    </div>
  );
}
