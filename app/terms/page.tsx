import React from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { siteConfig } from '@/lib/site-config';

export const metadata = {
  title: 'Terms of Service — Aeroloom',
  description: 'Terms and conditions governing the access, use, and data consumption of the Aeroloom flight observatory.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-85 transition-opacity" aria-label="Aeroloom Home">
            <AeroloomLogo variant="lockup" size="sm" />
          </Link>
          <Link href="/map">
            <Button variant="outline" size="sm" icon="radio">
              Live Radar
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[800px] mx-auto px-6 sm:px-12 py-16 space-y-12">
        <div className="space-y-4">
          <Chip variant="neutral">LEGAL DIRECTIVE</Chip>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Terms of Service
          </h1>
          <p className="font-mono text-xs text-[var(--ink-3)]">
            LAST REVISED: OCTOBER 2026 · APPLICABLE TO ALL AEROLOOM TELEMETRY SURFACES
          </p>
        </div>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing, browsing, or utilizing any portion of Aeroloom (including its web application, API route proxies, telemetry cache endpoints, and grounded intelligence interfaces), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            2. Operational Non-Reliance &amp; Flight Safety Disclaimer
          </h2>
          <div className="p-4 rounded-md bg-[var(--signal-wash)] border border-[var(--signal)]/30 text-xs sm:text-sm text-[var(--signal-ink)] font-mono space-y-2">
            <div className="font-bold uppercase tracking-wider">CRITICAL FLIGHT SAFETY DIRECTIVE:</div>
            <p>
              AEROLOOM IS A RESEARCH, EDUCATIONAL, AND ENTHUSIAST OBSERVATORY ONLY. UNDER NO CIRCUMSTANCES SHALL AEROLOOM BE USED AS A PRIMARY OR SECONDARY TOOL FOR IN-FLIGHT NAVIGATION, AIR TRAFFIC DECONFLICTION, FLIGHT PLANNING, TERRAIN AVOIDANCE, OR LIFE-SAFETY AVIATION OPERATIONS.
            </p>
          </div>
          <p>
            All position reports, ground tracks, altitudes, and speeds are subject to crowdsourced sensor occlusion, latency, packet dropouts, and dead-reckoning approximation. Always consult official certified avionics, FAA/EASA certified flight dispatch services, and official Air Traffic Control (ATC) communications.
          </p>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            3. Data Provenance &amp; Attribution
          </h2>
          <p>
            Aeroloom aggregates publicly broadcast open transponder data (1090 MHz Mode-S / ADS-B) provided through open-source community collectives including airplanes.live and adsb.lol, weather telemetry from NOAA / Aviation Weather Center, and vector cartography from OpenStreetMap / OpenFreeMap contributors. You agree to respect all respective upstream licenses and rate limits.
          </p>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            4. Permitted Use &amp; Automated Scraping Boundaries
          </h2>
          <p>
            Personal, educational, and journalistic use of Aeroloom is welcomed. However, aggressive automated scraping, denial-of-service simulations, and circumventing rate-limiting headers (<code className="text-[var(--ink)] font-mono">120 req/min</code>) are strictly prohibited and subject to automated IP blocking.
          </p>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            5. Disclaimers &amp; Limitation of Liability
          </h2>
          <p>
            Aeroloom is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis, without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, the author ({siteConfig.developer.name}) and contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this platform.
          </p>
        </section>

        <div className="pt-6 border-t border-[var(--line)] flex items-center justify-between text-xs font-mono text-[var(--ink-3)]">
          <div>GOVERNING JURISDICTION: {siteConfig.owner.governingLaw}</div>
          <Link href="/disclaimer" className="text-[var(--ink)] hover:text-[var(--signal)] underline">
            Read Full Safety Disclaimer →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
