import React from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { siteConfig } from '@/lib/site-config';

export const metadata = {
  title: 'Privacy Policy — Aeroloom',
  description: 'Transparent privacy policy detailing local storage, zero ad-tech tracking, and user data rights on Aeroloom.',
};

export default function PrivacyPage() {
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
          <Chip variant="neutral">PRIVACY &amp; DATA CHARTER</Chip>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Privacy Policy
          </h1>
          <p className="font-mono text-xs text-[var(--ink-3)]">
            ARCHITECTURAL COMMITMENT: ZERO AD TRACKERS · LOCAL-FIRST PERSISTENCE
          </p>
        </div>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            1. Core Privacy Philosophy
          </h2>
          <p>
            Aeroloom operates on an uncompromising principle: <strong>your airspace exploration belongs to you</strong>. We do not sell user data, we do not partner with ad-tech data brokers, and we do not embed invasive marketing surveillance scripts (e.g. Google Tag Manager, Meta Pixel, Hotjar).
          </p>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            2. Local-First Anonymous Mode (Default)
          </h2>
          <p>
            By default, Aeroloom requires zero account registration. When operating in Guest mode:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[var(--ink-2)]">
            <li>Your saved flight watchlists, pinned airports, and map view filters reside 100% locally in your browser&apos;s <code className="text-[var(--ink)] font-mono">localStorage</code>.</li>
            <li>No profile is created on any external cloud server.</li>
            <li>You can export or clear your entire data bundle at any moment through the Watchlist Management dialog.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            3. Authenticated Profiles &amp; PostgreSQL RLS
          </h2>
          <p>
            If you elect to sign in via Google or GitHub OAuth:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[var(--ink-2)]">
            <li>We store only your OAuth provider identifier, user ID, and associated watchlist preferences.</li>
            <li>All stored records are protected by strict <strong>PostgreSQL Row Level Security (RLS)</strong> policies. No other user or unauthorized third party can read or write to your records.</li>
            <li>You may delete your account and all associated cloud-synced records at any time.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            4. AI Assistant Ingestion Boundaries
          </h2>
          <p>
            When utilizing <strong>Ask Aeroloom</strong>:
          </p>
          <p>
            Natural language queries are passed over secure TLS to OpenRouter&apos;s inference endpoints to synthesize flight telemetry. Neither Aeroloom nor OpenRouter uses your ephemeral queries to train proprietary artificial intelligence models.
          </p>
        </section>

        <section className="space-y-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            5. Inquiries &amp; Data Subject Rights
          </h2>
          <Panel variant="surface" className="p-5 bg-[var(--surface)] space-y-2 text-xs font-mono text-[var(--ink-2)]">
            <div>DATA PRIVACY OFFICER: {siteConfig.developer.name}</div>
            <div>CONTACT INQUIRIES: {siteConfig.owner.supportEmail}</div>
            <div>LOCATION: {siteConfig.developer.location}</div>
          </Panel>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
