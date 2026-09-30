'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Icon } from './Icon';
import { Chip } from './Chip';

export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectFlight?: (callsign: string) => void;
  onSelectAirport?: (icao: string) => void;
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSelectFlight,
  onSelectAirport,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen || setInternalOpen;
  const [search, setSearch] = useState('');

  // Keyboard shortcut: Cmd+K / Ctrl+K and '/' shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))) {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-[var(--ink)]/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[620px] rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] shadow-[var(--sh-3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          value={search}
          onValueChange={setSearch}
          className="flex flex-col w-full focus:outline-none"
        >
          {/* Search Header Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-[var(--line)] gap-3 bg-[var(--surface)]">
            <Icon name="search" size={18} className="text-[var(--ink-3)] shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search flights (e.g. DL400), airports (e.g. JFK), routes..."
              className="w-full bg-transparent text-base text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none font-sans"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 rounded-full text-[var(--ink-4)] hover:text-[var(--ink)]"
                aria-label="Clear search"
              >
                <Icon name="close" size={14} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-medium text-[var(--ink-3)] bg-[var(--paper-2)] rounded-[var(--r-sm)] border border-[var(--line)]">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[380px] overflow-y-auto p-2 scroll-py-2 focus:outline-none">
            <Command.Empty className="py-12 text-center text-sm text-[var(--ink-3)]">
              <Icon name="plane" size={24} className="mx-auto mb-2 text-[var(--ink-4)]" />
              <p className="font-medium text-[var(--ink-2)]">No radar contacts matching &ldquo;{search}&rdquo;</p>
              <p className="text-[12px] text-[var(--ink-4)] mt-1">Try searching by callsign, hex, IATA code, or airline</p>
            </Command.Empty>

            {/* Quick Suggestions / Recents Group */}
            <Command.Group
              heading="Recent & Recommended Airspace"
              className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--ink-3)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-semibold"
            >
              <Command.Item
                value="DAL397 JFK SFO Delta Air Lines"
                onSelect={() => {
                  onSelectFlight?.('DAL397');
                  setOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-[var(--r-md)] text-sm cursor-pointer select-none transition-colors data-[selected=true]:bg-[var(--paper-2)] data-[selected=true]:text-[var(--ink)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--signal-wash)] flex items-center justify-center text-[var(--signal-ink)] shrink-0">
                    <Icon name="plane" size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[var(--ink)]">DAL397</span>
                      <span className="text-[13px] text-[var(--ink-2)]">Delta Air Lines</span>
                    </div>
                    <p className="text-[12px] font-mono text-[var(--ink-3)]">JFK → SFO · B738 · FL360</p>
                  </div>
                </div>
                <Chip variant="ok" dot>Airborne</Chip>
              </Command.Item>

              <Command.Item
                value="BAW112 JFK LHR British Airways"
                onSelect={() => {
                  onSelectFlight?.('BAW112');
                  setOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-[var(--r-md)] text-sm cursor-pointer select-none transition-colors data-[selected=true]:bg-[var(--paper-2)] data-[selected=true]:text-[var(--ink)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--sky-wash)] flex items-center justify-center text-[var(--sky)] shrink-0">
                    <Icon name="plane" size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[var(--ink)]">BAW112</span>
                      <span className="text-[13px] text-[var(--ink-2)]">British Airways</span>
                    </div>
                    <p className="text-[12px] font-mono text-[var(--ink-3)]">JFK → LHR · B772 · FL380</p>
                  </div>
                </div>
                <Chip variant="ok" dot>Cruising</Chip>
              </Command.Item>
            </Command.Group>

            {/* Airports Group */}
            <Command.Group
              heading="Airports & Hubs"
              className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--ink-3)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-semibold"
            >
              <Command.Item
                value="KJFK JFK New York John F Kennedy"
                onSelect={() => {
                  onSelectAirport?.('KJFK');
                  setOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-[var(--r-md)] text-sm cursor-pointer select-none transition-colors data-[selected=true]:bg-[var(--paper-2)] data-[selected=true]:text-[var(--ink)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] flex items-center justify-center text-[var(--ink-2)] shrink-0">
                    <Icon name="map-pin" size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[var(--ink)]">JFK</span>
                      <span className="text-[13px] text-[var(--ink-2)]">John F. Kennedy Intl</span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--ink-3)]">New York, USA · KJFK · Elev 13 ft</p>
                  </div>
                </div>
                <Chip variant="neutral">Airport</Chip>
              </Command.Item>

              <Command.Item
                value="EGLL LHR London Heathrow"
                onSelect={() => {
                  onSelectAirport?.('EGLL');
                  setOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-[var(--r-md)] text-sm cursor-pointer select-none transition-colors data-[selected=true]:bg-[var(--paper-2)] data-[selected=true]:text-[var(--ink)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] flex items-center justify-center text-[var(--ink-2)] shrink-0">
                    <Icon name="map-pin" size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[var(--ink)]">LHR</span>
                      <span className="text-[13px] text-[var(--ink-2)]">London Heathrow</span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--ink-3)]">London, UK · EGLL · Elev 83 ft</p>
                  </div>
                </div>
                <Chip variant="neutral">Airport</Chip>
              </Command.Item>

              <Command.Item
                value="VOBL BLR Bengaluru Kempegowda"
                onSelect={() => {
                  onSelectAirport?.('VOBL');
                  setOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-[var(--r-md)] text-sm cursor-pointer select-none transition-colors data-[selected=true]:bg-[var(--paper-2)] data-[selected=true]:text-[var(--ink)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] flex items-center justify-center text-[var(--ink-2)] shrink-0">
                    <Icon name="map-pin" size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[var(--ink)]">BLR</span>
                      <span className="text-[13px] text-[var(--ink-2)]">Kempegowda International</span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--ink-3)]">Bengaluru, India · VOBL · Elev 3000 ft</p>
                  </div>
                </div>
                <Chip variant="neutral">Airport</Chip>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--line)] bg-[var(--surface-2)]/80 text-[11px] font-mono text-[var(--ink-3)]">
            <div className="flex items-center gap-3">
              <span><kbd className="font-semibold text-[var(--ink-2)]">↑↓</kbd> Navigate</span>
              <span><kbd className="font-semibold text-[var(--ink-2)]">↵</kbd> Select</span>
              <span><kbd className="font-semibold text-[var(--ink-2)]">ESC</kbd> Close</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--ink-4)]">
              <span>AEROLOOM COMMAND PALETTE</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
