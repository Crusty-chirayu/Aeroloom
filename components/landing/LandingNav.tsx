'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';

interface LandingNavProps {
  onOpenSearch?: () => void;
}

export function LandingNav({ onOpenSearch }: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav
        className={`pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-5 py-2.5 rounded-full transition-all duration-300 max-w-fit mx-auto ${
          isScrolled
            ? 'bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--line-strong)] shadow-[var(--sh-2)]'
            : 'bg-[var(--surface)]/75 backdrop-blur-sm border border-[var(--line)]/60 shadow-sm'
        }`}
        aria-label="Primary navigation"
      >
        {/* Brand Lockup */}
        <Link
          href="/"
          className="flex items-center group text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)] rounded-full px-1"
          aria-label="Aeroloom Home"
        >
          <AeroloomLogo variant="lockup" size="sm" />
        </Link>

        {/* Divider hairline */}
        <div className="h-4 w-[1px] bg-[var(--line-strong)] hidden sm:block" />

        {/* Nav Links */}
        <div className="hidden sm:flex items-center gap-5 text-xs font-mono font-medium text-[var(--ink-2)]">
          <Link
            href="/map"
            className="hover:text-[var(--ink)] transition-colors py-1"
          >
            Radar Map
          </Link>
          <Link
            href="/airports"
            className="hover:text-[var(--ink)] transition-colors py-1"
          >
            Airports
          </Link>
          <Link
            href="/about/data"
            className="hover:text-[var(--ink)] transition-colors py-1"
          >
            Data Sources
          </Link>
          <button
            type="button"
            onClick={onOpenSearch}
            className="hover:text-[var(--ink)] transition-colors py-1 flex items-center gap-1.5 cursor-pointer"
            aria-label="Open search command palette"
          >
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-3)] font-sans">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Mobile search button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="sm:hidden p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)]"
          aria-label="Open search"
        >
          <Icon name="search" size={16} />
        </button>

        {/* Primary Action Button */}
        <Link href="/map" className="shrink-0">
          <Button
            variant="ink"
            size="sm"
            icon="arrow-right"
            iconPosition="right"
            className="rounded-full shadow-sm text-xs group"
          >
            <span>Open live map</span>
          </Button>
        </Link>
      </nav>
    </header>
  );
}
