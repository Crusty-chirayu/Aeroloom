'use client';

import React, { useState } from 'react';
import { LenisProvider } from '@/lib/motion/LenisProvider';
import { LandingNav } from '@/components/landing/LandingNav';
import { PreloaderArc } from '@/components/landing/PreloaderArc';
import { HeroSection } from '@/components/landing/HeroSection';
import { FollowFlightSection } from '@/components/landing/FollowFlightSection';
import { CapabilitiesBento } from '@/components/landing/CapabilitiesBento';
import { SplitFlapAirportBoard } from '@/components/landing/SplitFlapAirportBoard';
import { AircraftLibraryGrid } from '@/components/landing/AircraftLibraryGrid';
import { TrustAndDataSection } from '@/components/landing/TrustAndDataSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CommandPalette } from '@/components/ui/CommandPalette';

export default function Home() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [airborneCount, setAirborneCount] = useState(12481);

  return (
    <LenisProvider>
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] relative selection:bg-[var(--signal)] selection:text-white">
        {/* Section 0: Preloader Arc (max 1.1s, session-isolated, skippable) */}
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

        {/* Section 3: Capabilities Asymmetric Bento Grid (12-col) */}
        <CapabilitiesBento />

        {/* Section 4: Split-Flap Departures Airport Board */}
        <SplitFlapAirportBoard />

        {/* Section 5: Aircraft Library & Specimen Grid */}
        <AircraftLibraryGrid />

        {/* Section 6: Trust & Data Provenance */}
        <TrustAndDataSection />

        {/* Section 7: Final CTA & Editorial Footer with Full-Width Wordmark */}
        <LandingFooter />

        {/* Global Command Palette (⌘K) */}
        <CommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </div>
    </LenisProvider>
  );
}
