'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';
import type { AircraftState, SearchResults, AirportInfo, AirlineInfo } from '@/lib/providers/types';

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('aeroloom_recent_searches');
        return stored ? JSON.parse(stored).slice(0, 6) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const saveRecentSearch = (term: string) => {
    try {
      const clean = term.trim().toUpperCase();
      if (!clean) return;
      const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('aeroloom_recent_searches', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Debounced search against /api/search
  useEffect(() => {
    const term = query.trim();
    if (!term) {
      const timer = setTimeout(() => {
        setResults(null);
        setIsLoading(false);
        setSelectedIndex(-1);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.results) {
            setResults(data.results);
            setSelectedIndex(-1);
          }
        }
      } catch {
        // Degraded search
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Flattened actionable items for keyboard navigation
  const flatItems = React.useMemo(() => {
    if (!results) return [];
    const items: Array<{ type: 'flight' | 'airport' | 'airline'; href: string; label: string }> = [];

    (results.flights || []).forEach((f: AircraftState) => {
      items.push({
        type: 'flight',
        href: `/flight/${f.callsign.toLowerCase()}`,
        label: `${f.callsign} (${f.typeCode || 'Aircraft'})`,
      });
    });

    (results.airports || []).forEach((a: AirportInfo) => {
      items.push({
        type: 'airport',
        href: `/airport/${a.iata.toLowerCase()}`,
        label: `${a.iata} - ${a.name}`,
      });
    });

    return items;
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && flatItems[selectedIndex]) {
        e.preventDefault();
        saveRecentSearch(query);
        router.push(flatItems[selectedIndex].href);
      } else if (query.trim()) {
        saveRecentSearch(query);
      }
    } else if (e.key === 'Escape') {
      setQuery('');
      setResults(null);
    }
  };

  const quickPills = ['JFK', 'LHR', 'DXB', 'BLR', 'HND', 'A380', 'B777', 'DLH'];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* App Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/map" className="shrink-0">
              <Button variant="ghost" size="sm" icon="arrow-left">
                Map
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif text-lg text-[var(--ink)]">Aeroloom</span>
              <span className="text-[var(--ink-4)] hidden sm:inline">/</span>
              <span className="mono-label text-[11px] text-[var(--ink-2)] hidden sm:inline">Omnisearch</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/airports" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm">
                Airports
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="ink" size="sm" icon="plane">
                Radar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Search Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2">
            <Chip variant="signal">OMNI-SEARCH DIRECTORY</Chip>
            <Chip variant="neutral">⌘K / /</Chip>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--ink)] tracking-tight">
            Search Flights, Aerodromes &amp; Carriers
          </h1>
          <p className="text-sm text-[var(--ink-2)] max-w-lg mx-auto">
            Real-time indexed search across active transponder contacts, global airport databases, and commercial airline identifiers.
          </p>
        </div>

        {/* Big Search Input Box */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--ink-3)]">
            <Icon name="search" size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by callsign (e.g. DLH400), airport (JFK, BLR), or airline..."
            className="w-full h-14 pl-12 pr-12 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--line-strong)] text-base md:text-lg font-sans text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] focus:ring-2 focus:ring-[var(--signal)]/20 shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-4 flex items-center text-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              <Icon name="x" size={18} />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        {!query && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono-label text-[11px] text-[var(--ink-3)] mr-2">POPULAR SEARCHES:</span>
              {quickPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setQuery(pill)}
                  className="px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--surface)] hover:bg-[var(--paper-2)] border border-[var(--line)] font-mono text-xs text-[var(--ink-2)] transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="pt-4 border-t border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="mono-label text-[11px] text-[var(--ink-3)]">RECENT SEARCHES</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('aeroloom_recent_searches');
                    }}
                    className="text-xs font-mono text-[var(--ink-3)] hover:text-[var(--bad)] transition-colors"
                  >
                    Clear History
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 rounded-[var(--r-sm)] bg-[var(--paper)] hover:bg-[var(--paper-2)] border border-[var(--line-strong)] font-mono text-xs text-[var(--ink)] flex items-center gap-1.5 transition-colors"
                    >
                      <Icon name="compass" size={12} />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Search Results */}
        {query && (
          <div className="space-y-6">
            {isLoading && (
              <div className="py-8 text-center text-xs font-mono text-[var(--ink-3)] flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
                <span>SCANNING AIRSPACE INDEXES...</span>
              </div>
            )}

            {!isLoading && results && results.total === 0 && (
              <Panel variant="surface" radius="md" padding="lg" className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--paper-2)] flex items-center justify-center mx-auto text-[var(--ink-3)]">
                  <Icon name="search" size={20} />
                </div>
                <h3 className="font-serif text-xl text-[var(--ink)]">No Airspace Records Found</h3>
                <p className="text-sm text-[var(--ink-2)] max-w-sm mx-auto">
                  No live flights, aerodromes, or airline codes matched &ldquo;{query}&rdquo;.
                </p>
              </Panel>
            )}

            {/* Flight Results */}
            {results && results.flights && results.flights.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                  <span className="mono-label text-[11px] text-[var(--ink-3)]">
                    ACTIVE AIRBORNE FLIGHTS ({results.flights.length})
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">ADS-B TELEMETRY</span>
                </div>
                <div className="divide-y divide-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] border border-[var(--line-strong)] overflow-hidden">
                  {results.flights.map((f, i) => {
                    const isSelected = selectedIndex === i;
                    return (
                      <Link
                        key={f.id}
                        href={`/flight/${f.callsign.toLowerCase()}`}
                        onClick={() => saveRecentSearch(f.callsign)}
                        className={`p-3.5 flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-[var(--paper-2)] border-l-4 border-l-[var(--signal)]' : 'hover:bg-[var(--paper-2)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] border border-[var(--line)]">
                            <Icon name="plane" size={16} />
                          </div>
                          <div>
                            <div className="font-mono text-base font-bold text-[var(--ink)]">
                              {f.callsign}
                            </div>
                            <div className="text-xs text-[var(--ink-2)] font-mono">
                              {f.airline ? `${f.airline} · ` : ''}{f.typeCode || 'Aircraft'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          <div className="font-bold text-[var(--ink)]">
                            {f.altitudeFt.toLocaleString()} FT
                          </div>
                          <div className="text-[11px] text-[var(--ink-3)]">
                            {f.groundSpeedKt} KT · {f.trackDeg}°
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Airport Results */}
            {results && results.airports && results.airports.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                  <span className="mono-label text-[11px] text-[var(--ink-3)]">
                    AERODROMES &amp; WAYPOINTS ({results.airports.length})
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">ICAO DATABASE</span>
                </div>
                <div className="divide-y divide-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] border border-[var(--line-strong)] overflow-hidden">
                  {results.airports.map((a, i) => {
                    const offset = (results.flights?.length || 0) + i;
                    const isSelected = selectedIndex === offset;
                    return (
                      <Link
                        key={a.icao}
                        href={`/airport/${a.iata.toLowerCase()}`}
                        onClick={() => saveRecentSearch(a.iata)}
                        className={`p-3.5 flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-[var(--paper-2)] border-l-4 border-l-[var(--signal)]' : 'hover:bg-[var(--paper-2)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] border border-[var(--line)]">
                            <Icon name="map-pin" size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-base font-bold text-[var(--ink)]">
                                {a.iata}
                              </span>
                              <span className="font-mono text-[11px] px-1 rounded bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-3)]">
                                {a.icao}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--ink)] font-medium">
                              {a.name}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <div className="font-medium text-[var(--ink-2)]">{a.city}, {a.country}</div>
                          <div className="font-mono text-[10px] text-[var(--ink-3)]">
                            {a.elevationFt ? `${a.elevationFt} FT MSL` : 'SEA LEVEL'}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Airlines Results */}
            {results && results.airlines && results.airlines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                  <span className="mono-label text-[11px] text-[var(--ink-3)]">
                    COMMERCIAL AIRLINES ({results.airlines.length})
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">IATA/ICAO CARRIERS</span>
                </div>
                <div className="divide-y divide-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] border border-[var(--line-strong)] overflow-hidden">
                  {results.airlines.map((al: AirlineInfo) => (
                    <div
                      key={al.icao}
                      className="p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--ink)]">
                          <span>{al.name}</span>
                          <span className="text-[11px] font-normal px-1 rounded bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-3)]">
                            {al.icao}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--ink-3)] font-mono">
                          TELEPHONY: {al.callsignTelephony || '—'} · {al.country}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
