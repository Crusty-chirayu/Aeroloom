'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { AIRCRAFT_CATEGORIES, type AircraftCategory } from '@/lib/map/silhouettes/types';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';
import { AircraftBlueprint } from '@/components/aircraft/AircraftBlueprint';

const CATEGORY_KEYS: AircraftCategory[] = [
  'narrowbody',
  'widebody_twin',
  'quad',
  'regional_jet',
  'turboprop',
  'bizjet',
  'light_ga',
  'helicopter',
  'cargo',
  'military',
];

export function AircraftLibraryGrid() {
  const [selectedCategory, setSelectedCategory] = useState<AircraftCategory>('widebody_twin');
  const [hoveredCategory, setHoveredCategory] = useState<AircraftCategory | null>(null);

  const activeCategory = hoveredCategory || selectedCategory;
  const activeMeta = AIRCRAFT_CATEGORIES[activeCategory];

  return (
    <section className="py-24 px-6 sm:px-12 max-w-[1360px] mx-auto border-t border-[var(--line)] space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Chip variant="signal">Custom Artwork</Chip>
            <Chip variant="neutral">Top-Down Vector Linework</Chip>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[var(--ink)] tracking-tight">
            The Aircraft Library &amp; Specimen Grid
          </h2>
          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            Eleven hand-drawn vector silhouettes crafted specifically on a 64×64 precision grid. Every airframe maps real ICAO type codes to authentic wing geometry, engine configurations, and engineering dimensions.
          </p>
        </div>

        <Link href="/dev/aircraft" className="shrink-0">
          <Button variant="outline" size="sm" icon="arrow-right" iconPosition="right">
            Full Specimen Matrix (/dev/aircraft)
          </Button>
        </Link>
      </div>

      {/* Main Specimen Layout: Silhouette Grid (Left/Top) + Live Blueprint Drawing (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Silhouette Specimen Grid (7-col) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {CATEGORY_KEYS.map((catKey) => {
            const meta = AIRCRAFT_CATEGORIES[catKey];
            const def = SILHOUETTES[catKey];
            const isCurrent = activeCategory === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                onMouseEnter={() => setHoveredCategory(catKey)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`text-left p-4 rounded-[var(--r-md)] border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[175px] group ${
                  isCurrent
                    ? 'bg-[var(--surface)] border-[var(--signal)] shadow-sm'
                    : 'bg-[var(--surface)] hover:bg-[var(--paper-2)] border-[var(--line)] hover:border-[var(--line-strong)]'
                }`}
              >
                {/* Silhouette SVG Thumbnail */}
                <div className="h-14 flex items-center justify-center">
                  <svg
                    viewBox="0 0 64 64"
                    width="44"
                    height="44"
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isCurrent
                        ? 'text-[var(--signal)] fill-current'
                        : 'text-[var(--ink)] fill-current'
                    }`}
                  >
                    <path d={def.bodyPath} />
                  </svg>
                </div>

                {/* Metadata */}
                <div className="space-y-0.5 border-t border-[var(--line)] pt-2 font-mono">
                  <div className="font-bold text-xs text-[var(--ink)] flex items-center justify-between">
                    <span className="truncate pr-1">{meta.name}</span>
                    <span className="text-[10px] text-[var(--signal)] shrink-0">{meta.typicalWingspanM}m</span>
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] truncate">
                    {meta.exampleModels.slice(0, 2).join(', ')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Technical Blueprint Preview (5-col) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs text-[var(--ink-3)]">
            <span className="mono-label text-[10px] text-[var(--signal)] font-bold">
              ENGINEERING BLUEPRINT VIEW
            </span>
            <span>{activeMeta.name.toUpperCase()}</span>
          </div>

          <div className="rounded-[var(--r-lg)] border border-[var(--line-strong)] bg-[var(--surface)] p-2 shadow-sm">
            <AircraftBlueprint category={activeCategory} />
          </div>

          <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--line)] space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-[var(--line)] pb-1.5">
              <span className="text-[var(--ink-3)]">REPRESENTATIVE TYPES</span>
              <span className="font-bold text-[var(--ink)] truncate max-w-[220px] text-right">{activeMeta.exampleModels.join(' · ')}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-1.5">
              <span className="text-[var(--ink-3)]">WINGSPAN / LENGTH</span>
              <span className="font-bold text-[var(--ink)]">
                {activeMeta.typicalWingspanM}m / {activeMeta.typicalLengthM}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">ICAO TYPE DESIGNATORS</span>
              <span className="font-bold text-[var(--signal)]">175+ RESOLVED CODES</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
