'use client';

import React, { useState } from 'react';
import FlightMap from '@/components/map/FlightMap';
import Header from '@/components/deck/Header';
import { AVIATION_SECTORS, type AviationSector } from '@/lib/map/config';
import { Search } from 'lucide-react';

export default function Home() {
  const [activeSector, setActiveSector] = useState<AviationSector>(AVIATION_SECTORS[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080b11] text-[#f8fafc]">
      {/* Precision Telemetry Studio Header */}
      <Header
        activeSector={activeSector}
        onSelectSector={setActiveSector}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        trackedCount={0}
      />

      {/* Mobile Search Bar (Visible only on small viewports) */}
      <div className="lg:hidden px-3 py-2 bg-[#0f141f] border-b border-[#1f293d]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search callsign / hex..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#080b11] border border-[#1f293d] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/70 font-mono"
          />
        </div>
      </div>

      {/* Main Full-Viewport Flight Canvas */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <FlightMap
          activeSector={activeSector}
          onSectorChange={setActiveSector}
        />
      </main>
    </div>
  );
}
