import React from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';

export const metadata = {
  title: 'Cookie & Storage Policy — Aeroloom',
  description: 'Detailed registry of essential session tokens and local browser storage keys utilized on Aeroloom.',
};

export default function CookiesPage() {
  const storageItems = [
    {
      key: 'sb-*-auth-token',
      type: 'Cookie (HTTP-Only / Secure)',
      category: 'Strictly Essential',
      purpose: 'Maintains authenticated session state with Supabase if the user chooses to sign in via Google or GitHub OAuth.',
      lifespan: 'Session / 30 Days',
    },
    {
      key: 'aeroloom_watchlist_bundle_v1',
      type: 'Local Storage',
      category: 'Functional / Offline',
      purpose: 'Stores saved airframe callsigns, pinned aerodrome hubs, and custom alert rules directly on the client device.',
      lifespan: 'Persistent until cleared',
    },
    {
      key: 'aeroloom_recent_searches_v1',
      type: 'Local Storage',
      category: 'Functional / Speed',
      purpose: 'Caches the last 10 searched flights and airports in the ⌘K Omnisearch palette for instant zero-latency retrieval.',
      lifespan: 'Persistent until cleared',
    },
    {
      key: 'aeroloom_map_prefs_v1',
      type: 'Local Storage',
      category: 'User Preference',
      purpose: 'Preserves map layer state (precipitation radar, daylight terminator line, dense labels toggle).',
      lifespan: 'Persistent until cleared',
    },
  ];

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
      <main className="max-w-[850px] mx-auto px-6 sm:px-12 py-16 space-y-12">
        <div className="space-y-4">
          <Chip variant="neutral">TRANSPARENCY REGISTER</Chip>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Cookie &amp; Storage Policy
          </h1>
          <p className="font-mono text-xs text-[var(--ink-3)]">
            ZERO AD-TECH · ZERO CROSS-SITE TRACKING · ESSENTIAL ONLY
          </p>
        </div>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            1. Why Aeroloom Does Not Show a Cookie Banner
          </h2>
          <p>
            Under European ePrivacy directives and GDPR, non-essential cookies (such as analytics trackers, behavioral advertising, and profiling cookies) require prior explicit opt-in consent banners. 
          </p>
          <p>
            <strong>Aeroloom does not use any non-essential cookies.</strong> We do not track you across sites, and we do not utilize third-party marketing beacons. All storage mechanisms are strictly necessary for session continuity and client-side device persistence.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            2. Complete Storage Key Registry
          </h2>

          <div className="space-y-4">
            {storageItems.map((item) => (
              <Panel key={item.key} variant="surface" className="p-5 bg-[var(--surface)] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
                  <code className="font-mono text-xs font-bold text-[var(--signal)]">
                    {item.key}
                  </code>
                  <span className="font-mono text-[11px] text-[var(--ink-3)] uppercase">
                    {item.type} · {item.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-2)]">
                  {item.purpose}
                </p>
                <div className="text-[11px] font-mono text-[var(--ink-4)] pt-1">
                  LIFESPAN: {item.lifespan}
                </div>
              </Panel>
            ))}
          </div>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            3. How to Clear Stored Data
          </h2>
          <p>
            You can clear all Aeroloom local data at any time directly through your browser settings, or by clicking the &ldquo;Clear All Local Data&rdquo; button in the Watchlist Management dialog.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
