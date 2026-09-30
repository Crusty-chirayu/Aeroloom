'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Icon,
  LUCIDE_ICONS,
  CUSTOM_ICONS,
  type IconName,
} from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';

export default function DevIconsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSize, setActiveSize] = useState<number>(24);
  const [activeStroke, setActiveStroke] = useState<number>(1.5);
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'lucide'>('all');

  const customIconNames = Object.keys(CUSTOM_ICONS) as IconName[];
  const lucideIconNames = Object.keys(LUCIDE_ICONS) as IconName[];

  const allIcons: { name: IconName; isCustom: boolean }[] = [
    ...customIconNames.map((n) => ({ name: n, isCustom: true })),
    ...lucideIconNames.map((n) => ({ name: n, isCustom: false })),
  ];

  const filteredIcons = allIcons.filter(({ name, isCustom }) => {
    if (filterType === 'custom' && !isCustom) return false;
    if (filterType === 'lucide' && isCustom) return false;
    if (!searchQuery) return true;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 md:p-8 max-w-7xl mx-auto selection:bg-[var(--signal-wash)] selection:text-[var(--signal-ink)]">
      {/* Header */}
      <header className="border-b border-[var(--line-strong)] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/dev/kit"
              className="font-mono text-xs text-[var(--ink-3)] hover:text-[var(--signal)] underline transition-colors"
            >
              ← Dev Kit
            </Link>
            <span className="text-[var(--ink-4)]">/</span>
            <Link
              href="/dev/aircraft"
              className="font-mono text-xs text-[var(--ink-3)] hover:text-[var(--signal)] underline transition-colors"
            >
              Aircraft Specimen
            </Link>
            <span className="text-[var(--ink-4)]">/</span>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--signal)] font-medium">
              Icon Registry
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-normal tracking-tight">
            Icon Registry & Aviation Glyphs
          </h1>
          <p className="text-[var(--ink-2)] text-sm md:text-base mt-1 max-w-2xl">
            Unified 24px grid / 1.5px stroke icon family. Featuring custom hand-drawn aeronautical
            glyphs (takeoff, landing, runway, tower, altitude, squawk) alongside curated Lucide base icons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Chip variant="signal">
            {customIconNames.length} Custom Aviation Glyphs
          </Chip>
          <Chip variant="neutral">
            {lucideIconNames.length} Base Icons
          </Chip>
        </div>
      </header>

      {/* Control Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper-warm)] mb-8">
        {/* Search */}
        <div className="flex-1 min-w-[240px] max-w-md">
          <label className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-3)] mb-1">
            SEARCH GLYPH REGISTRY
          </label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search icons (e.g. takeoff, runway, altitude, compass)..."
            className="w-full px-3.5 py-2 text-xs font-mono rounded-[var(--r-sm)] border border-[var(--line-strong)] bg-[var(--paper)] focus:outline-none focus:ring-2 focus:ring-[var(--signal)]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 border border-[var(--line)] rounded-[var(--r-sm)] p-0.5 bg-[var(--paper)]">
          {(['all', 'custom', 'lucide'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterType(mode)}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded-[6px] transition-all ${
                filterType === mode
                  ? 'bg-[var(--paper-warm)] text-[var(--ink)] font-semibold shadow-sm'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Size Selection */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--ink-3)] uppercase tracking-wider">
            Size:
          </span>
          <div className="flex items-center gap-1 border border-[var(--line)] rounded-[var(--r-sm)] p-0.5 bg-[var(--paper)]">
            {[16, 20, 24, 32].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveSize(s)}
                className={`px-2.5 py-1 font-mono text-xs rounded-[6px] transition-all ${
                  activeSize === s
                    ? 'bg-[var(--paper-warm)] font-bold text-[var(--signal-ink)]'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                }`}
              >
                {s}px
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Width Selection */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--ink-3)] uppercase tracking-wider">
            Stroke:
          </span>
          <div className="flex items-center gap-1 border border-[var(--line)] rounded-[var(--r-sm)] p-0.5 bg-[var(--paper)]">
            {[1, 1.5, 2].map((sw) => (
              <button
                key={sw}
                type="button"
                onClick={() => setActiveStroke(sw)}
                className={`px-2.5 py-1 font-mono text-xs rounded-[6px] transition-all ${
                  activeStroke === sw
                    ? 'bg-[var(--paper-warm)] font-bold text-[var(--signal-ink)]'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                }`}
              >
                {sw}px
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Aviation Icons Callout Section */}
      {(filterType === 'all' || filterType === 'custom') && !searchQuery && (
        <div className="mb-10 p-6 rounded-[var(--r-lg)] border border-[var(--signal)] bg-[var(--signal-wash)]/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--signal)]" />
                <h2 className="font-serif text-2xl font-normal text-[var(--signal-ink)]">
                  Hand-Crafted Aviation Glyphs (Spec 6.1)
                </h2>
              </div>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Authored specifically for Aeroloom flight status, runway directions, altimeter telemetry, and ATC airspace indicators.
              </p>
            </div>
            <Chip variant="signal">
              Spec 6.1 Complete
            </Chip>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {customIconNames.map((name) => (
              <div
                key={name}
                className="flex flex-col items-center justify-center p-4 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] hover:border-[var(--signal)] hover:shadow-[var(--sh-1)] transition-all"
              >
                <div className="h-12 flex items-center justify-center text-[var(--ink)]">
                  <Icon name={name} size={activeSize} strokeWidth={activeStroke} />
                </div>
                <span className="font-mono text-[11px] text-[var(--ink)] font-semibold mt-2 tracking-tight text-center">
                  {name}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--signal-ink)] mt-0.5">
                  Custom Aviation
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <section data-testid="all-icons-grid">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-[var(--ink-3)]">
            All Registered Icons ({filteredIcons.length})
          </h2>
          <span className="font-mono text-xs text-[var(--ink-3)]">
            Viewing at {activeSize}px · {activeStroke}px stroke
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredIcons.map(({ name, isCustom }) => (
            <div
              key={name}
              className={`flex flex-col items-center justify-center p-4 rounded-[var(--r-md)] border transition-all ${
                isCustom
                  ? 'border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--signal)]'
                  : 'border-[var(--line)] bg-[var(--paper)]/60 hover:bg-[var(--paper)]'
              }`}
            >
              <div className="h-12 flex items-center justify-center text-[var(--ink)]">
                <Icon name={name} size={activeSize} strokeWidth={activeStroke} />
              </div>
              <span className="font-mono text-[11px] text-[var(--ink)] font-medium mt-2 tracking-tight text-center truncate max-w-full">
                {name}
              </span>
              <span
                className={`font-mono text-[9px] uppercase tracking-wider mt-0.5 ${
                  isCustom ? 'text-[var(--signal-ink)] font-bold' : 'text-[var(--ink-4)]'
                }`}
              >
                {isCustom ? 'Aviation' : 'Base'}
              </span>
            </div>
          ))}
        </div>

        {filteredIcons.length === 0 && (
          <div className="text-center py-16 border border-dashed border-[var(--line)] rounded-[var(--r-md)]">
            <p className="font-serif text-xl text-[var(--ink-2)]">No icons matched &quot;{searchQuery}&quot;</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="mt-3 font-mono text-xs text-[var(--signal)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
