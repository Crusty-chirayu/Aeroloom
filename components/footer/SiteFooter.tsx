'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { siteConfig } from '@/lib/site-config';

export function SiteFooter() {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().substring(11, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full border-t border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] select-none">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-12 pt-16 pb-12 space-y-12">
        {/* Top Section: Brand + Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Column (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block hover:opacity-85 transition-opacity" aria-label="Aeroloom Home">
              <AeroloomLogo variant="lockup" size="md" />
            </Link>
            <p className="text-sm text-[var(--ink-2)] max-w-sm leading-relaxed">
              Real-time ADS-B flight tracking with editorial cartography, sub-pixel dead reckoning, and verified telemetry provenance.
            </p>

            {/* System Status Pill */}
            <div className="pt-2">
              <Link
                href="/status"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--ink)] transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" />
                <span>All Telemetry Pipelines Active</span>
              </Link>
            </div>
          </div>

          {/* Column 1: Airspace */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-3)] font-semibold">
              Airspace
            </h3>
            <ul className="space-y-2 text-sm font-sans">
              <li>
                <Link href="/map" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Live Radar Map
                </Link>
              </li>
              <li>
                <Link href="/airports" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Airports Directory
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Omnisearch Index
                </Link>
              </li>
              <li>
                <Link href="/about/data" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Data Provenance
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Architecture & Company */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-3)] font-semibold">
              Engineering
            </h3>
            <ul className="space-y-2 text-sm font-sans">
              <li>
                <Link href="/about" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors font-medium">
                  Architecture Case Study
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  System Health Status
                </Link>
              </li>
              <li>
                <Link href="/credits" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Credits &amp; Feeds
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Contact Developer
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Trust */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--ink-3)] font-semibold">
              Trust &amp; Legal
            </h3>
            <ul className="space-y-2 text-sm font-sans">
              <li>
                <Link href="/terms" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Safety Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                  Accessibility Statement
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon Bar */}
        <div className="pt-8 border-t border-[var(--line)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono text-[var(--ink-3)]">
          <div className="flex flex-wrap items-center gap-2">
            <span>Designed &amp; Built with obsession by</span>
            <a
              href={siteConfig.developer.links.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--ink)] font-medium hover:text-[var(--signal)] underline decoration-[var(--line-strong)] underline-offset-4 transition-colors"
            >
              {siteConfig.developer.name}
            </a>
            <span>· Bangalore, India</span>
            <span className="hidden sm:inline">·</span>
            <div className="flex items-center gap-3">
              <a
                href={siteConfig.developer.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ink)] transition-colors"
              >
                GitHub
              </a>
              <span>·</span>
              <a
                href={siteConfig.developer.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ink)] transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {utcTime && (
              <span className="tabular-nums px-2 py-0.5 rounded bg-[var(--paper-2)] border border-[var(--line)] text-[11px] text-[var(--ink-2)] font-semibold">
                {utcTime}
              </span>
            )}
            <span className="text-[11px]">v{siteConfig.metadata.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
