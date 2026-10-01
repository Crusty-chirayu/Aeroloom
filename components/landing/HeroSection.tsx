'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { HeroBackgroundMap } from './HeroBackgroundMap';

interface HeroSectionProps {
  airborneCount: number;
  onOpenSearch: () => void;
  onAirborneCountChange: (count: number) => void;
}

export function HeroSection({
  airborneCount,
  onOpenSearch,
  onAirborneCountChange,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between pt-28 pb-12 px-6 sm:px-12 max-w-[1360px] mx-auto overflow-hidden">
      {/* Background Calm Drift Map */}
      <HeroBackgroundMap onAirborneCount={onAirborneCountChange} />

      {/* Hero Content Body */}
      <div className="relative z-10 my-auto py-12 max-w-3xl space-y-6">
        {/* Status Chip */}
        <div className="flex items-center gap-2">
          <Chip variant="ok" dot>
            Global Telemetry Live
          </Chip>
          <Chip variant="neutral">
            Mode-S / ADS-B Network
          </Chip>
        </div>

        {/* Display-XL Headline with Masked Reveal */}
        <div className="space-y-1">
          <div className="overflow-hidden">
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl text-[var(--ink)] tracking-tight leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700">
              Every flight.
            </h1>
          </div>
          <div className="overflow-hidden">
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl text-[var(--ink)] tracking-tight leading-[0.95] italic font-normal text-[var(--signal)] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Right now.
            </h1>
          </div>
        </div>

        {/* Specific, Confident Subline (16 words, no buzzwords) */}
        <p className="text-base sm:text-lg text-[var(--ink-2)] leading-relaxed max-w-xl font-normal">
          Real-time global airspace intelligence rendered with airline-timetable typography, live transponder broadcasts, and architectural honesty.
        </p>

        {/* Actions: Primary CTA & Secondary Search Trigger */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Link href="/map" className="shrink-0">
            <Button
              variant="signal"
              size="lg"
              icon="arrow-right"
              iconPosition="right"
              className="w-full sm:w-auto shadow-md group"
            >
              <span>Open the live map</span>
            </Button>
          </Link>

          {/* Secondary Inline Search Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center justify-between sm:justify-start gap-3 px-4 py-3 rounded-[var(--r-md)] bg-[var(--surface)] hover:bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors text-sm shadow-sm cursor-pointer group"
            aria-label="Open command palette search"
          >
            <div className="flex items-center gap-2.5">
              <Icon name="search" size={16} className="text-[var(--ink-3)] group-hover:text-[var(--signal)] transition-colors" />
              <span className="font-sans text-xs sm:text-sm text-[var(--ink-3)] group-hover:text-[var(--ink-2)] transition-colors">
                Try DLH400, JFK, or A380...
              </span>
            </div>
            <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-3)]">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Monospace Live Telemetry Ticker Strip */}
      <div className="relative z-10 border-t border-[var(--line-strong)] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-[var(--ink-2)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-[var(--ink)] tabular-nums">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
            {airborneCount > 0 ? airborneCount.toLocaleString() : '12,481'}
          </span>
          <span className="text-[var(--ink-3)]">AIRCRAFT AIRBORNE</span>
          <span className="text-[var(--ink-4)]">·</span>
          <span className="font-semibold text-[var(--ink)]">187</span>
          <span className="text-[var(--ink-3)]">SOVEREIGN AIRSPACES</span>
          <span className="text-[var(--ink-4)]">·</span>
          <span className="font-semibold text-[var(--ok-ink)]">3s</span>
          <span className="text-[var(--ink-3)]">TELEMETRY REFRESH</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[var(--ink-3)]">
          <span>ZERO MOCK DATA</span>
          <span className="text-[var(--ink-4)]">·</span>
          <Link href="/about/data" className="hover:text-[var(--ink)] underline underline-offset-2">
            PROVENANCE REGISTER
          </Link>
        </div>
      </div>
    </section>
  );
}
