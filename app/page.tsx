'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LenisProvider } from '@/lib/motion/LenisProvider';
import { LandingNav } from '@/components/landing/LandingNav';
import { PreloaderArc } from '@/components/landing/PreloaderArc';
import { HeroSection } from '@/components/landing/HeroSection';
import { FollowFlightSection } from '@/components/landing/FollowFlightSection';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

export default function Home() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [airborneCount, setAirborneCount] = useState(12481);

  return (
    <LenisProvider>
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] relative selection:bg-[var(--signal)] selection:text-white">
        {/* Preloader Arc (max 1.1s, session-isolated, skippable) */}
        <PreloaderArc airborneCount={airborneCount} />

        {/* Global Floating Pill Navigation */}
        <LandingNav onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Section 1: Hero with Masked Reveal & Live Scripted Drift Map */}
        <HeroSection
          airborneCount={airborneCount}
          onOpenSearch={() => setIsSearchOpen(true)}
          onAirborneCountChange={setAirborneCount}
        />

        {/* Section 2: Pinned "Follow One Flight" Storytelling Section (~300vh) */}
        <FollowFlightSection />

        {/* Interim Gateway Section transitioning to Phase 5B */}
        <section className="py-24 px-6 sm:px-12 max-w-[1360px] mx-auto border-t border-[var(--line)]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-[var(--line)]">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <Chip variant="signal">Live Airspace Systems</Chip>
                <Chip variant="neutral">Open Access</Chip>
              </div>
              <h2 className="font-serif text-4xl sm:text-6xl text-[var(--ink)] tracking-tight">
                Global Airspace at Your Fingertips.
              </h2>
              <p className="text-base text-[var(--ink-2)] leading-relaxed">
                Explore real Mode-S transponder returns, live weather observations, and aircraft dossiers with airline-timetable typography and zero mock data.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link href="/map" className="w-full sm:w-auto">
                <Button variant="signal" size="lg" icon="arrow-right" iconPosition="right" className="w-full sm:w-auto">
                  Launch Radar Observatory
                </Button>
              </Link>
              <Link href="/airports" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" icon="compass" className="w-full sm:w-auto">
                  Explore Hub Airports
                </Button>
              </Link>
            </div>
          </div>

          {/* Editorial Footer Grid */}
          <footer className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-[var(--ink-3)]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[var(--ink)]">AEROLOOM</span>
              <span>·</span>
              <span>PHASE 5A HERO &amp; STORYTELLING</span>
              <span>·</span>
              <span className="text-[var(--ok)] font-semibold">100% REAL ADS-B</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <Link href="/about/data" className="hover:text-[var(--ink)] transition-colors">
                Data Provenance
              </Link>
              <Link href="/airports" className="hover:text-[var(--ink)] transition-colors">
                Airport Directory
              </Link>
              <Link href="/search" className="hover:text-[var(--ink)] transition-colors">
                Omnisearch
              </Link>
            </div>
          </footer>
        </section>

        {/* Global Command Palette (⌘K) */}
        <CommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </div>
    </LenisProvider>
  );
}
