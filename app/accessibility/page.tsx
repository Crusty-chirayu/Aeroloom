import React from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { siteConfig } from '@/lib/site-config';

export const metadata = {
  title: 'Accessibility Statement — Aeroloom',
  description: 'Commitment to digital accessibility, WCAG 2.2 AA conformance, keyboard navigation, and screen reader compatibility.',
};

export default function AccessibilityPage() {
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
          <Chip variant="ok" dot>WCAG 2.2 AA CONFORMANCE TARGET</Chip>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Accessibility Statement
          </h1>
          <p className="font-mono text-xs text-[var(--ink-3)]">
            AESTHETIC INCLUSIVITY · KEYBOARD FIRST · REDUCED MOTION SAFE
          </p>
        </div>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            1. Our Commitment
          </h2>
          <p>
            Aeroloom believes real-time aviation intelligence should be accessible to everyone, including pilots with low vision, keyboard-only operators, and users with vestibular or sensory sensitivities. We actively design, test, and audit our user interface against the <strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</strong>.
          </p>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            2. Core Architectural Accommodations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel variant="surface" className="p-5 bg-[var(--surface)] space-y-2">
              <h3 className="font-mono text-xs font-bold text-[var(--ink)] uppercase">Contrast &amp; Legibility</h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                By abandoning dark neon radar screens for our warm archival paper palette (<code className="text-[var(--ink)]">#F6F4EE</code>), primary typography achieves an exceptional <strong>15.2:1 contrast ratio</strong>, exceeding even Level AAA standards.
              </p>
            </Panel>

            <Panel variant="surface" className="p-5 bg-[var(--surface)] space-y-2">
              <h3 className="font-mono text-xs font-bold text-[var(--ink)] uppercase">Keyboard Operability</h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                Every interactive control, layer menu, and modal can be navigated using <kbd className="px-1.5 py-0.5 rounded bg-[var(--paper-2)] border text-[11px] font-mono">Tab</kbd> and operated via <kbd className="px-1.5 py-0.5 rounded bg-[var(--paper-2)] border text-[11px] font-mono">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[var(--paper-2)] border text-[11px] font-mono">Space</kbd>. Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--paper-2)] border text-[11px] font-mono">⌘K</kbd> anywhere for global omnisearch.
              </p>
            </Panel>

            <Panel variant="surface" className="p-5 bg-[var(--surface)] space-y-2">
              <h3 className="font-mono text-xs font-bold text-[var(--ink)] uppercase">Reduced Motion Support</h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                When <code className="text-[var(--ink)] font-mono">prefers-reduced-motion: reduce</code> is detected, all decorative sweeps, continuous radar rotations, and map zoom springs are cleanly suppressed and replaced with instant static states.
              </p>
            </Panel>

            <Panel variant="surface" className="p-5 bg-[var(--surface)] space-y-2">
              <h3 className="font-mono text-xs font-bold text-[var(--ink)] uppercase">Screen Reader Tables</h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                Complex canvas visualizers (such as the ATC Airport Radar Scope) automatically supply a semantic, screen-reader accessible HTML data table fallback with complete callsigns, altitudes, headings, and squawk alerts.
              </p>
            </Panel>
          </div>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            3. Feedback &amp; Assistance
          </h2>
          <p>
            If you encounter any barrier while navigating Aeroloom, or have suggestions for improving our assistive tech support, please reach out to us at <a href={`mailto:${siteConfig.owner.supportEmail}`} className="text-[var(--signal-ink)] underline font-medium">{siteConfig.owner.supportEmail}</a>.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
