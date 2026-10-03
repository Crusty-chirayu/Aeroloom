'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AircraftCategory,
  SilhouetteState,
  AIRCRAFT_CATEGORIES,
} from '@/lib/map/silhouettes/types';
import { AircraftSilhouette } from '@/lib/map/silhouettes/AircraftSilhouette';
import { ICAO_TYPE_MAP, getAircraftCategory } from '@/lib/map/typeMapping';
import { AircraftBlueprint } from '@/components/aircraft/AircraftBlueprint';
import { Chip } from '@/components/ui/Chip';

const ALL_CATEGORIES: AircraftCategory[] = [
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
  'unknown',
];

const ALL_STATES: SilhouetteState[] = [
  'default',
  'selected',
  'hover',
  'stale',
  'on_ground',
  'ground_shadow',
];

const SIZES = [24, 32, 48, 96] as const;

export default function DevAircraftSpecimenPage() {
  const [activeTab, setActiveTab] = useState<'silhouettes' | 'blueprint' | 'mapping'>('silhouettes');
  const [selectedCategory, setSelectedCategory] = useState<AircraftCategory>('narrowbody');
  const [testTypeCode, setTestTypeCode] = useState('B789');
  const [bgMode, setBgMode] = useState<'paper' | 'white'>('paper');
  const [rotationDeg, setRotationDeg] = useState(0);

  const resolvedCategory = getAircraftCategory(testTypeCode);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 md:p-8 max-w-7xl mx-auto selection:bg-[var(--signal-wash)] selection:text-[var(--signal-ink)]">
      {/* Top Header */}
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
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--signal)] font-medium">
              Phase 2 Specimen
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-normal tracking-tight">
            Aeronautical Silhouettes & Blueprints
          </h1>
          <p className="text-[var(--ink-2)] text-sm md:text-base mt-1 max-w-2xl">
            11 hand-crafted top-down vector silhouettes on a 64×64 grid across 6 tactical states,
            175+ ICAO type mapping engine, and 3-view technical blueprints.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 border border-[var(--line)] rounded-[var(--r-md)] p-1 bg-[var(--paper-warm)] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('silhouettes')}
            className={`px-3 py-1.5 rounded-[var(--r-sm)] font-mono text-xs tracking-wider uppercase transition-all ${
              activeTab === 'silhouettes'
                ? 'bg-[var(--paper)] text-[var(--ink)] font-semibold shadow-[var(--sh-1)]'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            Silhouettes ({ALL_CATEGORIES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-[var(--r-sm)] font-mono text-xs tracking-wider uppercase transition-all ${
              activeTab === 'blueprint'
                ? 'bg-[var(--paper)] text-[var(--ink)] font-semibold shadow-[var(--sh-1)]'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            Technical Blueprint
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`px-3 py-1.5 rounded-[var(--r-sm)] font-mono text-xs tracking-wider uppercase transition-all ${
              activeTab === 'mapping'
                ? 'bg-[var(--paper)] text-[var(--ink)] font-semibold shadow-[var(--sh-1)]'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            ICAO Mapping ({Object.keys(ICAO_TYPE_MAP).length})
          </button>
        </div>
      </header>

      {/* ─── TAB 1: SILHOUETTES SPECIMEN MATRIX ────────────────────────────── */}
      {activeTab === 'silhouettes' && (
        <section className="space-y-10" data-testid="silhouettes-specimen">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper-warm)]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--ink-3)] uppercase tracking-wider">
                Surface Canvas:
              </span>
              <div className="inline-flex rounded-[var(--r-sm)] border border-[var(--line)] p-0.5 bg-[var(--paper)]">
                <button
                  type="button"
                  onClick={() => setBgMode('paper')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-[6px] ${
                    bgMode === 'paper' ? 'bg-[var(--paper-warm)] font-semibold' : 'text-[var(--ink-3)]'
                  }`}
                >
                  Paper (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode('white')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-[6px] ${
                    bgMode === 'white' ? 'bg-white font-semibold shadow-sm' : 'text-[var(--ink-3)]'
                  }`}
                >
                  Pure White (#FFF)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--ink-3)] uppercase tracking-wider">
                Heading Rotation:
              </span>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={rotationDeg}
                onChange={(e) => setRotationDeg(Number(e.target.value))}
                className="w-28 accent-[var(--signal)]"
              />
              <span className="font-mono text-xs font-semibold w-10 text-right">
                {String(rotationDeg).padStart(3, '0')}°
              </span>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-8">
            {ALL_CATEGORIES.map((category) => {
              const meta = AIRCRAFT_CATEGORIES[category];
              return (
                <div
                  key={category}
                  className={`p-6 rounded-[var(--r-lg)] border border-[var(--line)] transition-colors ${
                    bgMode === 'white' ? 'bg-white shadow-[var(--sh-1)]' : 'bg-[var(--paper)]'
                  }`}
                >
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[var(--line)] pb-3 mb-6 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded bg-[var(--signal-wash)] text-[var(--signal-ink)] font-semibold">
                          {category}
                        </span>
                        <h2 className="font-serif text-xl md:text-2xl font-normal">{meta.name}</h2>
                      </div>
                      <p className="text-xs text-[var(--ink-3)] mt-0.5">{meta.description}</p>
                    </div>

                    <div className="font-mono text-xs text-[var(--ink-2)] flex gap-4">
                      <span>SPAN: {meta.typicalWingspanM}m</span>
                      <span>LEN: {meta.typicalLengthM}m</span>
                    </div>
                  </div>

                  {/* States Row at 48px */}
                  <div className="mb-6">
                    <span className="block font-mono text-[10px] uppercase text-[var(--ink-3)] tracking-wider mb-2">
                      Tactical States (48px Specimen)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {ALL_STATES.map((state) => (
                        <div
                          key={state}
                          className="flex flex-col items-center justify-center p-3 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper-warm)]/40 hover:border-[var(--signal)] transition-colors"
                        >
                          <div className="h-16 flex items-center justify-center">
                            <AircraftSilhouette
                              category={category}
                              state={state}
                              size={48}
                              rotationDeg={rotationDeg}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase mt-2 tracking-wide">
                            {state.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Size Hierarchy Specimen (24, 32, 48, 96 px) */}
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-[var(--ink-3)] tracking-wider mb-2">
                      Resolution Scaling Scale (24px, 32px, 48px, 96px)
                    </span>
                    <div className="flex flex-wrap items-end gap-6 p-4 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper-warm)]/20">
                      {SIZES.map((size) => (
                        <div key={size} className="flex flex-col items-center gap-1.5">
                          <div
                            className="flex items-center justify-center border border-dashed border-[var(--line-strong)] rounded-[6px]"
                            style={{ width: size + 8, height: size + 8 }}
                          >
                            <AircraftSilhouette
                              category={category}
                              state="default"
                              size={size}
                              rotationDeg={rotationDeg}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-[var(--ink-3)]">
                            {size}px
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── TAB 2: TECHNICAL BLUEPRINTS ─────────────────────────────────── */}
      {activeTab === 'blueprint' && (
        <section className="space-y-6" data-testid="blueprint-specimen">
          {/* Category Picker Strip */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-[var(--r-sm)] font-mono text-xs uppercase tracking-wider transition-all border ${
                  selectedCategory === cat
                    ? 'border-[var(--signal)] bg-[var(--signal-wash)] text-[var(--signal-ink)] font-semibold'
                    : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Interactive Technical Blueprint Component */}
          <AircraftBlueprint category={selectedCategory} />
        </section>
      )}

      {/* ─── TAB 3: ICAO TYPE MAPPING ENGINE ──────────────────────────────── */}
      {activeTab === 'mapping' && (
        <section className="space-y-8" data-testid="mapping-specimen">
          {/* Live Interactive Lookup Box */}
          <div className="p-6 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--paper-warm)]">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--signal)] font-semibold">
              Live Type Resolver Test
            </span>
            <h2 className="font-serif text-2xl mt-1 mb-4">Test Any ICAO Code</h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-xl">
              <input
                type="text"
                value={testTypeCode}
                onChange={(e) => setTestTypeCode(e.target.value.toUpperCase())}
                placeholder="Enter ICAO (e.g. B789, A388, C172, H145, FA7X)..."
                maxLength={8}
                className="flex-1 px-4 py-2.5 font-mono text-base uppercase rounded-[var(--r-sm)] border border-[var(--line-strong)] bg-[var(--paper)] focus:outline-none focus:ring-2 focus:ring-[var(--signal)]"
              />
              <div className="flex items-center gap-3 px-4 py-2 rounded-[var(--r-sm)] bg-[var(--paper)] border border-[var(--line)]">
                <AircraftSilhouette category={resolvedCategory} state="selected" size={32} />
                <div>
                  <span className="block font-mono text-[10px] text-[var(--ink-3)] uppercase">Resolved</span>
                  <span className="font-mono text-xs font-semibold uppercase">{resolvedCategory}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Complete 175+ Mappings Table */}
          <div className="rounded-[var(--r-lg)] border border-[var(--line)] overflow-hidden bg-[var(--paper)]">
            <div className="p-4 border-b border-[var(--line)] bg-[var(--paper-warm)]/40 flex justify-between items-center">
              <h3 className="font-mono text-xs uppercase tracking-wider font-semibold">
                Mapped ICAO Designators ({Object.keys(ICAO_TYPE_MAP).length} total)
              </h3>
              <Chip variant="neutral">
                Zero Fallback Gaps
              </Chip>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="sticky top-0 bg-[var(--paper-warm)] border-b border-[var(--line)] text-[var(--ink-3)]">
                  <tr>
                    <th className="px-4 py-2.5">ICAO Code</th>
                    <th className="px-4 py-2.5">Silhouette Category</th>
                    <th className="px-4 py-2.5">Live Preview</th>
                    <th className="px-4 py-2.5">Category Models</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {Object.entries(ICAO_TYPE_MAP).map(([code, category]) => {
                    const meta = AIRCRAFT_CATEGORIES[category];
                    return (
                      <tr key={code} className="hover:bg-[var(--paper-warm)]/30 transition-colors">
                        <td className="px-4 py-2 font-bold text-[var(--ink)]">{code}</td>
                        <td className="px-4 py-2 text-[var(--ink-2)]">{category}</td>
                        <td className="px-4 py-2">
                          <AircraftSilhouette category={category} state="default" size={24} />
                        </td>
                        <td className="px-4 py-2 text-[var(--ink-3)] text-[11px]">
                          {meta.exampleModels.join(', ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
