import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

export default function MapPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between px-6 py-12 md:px-16 md:py-20 max-w-[1360px] mx-auto">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-serif text-2xl tracking-tight text-[var(--ink)]">
            Aeroloom
          </Link>
          <Chip variant="neutral">Airspace Radar</Chip>
        </div>
        <Link href="/dev/kit">
          <Button variant="ghost" size="sm" icon="layers">
            Component Kit
          </Button>
        </Link>
      </header>

      <div className="py-24 max-w-2xl flex flex-col gap-6">
        <Chip variant="sky" dot>Coming in Phase 3</Chip>
        <h1 className="font-serif text-4xl md:text-6xl text-[var(--ink)]">
          Live Tactical <span className="italic font-normal">MapLibre</span> Radar
        </h1>
        <p className="text-base text-[var(--ink-2)] leading-relaxed">
          The full-viewport 2D vector radar with 60 fps dead-reckoning interpolation, altitude ramp colorways, and right-rail flight dossier will be built in Phase 3.
        </p>
        <div className="pt-2">
          <Link href="/dev/kit">
            <Button variant="signal" size="md" icon="arrow-right" iconPosition="right">
              View Design Kit (/dev/kit)
            </Button>
          </Link>
        </div>
      </div>

      <footer className="border-t border-[var(--line)] pt-6 text-xs font-mono text-[var(--ink-3)]">
        ROUTE: /map · BASEMAP ARCHITECTURE READY
      </footer>
    </main>
  );
}
