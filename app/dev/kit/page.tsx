'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Tooltip } from '@/components/ui/Tooltip';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Icon, LUCIDE_ICONS, CUSTOM_ICONS } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';

export default function DevKitPage() {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [inputValue, setInputValue] = useState('DAL397');
  const [inputError, setInputError] = useState('');
  const [monoInputValue, setMonoInputValue] = useState('KJFK 301200Z 28014G22KT 10SM BKN045');
  const [motionActive, setMotionActive] = useState(false);

  const reducedMotion = useReducedMotion();

  const lucideIconNames = Object.keys(LUCIDE_ICONS) as IconName[];
  const customIconNames = Object.keys(CUSTOM_ICONS) as IconName[];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-2xl tracking-tight text-[var(--ink)]">
              Aeroloom
            </Link>
            <span className="text-[var(--ink-4)]">/</span>
            <span className="mono-label text-[11px] text-[var(--ink-2)]">Design System Kit</span>
            <Chip variant="signal">Phase 0 Baseline</Chip>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon="search"
              onClick={() => setIsCommandOpen(true)}
            >
              <span>Command Palette</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 font-mono text-[10px] bg-[var(--paper-2)] rounded border border-[var(--line)]">
                ⌘K
              </kbd>
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm" icon="arrow-left">
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="border-b border-[var(--line)] bg-[var(--surface-2)]/50 py-16 px-6">
        <div className="max-w-[1360px] mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <Chip variant="neutral" dot>Editorial Aviation Language</Chip>
            {reducedMotion && <Chip variant="warn">prefers-reduced-motion active</Chip>}
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-[var(--ink)] tracking-tight">
            Design Tokens &amp; <span className="italic font-normal">Component Kit</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--ink-2)] max-w-2xl leading-relaxed">
            The complete visual surface specification for Aeroloom. Swiss timetable precision, warm paper surfaces, hairline rules, ink typography, and purposeful motion.
          </p>
        </div>
      </section>

      {/* Main Kit Container */}
      <main className="max-w-[1360px] mx-auto px-6 py-12 space-y-20">

        {/* ─────────────────────────────────────────────────────────────────
            1. TYPOGRAPHY SPECIMEN AT REAL SIZES
           ───────────────────────────────────────────────────────────────── */}
        <section id="typography" className="space-y-6">
          <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[var(--ink)]">1. Typography Specimen</h2>
            <span className="mono-label text-[11px]">Instrument Serif + Geist Sans + Geist Mono</span>
          </div>

          <div className="space-y-10">
            {/* Display XL */}
            <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-6 md:p-8 space-y-2">
              <div className="mono-label text-[11px] text-[var(--ink-3)] flex items-center justify-between">
                <span>DISPLAY-XL · clamp(96px, 14vw, 200px) · line-height: 0.92 · tracking: -0.03em</span>
                <span>Instrument Serif</span>
              </div>
              <p className="font-serif text-[clamp(48px,9vw,110px)] leading-[0.92] tracking-[-0.03em] text-[var(--ink)]">
                Every flight. <span className="italic font-normal text-[var(--signal-ink)]">Right now.</span>
              </p>
            </div>

            {/* Display L */}
            <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-6 md:p-8 space-y-2">
              <div className="mono-label text-[11px] text-[var(--ink-3)] flex items-center justify-between">
                <span>DISPLAY-L · clamp(64px, 9vw, 112px) · line-height: 0.95</span>
                <span>Instrument Serif</span>
              </div>
              <p className="font-serif text-[clamp(36px,6vw,72px)] leading-[0.95] tracking-[-0.02em] text-[var(--ink)]">
                Airborne intelligence with <span className="italic font-normal">top-down telemetry</span>
              </p>
            </div>

            {/* Headlines H1 & H2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-6 space-y-2">
                <span className="mono-label text-[11px] text-[var(--ink-3)]">H1 · clamp(40px, 5vw, 56px)</span>
                <h1 className="font-serif text-4xl md:text-5xl text-[var(--ink)]">
                  Tactical Airspace Radar
                </h1>
              </div>

              <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-6 space-y-2">
                <span className="mono-label text-[11px] text-[var(--ink-3)]">H2 · clamp(28px, 3.5vw, 36px)</span>
                <h2 className="font-serif text-2xl md:text-3xl text-[var(--ink)]">
                  Transponder Verification &amp; Squawk Matrix
                </h2>
              </div>
            </div>

            {/* Body, Small & Monospaced Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-6 space-y-2">
                <span className="mono-label text-[11px] text-[var(--ink-3)]">BODY · 16px / 1.55</span>
                <p className="font-sans text-base text-[var(--ink-2)] leading-relaxed">
                  Real-time ADS-B signals received from transponders across 187 sovereign airspaces. Dead-reckoned at 60 fps to preserve aerodynamic continuity.
                </p>
              </div>

              <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-6 space-y-2">
                <span className="mono-label text-[11px] text-[var(--ink-3)]">SMALL · 14px</span>
                <p className="font-sans text-sm text-[var(--ink-3)] leading-relaxed">
                  Terminal area control handoffs, ILS glidepath alignment, and runway occupancy indicators verified against authenticated aeronautical indices.
                </p>
              </div>

              <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-6 space-y-2">
                <span className="mono-label text-[11px] text-[var(--ink-3)]">DATA / MONO · 12–13px tabular</span>
                <div className="font-mono text-xs space-y-1 text-[var(--ink-2)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-3)]">ALT:</span>
                    <span className="tabular-nums font-semibold">38,000 FT (FL380)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-3)]">SPD:</span>
                    <span className="tabular-nums font-semibold">482 KT GS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-3)]">HDG:</span>
                    <span className="tabular-nums font-semibold">072° MAG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-3)]">SQWK:</span>
                    <span className="tabular-nums font-semibold text-[var(--signal-ink)]">7700 (EMERG)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ─────────────────────────────────────────────────────────────────
            2. COLOR SYSTEM & SURFACE PALETTE
           ───────────────────────────────────────────────────────────────── */}
        <section id="colors" className="space-y-6">
          <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[var(--ink)]">2. Color &amp; Surface System</h2>
            <span className="mono-label text-[11px]">85% Neutral + Vermilion Signal Accent</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: '--paper', hex: '#F6F4EF', text: 'Page Background' },
              { name: '--paper-2', hex: '#EFECE4', text: 'Recessed Surface' },
              { name: '--surface', hex: '#FFFFFF', text: 'Cards / Panels' },
              { name: '--surface-2', hex: '#FBFAF7', text: 'Hover Secondary' },
              { name: '--ink', hex: '#0E1116', text: 'Primary Text' },
              { name: '--ink-2', hex: '#3B4250', text: 'Secondary Text' },
              { name: '--ink-3', hex: '#6E7686', text: 'Meta / AA on Paper' },
              { name: '--ink-4', hex: '#A3A9B5', text: 'Placeholder / Disabled' },
              { name: '--signal', hex: '#FF4F1F', text: 'Primary Signal CTA' },
              { name: '--signal-ink', hex: '#C93A10', text: 'Accent Ink on Light' },
              { name: '--sky', hex: '#2B62F0', text: 'Altitude / Sky' },
              { name: '--ok', hex: '#1F9D6B', text: 'Positive Status' },
              { name: '--warn', hex: '#E8A317', text: 'Caution Status' },
              { name: '--bad', hex: '#D64545', text: 'Emergency / Alert' },
            ].map((col) => (
              <div key={col.name} className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-3 space-y-2">
                <div
                  className="h-12 w-full rounded-[var(--r-sm)] border border-[var(--line)]"
                  style={{ backgroundColor: `var(${col.name})` }}
                />
                <div>
                  <div className="font-mono text-xs font-semibold text-[var(--ink)]">{col.name}</div>
                  <div className="font-mono text-[11px] text-[var(--ink-3)]">{col.hex}</div>
                  <div className="text-[11px] text-[var(--ink-2)] truncate mt-0.5">{col.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Altitude Strata Ramp */}
          <div className="space-y-2 pt-2">
            <span className="mono-label text-[11px] text-[var(--ink-3)]">Altitude Strata Telemetry Ramp (--alt-0 → --alt-5)</span>
            <div className="grid grid-cols-6 gap-2">
              {[
                { name: '--alt-0', label: 'Ground / 0-2k', hex: '#FF4F1F' },
                { name: '--alt-1', label: 'Terminal / 2k-10k', hex: '#F5A524' },
                { name: '--alt-2', label: 'Transition / 10k-20k', hex: '#7BC96F' },
                { name: '--alt-3', label: 'Low Cruise / 20k-30k', hex: '#2FB7C9' },
                { name: '--alt-4', label: 'High Cruise / 30k-40k', hex: '#2B62F0' },
                { name: '--alt-5', label: 'Stratosphere / >40k', hex: '#6B3FD1' },
              ].map((alt) => (
                <div key={alt.name} className="rounded-[var(--r-sm)] p-2.5 text-white" style={{ backgroundColor: `var(${alt.name})` }}>
                  <div className="font-mono text-[11px] font-bold">{alt.name}</div>
                  <div className="text-[10px] font-mono opacity-90 truncate">{alt.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ─────────────────────────────────────────────────────────────────
            3. BUTTONS & CHIPS
           ───────────────────────────────────────────────────────────────── */}
        <section id="buttons" className="space-y-6">
          <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[var(--ink)]">3. Buttons &amp; Chips</h2>
            <span className="mono-label text-[11px]">Micro-interactions · 0.98 Press Scale</span>
          </div>

          {/* Buttons Matrix */}
          <div className="space-y-4">
            <span className="mono-label text-[11px] text-[var(--ink-3)]">Button Variants &amp; Sizes</span>
            <div className="flex flex-wrap items-center gap-4 p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)]">
              <Button variant="ink" size="lg" icon="arrow-right" iconPosition="right">
                Primary Ink Pill
              </Button>
              <Button variant="signal" size="md" icon="plane">
                Signal Accent
              </Button>
              <Button variant="outline" size="md">
                Outline Hairline
              </Button>
              <Button variant="ghost" size="sm" icon="refresh">
                Ghost Subdued
              </Button>
              <Button variant="signal" size="md" loading>
                Syncing Radar
              </Button>
              <Button variant="ink" size="md" disabled>
                Transponder Disabled
              </Button>
            </div>
          </div>

          {/* Chips Matrix */}
          <div className="space-y-4">
            <span className="mono-label text-[11px] text-[var(--ink-3)]">Telemetry &amp; Status Chips</span>
            <div className="flex flex-wrap items-center gap-3 p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)]">
              <Chip variant="ok" dot>Airborne · Normal</Chip>
              <Chip variant="warn" dot>Holding Pattern</Chip>
              <Chip variant="bad" dot>Squawk 7700 (Emerg)</Chip>
              <Chip variant="signal">Live Telemetry</Chip>
              <Chip variant="sky" dot>FL380 Cruise</Chip>
              <Chip variant="neutral">Ground Stand</Chip>
            </div>
          </div>
        </section>


        {/* ─────────────────────────────────────────────────────────────────
            4. INPUTS, PANELS & SKELETONS
           ───────────────────────────────────────────────────────────────── */}
        <section id="inputs" className="space-y-6">
          <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[var(--ink)]">4. Inputs, Panels &amp; Skeletons</h2>
            <span className="mono-label text-[11px]">Precision Form Controls</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input column */}
            <div className="space-y-4 border border-[var(--line)] rounded-[var(--r-lg)] bg-[var(--surface)] p-6">
              <span className="mono-label text-[11px] text-[var(--ink-3)]">Form Controls</span>
              <Input
                label="Search Callsign"
                icon="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                clearable
                onClear={() => setInputValue('')}
              />
              <Input
                label="Raw METAR Report (Mono)"
                mono
                value={monoInputValue}
                onChange={(e) => setMonoInputValue(e.target.value)}
              />
              <Input
                label="Transponder Validation Error"
                value="9999"
                error={inputError || 'Transponder octal range invalid (0000–7777 only)'}
                onChange={(e) => setInputError(e.target.value)}
              />
            </div>

            {/* Panels column */}
            <div className="space-y-4">
              <span className="mono-label text-[11px] text-[var(--ink-3)]">Panel Variants</span>
              <Panel
                variant="surface"
                radius="md"
                padding="md"
                header={<span className="font-mono text-xs font-semibold">Surface Panel (--sh-1)</span>}
              >
                <p className="text-xs text-[var(--ink-2)]">Standard panel card for data items and lists.</p>
              </Panel>

              <Panel
                variant="recessed"
                radius="md"
                padding="md"
              >
                <div className="font-mono text-xs text-[var(--ink-3)]">Recessed Area (--paper-2)</div>
                <div className="text-xs text-[var(--ink-2)] mt-1">Used for nested groupings and stat callouts.</div>
              </Panel>

              <Panel
                variant="floating"
                radius="md"
                padding="md"
              >
                <div className="font-mono text-xs text-[var(--ink)] font-semibold">Floating Panel (--sh-2)</div>
                <div className="text-xs text-[var(--ink-2)] mt-1">Used for modal dialogs and dropdown menus.</div>
              </Panel>
            </div>

            {/* Tooltips & Skeletons column */}
            <div className="space-y-6 border border-[var(--line)] rounded-[var(--r-lg)] bg-[var(--surface)] p-6">
              <div className="space-y-3">
                <span className="mono-label text-[11px] text-[var(--ink-3)]">Tooltips</span>
                <div className="flex flex-wrap gap-3">
                  <Tooltip content="Direct great-circle nautical trajectory" side="top">
                    <Button variant="outline" size="sm">Hover Me (Top)</Button>
                  </Tooltip>
                  <Tooltip content="Barometric altitude: 38,000 FT" side="bottom">
                    <Button variant="ghost" size="sm">Hover (Bottom)</Button>
                  </Tooltip>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[var(--line)]">
                <span className="mono-label text-[11px] text-[var(--ink-3)]">Skeleton Shimmer</span>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-3 pt-2">
                    <Skeleton circle className="w-8 h-8" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-2 w-1/3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs demonstration */}
          <div className="border border-[var(--line)] rounded-[var(--r-lg)] bg-[var(--surface)] p-6 space-y-4">
            <span className="mono-label text-[11px] text-[var(--ink-3)]">Tabs Primitive (Underline &amp; Pill)</span>
            <Tabs
              items={[
                {
                  id: 'radar',
                  label: 'Sector Radar',
                  badge: '2,481',
                  content: (
                    <div className="p-4 rounded-[var(--r-md)] bg-[var(--paper)] text-sm text-[var(--ink-2)] font-mono">
                      Active Sector: NY TRACON · 42 commercial flights within 50 NM.
                    </div>
                  ),
                },
                {
                  id: 'alerts',
                  label: 'Airspace Alerts',
                  badge: '2',
                  content: (
                    <div className="p-4 rounded-[var(--r-md)] bg-[var(--paper)] text-sm text-[var(--ink-2)] font-mono">
                      Emergency Squawk 7700 registered over North Atlantic corridor.
                    </div>
                  ),
                },
                {
                  id: 'history',
                  label: 'Session Replay',
                  content: (
                    <div className="p-4 rounded-[var(--r-md)] bg-[var(--paper)] text-sm text-[var(--ink-2)] font-mono">
                      Breadcrumb timeline buffer: 120 points logged.
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </section>


        {/* ─────────────────────────────────────────────────────────────────
            5. MOTION SYSTEM & EASING DEMO (HONORS REDUCED MOTION)
           ───────────────────────────────────────────────────────────────── */}
        <section id="motion" className="space-y-6">
          <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[var(--ink)]">5. Motion System &amp; Easing Demo</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="signal"
                size="sm"
                icon="refresh"
                onClick={() => setMotionActive(!motionActive)}
              >
                Trigger Motion ({motionActive ? 'Reset' : 'Play'})
              </Button>
            </div>
          </div>

          <div className="border border-[var(--line)] rounded-[var(--r-lg)] bg-[var(--surface)] p-6 space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-3)]">
              <span>RESPECTS PREFERS-REDUCED-MOTION: {reducedMotion ? 'ENABLED (CALMED FADES)' : 'STANDARD CHOREOGRAPHY'}</span>
              <span>DURATIONS: MICRO 150MS · UI 280MS · REVEAL 800MS</span>
            </div>

            <div className="space-y-6">
              {/* Easing Token 1: --ease-out-expo */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-[var(--ink-2)]">
                  <span>--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)</span>
                  <span className="text-[var(--ink-3)]">Entrances / Panels (800ms)</span>
                </div>
                <div className="h-14 rounded-[var(--r-md)] bg-[var(--paper-2)] relative overflow-hidden flex items-center px-4">
                  <div
                    className={[
                      'w-10 h-10 rounded-[var(--r-sm)] bg-[var(--signal)] flex items-center justify-center text-white font-mono text-xs',
                      'transition-transform',
                      motionActive ? 'translate-x-[min(500px,60vw)]' : 'translate-x-0',
                    ].join(' ')}
                    style={{
                      transitionTimingFunction: 'var(--ease-out-expo)',
                      transitionDuration: reducedMotion ? '10ms' : '800ms',
                    }}
                  >
                    <Icon name="plane" size={16} />
                  </div>
                </div>
              </div>

              {/* Easing Token 2: --ease-in-out */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-[var(--ink-2)]">
                  <span>--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)</span>
                  <span className="text-[var(--ink-3)]">Transitions / Camera pans (800ms)</span>
                </div>
                <div className="h-14 rounded-[var(--r-md)] bg-[var(--paper-2)] relative overflow-hidden flex items-center px-4">
                  <div
                    className={[
                      'w-10 h-10 rounded-[var(--r-sm)] bg-[var(--sky)] flex items-center justify-center text-white font-mono text-xs',
                      'transition-transform',
                      motionActive ? 'translate-x-[min(500px,60vw)]' : 'translate-x-0',
                    ].join(' ')}
                    style={{
                      transitionTimingFunction: 'var(--ease-in-out)',
                      transitionDuration: reducedMotion ? '10ms' : '800ms',
                    }}
                  >
                    <Icon name="navigation" size={16} />
                  </div>
                </div>
              </div>

              {/* UI Micro duration: 280ms */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-[var(--ink-2)]">
                  <span>--dur-ui: 280ms</span>
                  <span className="text-[var(--ink-3)]">Button presses, tabs, quick toggles</span>
                </div>
                <div className="h-14 rounded-[var(--r-md)] bg-[var(--paper-2)] relative overflow-hidden flex items-center px-4">
                  <div
                    className={[
                      'w-10 h-10 rounded-[var(--r-sm)] bg-[var(--ink)] flex items-center justify-center text-white font-mono text-xs',
                      'transition-transform',
                      motionActive ? 'translate-x-[min(500px,60vw)]' : 'translate-x-0',
                    ].join(' ')}
                    style={{
                      transitionTimingFunction: 'var(--ease-out-expo)',
                      transitionDuration: reducedMotion ? '10ms' : '280ms',
                    }}
                  >
                    <Icon name="radio" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ─────────────────────────────────────────────────────────────────
            6. ICON SET REGISTRY
           ───────────────────────────────────────────────────────────────── */}
        <section id="icons" className="space-y-6">
          <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[var(--ink)]">6. Icon Registry</h2>
            <span className="mono-label text-[11px]">1.5px Stroke · 24px Grid · Typed Registry</span>
          </div>

          {/* Active Lucide Icons */}
          <div className="space-y-3">
            <span className="mono-label text-[11px] text-[var(--ink-3)]">
              Operational UI Icons ({lucideIconNames.length} Initial Lucide Set)
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {lucideIconNames.map((name) => (
                <div
                  key={name}
                  className="flex flex-col items-center justify-center p-3 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--signal)] hover:text-[var(--signal-ink)] transition-colors group cursor-default"
                >
                  <Icon name={name} size={20} className="text-[var(--ink-2)] group-hover:text-[var(--signal-ink)]" />
                  <span className="font-mono text-[10px] text-[var(--ink-3)] mt-2 truncate w-full text-center group-hover:text-[var(--ink)]">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 2 Custom Aviation TODO Slots */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <span className="mono-label text-[11px] text-[var(--ink-3)]">
                Custom Aviation Artwork Slots ({customIconNames.length} Reserved Phase 2 Slots)
              </span>
              <Chip variant="neutral">Auto-expands IconName union</Chip>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {customIconNames.map((name) => (
                <div
                  key={name}
                  className="flex flex-col items-center justify-center p-3 rounded-[var(--r-md)] bg-[var(--paper-2)]/60 border border-dashed border-[var(--line-strong)] text-center"
                >
                  <Icon name={name} size={20} />
                  <span className="font-mono text-[11px] font-medium text-[var(--ink-2)] mt-2">
                    {name}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-4)] mt-0.5">
                    Phase 2 SVG
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ─────────────────────────────────────────────────────────────────
            7. COMMAND PALETTE SHOWCASE (CMDK)
           ───────────────────────────────────────────────────────────────── */}
        <section id="command-palette" className="space-y-6">
          <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[var(--ink)]">7. Command Palette (cmdk)</h2>
            <span className="mono-label text-[11px]">Key: ⌘K or /</span>
          </div>

          <div className="border border-[var(--line)] rounded-[var(--r-lg)] bg-[var(--surface)] p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--signal-wash)] flex items-center justify-center text-[var(--signal-ink)]">
              <Icon name="search" size={22} />
            </div>
            <h3 className="font-serif text-2xl text-[var(--ink)]">Interactive Airspace Command Bar</h3>
            <p className="text-sm text-[var(--ink-2)] max-w-md">
              Restyled to the Editorial Aviation design language with grouped results (Active Flights, Airports, Recents), full keyboard accessibility, and zero template tells.
            </p>
            <div className="pt-2">
              <Button
                variant="signal"
                size="lg"
                icon="search"
                onClick={() => setIsCommandOpen(true)}
              >
                Launch Command Palette (⌘K)
              </Button>
            </div>
          </div>
        </section>

      </main>

      {/* Command Palette Modal */}
      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
      />
    </div>
  );
}
