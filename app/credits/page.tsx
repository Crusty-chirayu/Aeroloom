import React from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';

export const metadata = {
  title: 'Credits & Attributions — Aeroloom',
  description: 'Attributions, licenses, and grateful acknowledgments for open-source software and open telemetry feeds powering Aeroloom.',
};

export default function CreditsPage() {
  const attributions = [
    {
      title: 'airplanes.live',
      role: 'Primary Live ADS-B Feeder Collective',
      license: 'Open-Access Non-Commercial / Research',
      attribution: 'Live aircraft positions, Mode-S transponder interrogations, and squawk telemetry provided courtesy of the global volunteer feeding collective at airplanes.live.',
      url: 'https://airplanes.live',
    },
    {
      title: 'adsb.lol',
      role: 'Secondary Telemetry Failover Feed',
      license: 'Open Source Community Feed',
      attribution: 'Real-time transponder failover aggregation provided by the open feeder network at adsb.lol.',
      url: 'https://adsb.lol',
    },
    {
      title: 'NOAA / Aviation Weather Center',
      role: 'Aerodrome Meteorological Telemetry (METAR / TAF)',
      license: 'U.S. Public Domain (17 U.S.C. § 105)',
      attribution: 'Global surface weather reports, barometric altimeters, wind vectors, and FAA flight category classifications provided by the National Oceanic and Atmospheric Administration.',
      url: 'https://aviationweather.gov',
    },
    {
      title: 'RainViewer',
      role: 'Convective Doppler Radar Composite Mosaic',
      license: 'Non-Commercial API Integration',
      attribution: 'Precipitation radar reflectivity tiles provided via the RainViewer API.',
      url: 'https://www.rainviewer.com',
    },
    {
      title: 'OpenStreetMap & OpenFreeMap',
      role: 'Vector Tile Cartography & Geodata',
      license: 'Open Database License (ODbL) / OpenFreeMap Public Hosting',
      attribution: 'Map data © OpenStreetMap contributors under ODbL. Vector tile delivery infrastructure powered by OpenFreeMap.',
      url: 'https://openfreemap.org',
    },
    {
      title: 'MapLibre GL JS',
      role: 'Client-Side WebGL Map Rendering Engine',
      license: 'BSD-3-Clause License',
      attribution: 'Open-source GPU-accelerated vector and raster map rendering engine.',
      url: 'https://maplibre.org',
    },
    {
      title: 'Instrument Serif & Geist',
      role: 'Typography & Digital Fonts',
      license: 'SIL Open Font License 1.1',
      attribution: 'Instrument Serif designed by Rodrigo Fuenzalida & Jordan Bell. Geist Sans and Geist Mono designed by Vercel.',
      url: 'https://fonts.google.com/specimen/Instrument+Serif',
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
          <Chip variant="neutral">ACKNOWLEDGMENT REGISTER</Chip>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Credits &amp; Attributions
          </h1>
          <p className="text-base text-[var(--ink-2)] leading-relaxed font-sans">
            Aeroloom stands upon the shoulders of global open-data contributors, radio amateur feeders, and foundational open-source engineering.
          </p>
        </div>

        <div className="space-y-4">
          {attributions.map((item) => (
            <Panel key={item.title} variant="surface" className="p-6 bg-[var(--surface)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[var(--ink)]">{item.title}</h2>
                  <span className="font-mono text-xs text-[var(--signal-ink)] uppercase font-semibold">
                    {item.role}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline font-medium"
                >
                  Visit Source ↗
                </a>
              </div>
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                {item.attribution}
              </p>
              <div className="text-[11px] font-mono text-[var(--ink-2)]">
                LICENSE: {item.license}
              </div>
            </Panel>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
