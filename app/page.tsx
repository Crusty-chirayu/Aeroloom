import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between px-6 py-12 md:px-16 md:py-20 max-w-[1360px] mx-auto">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-6">
        <div className="flex items-center gap-3">
          <span className="font-serif text-2xl tracking-tight text-[var(--ink)] font-normal">
            Aeroloom
          </span>
          <Chip variant="signal">Phase 0 Foundations</Chip>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dev/kit" className="text-sm font-medium text-[var(--ink-2)] hover:text-[var(--ink)]">
            Design Kit
          </Link>
          <Link href="/about/data" className="text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)]">
            Data Sources
          </Link>
        </nav>
      </header>

      {/* Hero Display Teaser */}
      <div className="py-20 md:py-32 flex flex-col gap-8 max-w-3xl">
        <div className="flex items-center gap-2">
          <Chip variant="neutral" dot>Editorial Aviation Language</Chip>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-[var(--ink)] tracking-tight">
          Every flight. <span className="italic font-normal">Right now.</span>
        </h1>

        <p className="text-lg md:text-xl text-[var(--ink-2)] font-normal leading-relaxed max-w-xl">
          An airline-timetable sensibility rendered with modern precision. Warm paper, ink-black typography, hairline rules, and real live telemetry.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Link href="/dev/kit">
            <Button variant="signal" size="lg" icon="arrow-right" iconPosition="right">
              Inspect Component Kit (/dev/kit)
            </Button>
          </Link>
          <Link href="/map">
            <Button variant="outline" size="lg" icon="plane">
              Live Map Stub (/map)
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="border-t border-[var(--line)] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-[var(--ink-3)]">
        <div>
          <span>AEROLOOM FLIGHT INTELLIGENCE · PHASE 0 FOUNDATIONS</span>
        </div>
        <div>
          <span>LIGHT THEME · WCAG AA · ZERO DARK MATTER</span>
        </div>
      </footer>
    </main>
  );
}
