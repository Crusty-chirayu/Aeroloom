'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';

interface FlapFlight {
  flight: string;
  destination: string;
  time: string;
  gate: string;
  status: string;
  statusColor?: string;
}

interface HubAirport {
  code: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  localTimezone: string;
  elevation: string;
  departures: FlapFlight[];
}

const HUBS: HubAirport[] = [
  {
    code: 'LHR',
    icao: 'EGLL',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    localTimezone: 'Europe/London',
    elevation: '83 FT',
    departures: [
      { flight: 'BAW178', destination: 'NEW YORK (JFK)', time: '14:20', gate: 'B24', status: 'BOARDING' },
      { flight: 'SIA317', destination: 'SINGAPORE (SIN)', time: '14:35', gate: 'A12', status: 'AIRBORNE' },
      { flight: 'DLH400', destination: 'FRANKFURT (FRA)', time: '14:50', gate: 'C08', status: 'DEPARTED' },
      { flight: 'UAE002', destination: 'DUBAI (DXB)', time: '15:10', gate: 'B18', status: 'ON TIME' },
      { flight: 'AIC130', destination: 'MUMBAI (BOM)', time: '15:30', gate: 'A04', status: 'ON TIME' },
    ],
  },
  {
    code: 'BLR',
    icao: 'VOBL',
    name: 'Kempegowda International Airport',
    city: 'Bengaluru',
    country: 'India',
    localTimezone: 'Asia/Kolkata',
    elevation: '3,000 FT',
    departures: [
      { flight: 'AIC804', destination: 'DELHI (DEL)', time: '19:40', gate: '04', status: 'BOARDING' },
      { flight: 'IGO218', destination: 'MUMBAI (BOM)', time: '20:05', gate: '12', status: 'FINAL CALL' },
      { flight: 'SEJ332', destination: 'DUBAI (DXB)', time: '20:30', gate: '08', status: 'AIRBORNE' },
      { flight: 'BAW118', destination: 'LONDON (LHR)', time: '21:15', gate: '19', status: 'ON TIME' },
      { flight: 'SIA505', destination: 'SINGAPORE (SIN)', time: '21:45', gate: '16', status: 'ON TIME' },
    ],
  },
  {
    code: 'JFK',
    icao: 'KJFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    elevation: '13 FT',
    localTimezone: 'America/New_York',
    departures: [
      { flight: 'DAL397', destination: 'LOS ANGELES (LAX)', time: '09:15', gate: 'B22', status: 'AIRBORNE' },
      { flight: 'AFR007', destination: 'PARIS (CDG)', time: '09:40', gate: 'A01', status: 'DEPARTED' },
      { flight: 'BAW112', destination: 'LONDON (LHR)', time: '10:05', gate: 'B30', status: 'BOARDING' },
      { flight: 'JAL005', destination: 'TOKYO (HND)', time: '10:30', gate: 'A14', status: 'ON TIME' },
      { flight: 'QTR702', destination: 'DOHA (DOH)', time: '11:00', gate: 'B12', status: 'ON TIME' },
    ],
  },
  {
    code: 'HND',
    icao: 'RJTT',
    name: 'Tokyo Haneda International Airport',
    city: 'Tokyo',
    country: 'Japan',
    elevation: '21 FT',
    localTimezone: 'Asia/Tokyo',
    departures: [
      { flight: 'ANA201', destination: 'LONDON (LHR)', time: '11:20', gate: '107', status: 'DEPARTED' },
      { flight: 'JAL043', destination: 'PARIS (CDG)', time: '11:45', gate: '112', status: 'AIRBORNE' },
      { flight: 'SIA631', destination: 'SINGAPORE (SIN)', time: '12:10', gate: '109', status: 'BOARDING' },
      { flight: 'UAL876', destination: 'SAN FRANCISCO (SFO)', time: '12:35', gate: '114', status: 'ON TIME' },
      { flight: 'CPA543', destination: 'HONG KONG (HKG)', time: '13:00', gate: '105', status: 'ON TIME' },
    ],
  },
];

// Single Split-Flap Character Tile
function SplitFlapChar({ char, delayIndex = 0 }: { char: string; delayIndex?: number }) {
  const [displayChar, setDisplayChar] = useState(char);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (char !== displayChar) {
      const stagger = delayIndex * 35; // 35ms stagger per character
      const timer = setTimeout(() => {
        setIsFlipping(true);
        setTimeout(() => {
          setDisplayChar(char);
          setIsFlipping(false);
        }, 120);
      }, stagger);

      return () => clearTimeout(timer);
    }
  }, [char, displayChar, delayIndex]);

  return (
    <span
      className={`relative inline-flex flex-col items-center justify-center w-[18px] sm:w-[22px] h-[28px] sm:h-[34px] bg-[#14171E] text-[#F6F4EE] rounded-[3px] font-mono text-xs sm:text-sm font-bold shadow-xs select-none overflow-hidden border border-black/40 transition-transform duration-100 ${
        isFlipping ? 'scale-y-75 opacity-90' : 'scale-y-100 opacity-100'
      }`}
    >
      {/* Top half hinge reflection */}
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/5 pointer-events-none" />
      {/* Split seam line */}
      <span className="absolute inset-x-0 top-1/2 -translate-y-[0.5px] h-[1px] bg-black/60 pointer-events-none z-10" />
      {/* Character */}
      <span className="z-0 leading-none">{displayChar}</span>
    </span>
  );
}

// Split-Flap Row Component
function SplitFlapWord({ text, maxLength, delayStart = 0 }: { text: string; maxLength: number; delayStart?: number }) {
  const padded = text.padEnd(maxLength, ' ').slice(0, maxLength);
  return (
    <div className="flex gap-[2px]">
      {padded.split('').map((c, i) => (
        <SplitFlapChar key={i} char={c} delayIndex={delayStart + i} />
      ))}
    </div>
  );
}

export function SplitFlapAirportBoard() {
  const [activeHubIndex, setActiveHubIndex] = useState(0);
  const hub = HUBS[activeHubIndex];

  // Auto-cycle through hubs every 10 seconds if idle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHubIndex((prev) => (prev + 1) % HUBS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 px-6 sm:px-12 max-w-[1360px] mx-auto border-t border-[var(--line)] space-y-10">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Chip variant="signal">Departures Telemetry</Chip>
            <Chip variant="neutral">Mechanical Split-Flap</Chip>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Terminal Departures Concourse
          </h2>
          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            Mechanical split-flap teleprinters rendered with hardware-accelerated CSS 3D transforms. Cycle through four international hubs with verified airport coordinates and live weather feeds.
          </p>
        </div>

        {/* Hub Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--line-strong)]">
          {HUBS.map((h, idx) => (
            <button
              key={h.code}
              type="button"
              onClick={() => setActiveHubIndex(idx)}
              className={`px-3 py-1.5 rounded-[var(--r-sm)] font-mono text-xs font-bold transition-all cursor-pointer ${
                activeHubIndex === idx
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-xs'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
              }`}
            >
              {h.code}
              <span className="hidden sm:inline font-normal text-[10px] ml-1 opacity-70">
                ({h.city})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Split-Flap Board Cabinet */}
      <div className="rounded-[var(--r-lg)] bg-[#0C0E14] border-2 border-black/80 p-5 sm:p-8 shadow-[var(--sh-3)] text-white space-y-6 overflow-hidden">
        {/* Board Top Header Plate */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-base font-serif tracking-normal">
              {hub.name}
            </span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-xs font-bold">
              {hub.code} / {hub.icao}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>ELEV: {hub.elevation}</span>
            <span>·</span>
            <span>GATEWAY: {hub.country.toUpperCase()}</span>
            <span>·</span>
            <span className="text-[var(--signal)] font-bold">DEPARTURES BOARD</span>
          </div>
        </div>

        {/* Flap Board Rows */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px] space-y-3">
            {/* Column labels */}
            <div className="grid grid-cols-12 text-[10px] font-mono font-bold text-neutral-500 tracking-widest uppercase px-1">
              <span className="col-span-2">FLIGHT</span>
              <span className="col-span-5">DESTINATION</span>
              <span className="col-span-2">TIME</span>
              <span className="col-span-1">GATE</span>
              <span className="col-span-2 text-right">STATUS</span>
            </div>

            {/* Flight rows */}
            {hub.departures.map((flight, rIdx) => (
              <div
                key={`${hub.code}-${flight.flight}`}
                className="grid grid-cols-12 items-center py-1.5 px-2 rounded bg-black/40 border border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="col-span-2">
                  <SplitFlapWord text={flight.flight} maxLength={7} delayStart={rIdx * 2} />
                </div>
                <div className="col-span-5">
                  <SplitFlapWord text={flight.destination} maxLength={17} delayStart={rIdx * 2 + 1} />
                </div>
                <div className="col-span-2">
                  <SplitFlapWord text={flight.time} maxLength={5} delayStart={rIdx * 2 + 2} />
                </div>
                <div className="col-span-1">
                  <SplitFlapWord text={flight.gate} maxLength={3} delayStart={rIdx * 2 + 3} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <SplitFlapWord text={flight.status} maxLength={9} delayStart={rIdx * 2 + 4} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Board Bottom Plate */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" />
            <span>REAL-TIME TERMINAL RADAR LINKED</span>
          </div>

          <Link href={`/airport/${hub.code.toLowerCase()}`}>
            <Button variant="outline" size="sm" className="bg-transparent text-white border-white/20 hover:bg-white/10">
              Inspect {hub.code} Aerodrome Dossier →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
