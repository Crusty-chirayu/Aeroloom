'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between p-6 md:p-12 max-w-[1360px] mx-auto">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Link href="/map">
          <Button variant="ghost" size="sm" icon="arrow-left">
            Live Radar
          </Button>
        </Link>
        <span className="mono-label text-[11px] text-[var(--ink-3)]">
          TELEMETRY ANOMALY
        </span>
      </header>

      <main className="py-16 max-w-xl mx-auto text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[var(--bad)]/30" />
          <svg
            viewBox="0 0 64 64"
            width="40"
            height="40"
            className="fill-[var(--bad)] opacity-80"
          >
            <path d={SILHOUETTES.unknown.bodyPath} />
          </svg>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Chip variant="bad" dot>Transponder Failure</Chip>
          <Chip variant="neutral">System Alert</Chip>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl text-[var(--ink)] tracking-tight">
          Sector Pipeline Interruption
        </h1>

        <p className="text-base text-[var(--ink-2)] leading-relaxed max-w-md mx-auto">
          An unexpected error occurred while processing live radar telemetry: {error.message || 'System fault'}.
        </p>

        {error.digest && (
          <div className="font-mono text-xs text-[var(--ink-3)] p-2 rounded bg-[var(--paper-2)] border border-[var(--line)] max-w-xs mx-auto">
            FAULT DIGEST: {error.digest}
          </div>
        )}

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Button variant="ink" size="md" onClick={() => reset()} icon="refresh">
            Retry Radar Sync
          </Button>
          <Link href="/map">
            <Button variant="outline" size="md" icon="plane">
              Return to Map
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] pt-4 text-xs font-mono text-[var(--ink-3)] text-center">
        AEROLOOM ERROR SHIELD · FAULT ISOLATION PROTOCOL
      </footer>
    </div>
  );
}
