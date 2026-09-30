import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <Chip variant="bad">Squawk 7600 · Lost Contact</Chip>
        <h1 className="font-serif text-6xl md:text-7xl text-[var(--ink)]">
          404 <span className="italic font-normal">Airspace Void</span>
        </h1>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">
          The requested flight vector, sector coordinate, or document cannot be found on current radar sweeps.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/">
            <Button variant="ink" size="md" icon="arrow-left">
              Return Home
            </Button>
          </Link>
          <Link href="/dev/kit">
            <Button variant="outline" size="md" icon="layers">
              Design Kit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
