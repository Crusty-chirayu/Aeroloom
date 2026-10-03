'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import type { AircraftState } from '@/lib/providers/types';

export interface AirportRadarScopeBentoTileProps {
  airport: {
    name: string;
    iata: string;
    icao: string;
    latitude: number;
    longitude: number;
  };
  traffic: AircraftState[];
  onOpenFullScope?: () => void;
}

export function AirportRadarScopeBentoTile({
  airport,
  traffic,
  onOpenFullScope,
}: AirportRadarScopeBentoTileProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--line-strong)] rounded-[var(--r-md)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ink-4)] transition-colors shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
            <Icon name="radar" size={16} />
          </div>
          <div>
            <span className="mono-label text-[10px] text-[var(--ink-3)] block">ATC RADAR SCOPE</span>
            <span className="font-serif text-base font-semibold text-[var(--ink)]">Terminal Airspace</span>
          </div>
        </div>

        <Chip variant={traffic.length > 0 ? 'signal' : 'neutral'} dot>
          {traffic.length} AIRBORNE
        </Chip>
      </div>

      {/* Mini Visual Preview Canvas representation */}
      <div className="relative w-full h-32 bg-[#F6F4EE] border border-[var(--line)] rounded-[var(--r-sm)] overflow-hidden flex items-center justify-center">
        {/* Concentric preview rings */}
        <div className="absolute w-24 h-24 rounded-full border border-dashed border-[#D1CDC0]" />
        <div className="absolute w-16 h-16 rounded-full border border-dashed border-[#D1CDC0]" />
        <div className="absolute w-8 h-8 rounded-full border border-dashed border-[#D1CDC0]" />
        <div className="absolute w-2 h-2 rounded-full bg-[#E11D48]" />

        {/* Mini blips */}
        {traffic.slice(0, 5).map((ac, idx) => {
          // Spread blips visually inside preview circle
          const angles = [30, 110, 210, 290, 160];
          const rad = (angles[idx % angles.length] - 90) * (Math.PI / 180);
          const r = 20 + (idx * 12) % 36;
          const bx = r * Math.cos(rad);
          const by = r * Math.sin(rad);

          return (
            <div
              key={ac.id || idx}
              className="absolute w-2 h-2 rounded-full bg-[#111111] border border-[#F6F4EE]"
              style={{
                transform: `translate(${bx}px, ${by}px)`,
              }}
              title={`${ac.callsign}: ${ac.altitudeFt}FT`}
            />
          );
        })}

        {/* Overlay info text */}
        <div className="absolute bottom-1.5 left-2 font-mono text-[9px] text-[var(--ink-3)]">
          RANGE: 25 NM · ARP {airport.icao}
        </div>
      </div>

      {/* Footer Action */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-mono text-[var(--ink-2)]">
          {traffic.length > 0 ? `Tracking ${traffic.length} active blips` : 'Airspace quiet'}
        </span>

        {onOpenFullScope ? (
          <Button variant="ink" size="sm" icon="radar" onClick={onOpenFullScope}>
            Launch Scope
          </Button>
        ) : (
          <Link href={`/map?lat=${airport.latitude}&lng=${airport.longitude}&z=10`}>
            <Button variant="outline" size="sm" icon="external-link">
              Interactive Scope
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
