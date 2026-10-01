import React from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { siteConfig } from '@/lib/site-config';

export const metadata = {
  title: 'Engineering Case Study & Architecture — Aeroloom',
  description:
    'Deep engineering retrospective on Aeroloom: real-time ADS-B kinematic telemetry, 60fps WebGL cartography, request coalescing, and grounded AI flight intelligence.',
};

export default function AboutCaseStudyPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between selection:bg-[var(--signal-wash)] selection:text-[var(--signal-ink)] overflow-x-hidden">
      {/* Top Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-85 transition-opacity" aria-label="Aeroloom Home">
            <AeroloomLogo variant="lockup" size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/map">
              <Button variant="signal" size="sm" icon="radio">
                Live Radar
              </Button>
            </Link>
            <Link href="/about/data">
              <Button variant="ghost" size="sm">
                Data Feeds
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[960px] mx-auto px-4 sm:px-12 py-16 space-y-16 min-w-0">
        {/* Hero Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Chip variant="signal">TECHNICAL RETROSPECTIVE</Chip>
            <Chip variant="neutral">VERSION 2.0.0-EDITORIAL</Chip>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-[var(--ink)] tracking-tight leading-[1.08]">
            Editorial Aviation &amp; The Mechanics of <span className="italic">Real-Time Airspace</span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--ink-2)] leading-relaxed font-sans max-w-3xl">
            A technical postmortem on designing and engineering Aeroloom: an open-source, real-time airspace observatory built on warm paper, verified ADS-B transponder feeds, sub-pixel kinematics, and zero synthetic traffic.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--ink-3)] border-t border-[var(--line)] pt-4">
            <div>AUTHOR: <span className="text-[var(--ink)] font-semibold">{siteConfig.developer.name}</span></div>
            <div>·</div>
            <div>LOCATION: <span className="text-[var(--ink)]">{siteConfig.developer.location}</span></div>
            <div>·</div>
            <div>READ TIME: <span className="text-[var(--ink)]">8 MIN</span></div>
          </div>
        </section>

        {/* Section 1: The Problem Space */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] tracking-tight border-b border-[var(--line)] pb-3">
            1. The Problem Space: The Ubiquitous Dark Radar Cliché
          </h2>

          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            For decades, consumer flight trackers have conformed to a singular visual trope: jet-black phosphor screens, neon green flight vectors, fake 3D wireframe terrains, and battery-draining WebGL canvas loops. Beyond the aesthetic fatigue, these products are cluttered with heavy subscription banners, advertising trackers, and worst of all: <em>synthetic predictive ghost traffic</em> where airframes continue flying across screens minutes after losing transponder contact.
          </p>

          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            Aeroloom was built from first principles to explore the antithesis: <strong>Editorial Aviation</strong>. What if a live airspace observatory felt like a crisp, tactile Swiss airline timetable or an aeronautical sectional chart rendered in modern high-DPI ink?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Panel variant="surface" className="p-5 space-y-2 bg-[var(--surface)]">
              <span className="font-mono text-xs font-bold text-[var(--bad-ink)] uppercase">The Legacy Tracker Paradigm</span>
              <ul className="text-xs text-[var(--ink-2)] space-y-1.5 list-disc list-inside">
                <li>Dark, battery-cooking Three.js canvas grids</li>
                <li>10MB+ bundle sizes stuffed with ad-tech SDKs</li>
                <li>Synthesized flight paths without transponder lock</li>
                <li>Paywalled METAR and historical playback</li>
              </ul>
            </Panel>

            <Panel variant="surface" className="p-5 space-y-2 bg-[var(--surface)]">
              <span className="font-mono text-xs font-bold text-[var(--ok-ink)] uppercase">The Aeroloom Architecture</span>
              <ul className="text-xs text-[var(--ink-2)] space-y-1.5 list-disc list-inside">
                <li>Archival paper palette (<code className="text-[var(--ink)]">#F6F4EE</code>) with 15.2:1 AAA contrast</li>
                <li>MapLibre GL 2D symbol layer at sustained 60 FPS</li>
                <li>Multi-tier in-memory + Redis request coalescing</li>
                <li>Uncensored, crowdsourced 1090 MHz ADS-B feeds</li>
              </ul>
            </Panel>
          </div>
        </section>

        {/* Section 2: Technical Architecture */}
        <section className="space-y-6 min-w-0 max-w-full overflow-hidden">
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] tracking-tight border-b border-[var(--line)] pb-3">
            2. High-Performance Telemetry Pipeline
          </h2>

          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            The core challenge of live flight tracking is high concurrency and rate-limit shielding. If 500 concurrent users view the Los Angeles airspace sector (KLAX), naive front-ends would hammer upstream feeds with 500 duplicate requests every 3 seconds, quickly exhausting free community tier quotas.
          </p>

          {/* ASCII / Monospace Architecture Diagram */}
          <div className="w-full max-w-full p-4 sm:p-6 rounded-md bg-[var(--surface)] border border-[var(--line)] overflow-x-auto font-mono text-[11px] sm:text-xs text-[var(--ink)] leading-relaxed min-w-0">
            <pre className="select-all min-w-fit">
{`[ Client Viewport ] (MapLibre GL JS — Sub-Pixel Dead Reckoning)
        │
        ▼ HTTP GET /api/aircraft/live?bbox={w,s,e,n} (Debounced 250ms)
[ Next.js Server Route Handler ]
        │
        ├── [ Per-IP Sliding Window Rate Limiter: 120 req/min ] ──> (429 Retry-After)
        │
        ▼ [ Request Coalescing Engine (In-Flight Promise Sharing) ]
        │   └── 50 concurrent sector queries wait on 1 upstream fetch
        │
        ▼ [ Two-Tier Cache: L1 In-Memory (6s TTL) + L2 Upstash Redis ]
        │   ├── Cache HIT: Return gzip GeoJSON payload (4ms response)
        │   └── Cache MISS / Stale: Fallback to Chained Provider
        │
        ▼ [ Chained Telemetry Feeder Pipeline ]
            ├── Primary: airplanes.live (Crowdsourced 1090MHz ADS-B)
            └── Failover: adsb.lol (Open Community Feeder Network)`}
            </pre>
          </div>

          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            Through request coalescing and a 6-second server-side TTL, Aeroloom shields upstream community aggregators. Even during viral traffic spikes, the server issues at most one upstream query per geographic sector every 6 seconds.
          </p>
        </section>

        {/* Section 3: WebGL & Kinematic Dead Reckoning */}
        <section className="space-y-6 min-w-0 max-w-full">
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] tracking-tight border-b border-[var(--line)] pb-3">
            3. 60 FPS Rendering &amp; Kinematic Interpolation
          </h2>

          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            Transponder transmissions arrive in discrete packets every 2 to 10 seconds. Rendering these raw timestamps results in jerky, stepped aircraft jumps. Aeroloom implements a client-side kinematic dead reckoning worker:
          </p>

          <Panel variant="recessed" className="p-4 sm:p-6 bg-[var(--paper-2)] space-y-3 font-mono text-[11px] sm:text-xs text-[var(--ink-2)] overflow-x-auto min-w-0">
            <div className="font-bold text-[var(--ink)]">DEAD RECKONING FORMULATION:</div>
            <div>Δt = (current_timestamp - last_packet_timestamp) / 1000.0</div>
            <div>distance_nm = (groundSpeed_knots * Δt) / 3600.0</div>
            <div>new_lat = lat + (distance_nm / 60.0) * cos(heading_rad)</div>
            <div>new_lon = lon + (distance_nm / (60.0 * cos(lat_rad))) * sin(heading_rad)</div>
          </Panel>

          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            By utilizing a single pre-baked <strong>MapLibre GL Sprite Atlas</strong> containing 11 canonical airframe categories across 6 distinct states (in-flight, selected, hovered, emergency, on-ground, and transponder-lost), the entire fleet of up to 5,000 aircraft is rendered in a single WebGL draw call.
          </p>
        </section>

        {/* Section 4: Grounded AI Flight Assistant */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] tracking-tight border-b border-[var(--line)] pb-3">
            4. Grounded AI Flight Intelligence (&ldquo;Ask Aeroloom&rdquo;)
          </h2>

          <p className="text-base text-[var(--ink-2)] leading-relaxed">
            Rather than bolting on a generic chat widget that hallucinates flight statuses, <strong>Ask Aeroloom</strong> operates under strict grounding constraints. Queries pass through an XML sanitization barrier, dynamic tool retrieval loads live METAR and ADS-B telemetry, and a multi-model fallback chain across OpenRouter ensures uninterrupted responses with zero commercial API expenses.
          </p>
        </section>

        {/* Section 5: The Creator & Colophon */}
        <section className="space-y-6 pt-4 border-t border-[var(--line-strong)]">
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
            5. Creator &amp; Engineering Credits
          </h2>

          <Panel variant="surface" className="p-6 sm:p-8 bg-[var(--surface)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-[var(--ink)]">
                  {siteConfig.developer.name}
                </h3>
                <p className="text-sm font-sans text-[var(--ink-2)]">
                  {siteConfig.developer.role} · {siteConfig.developer.location}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={siteConfig.developer.links.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="signal" size="sm" icon="arrow-up-right">
                    Portfolio
                  </Button>
                </a>
                <a
                  href={siteConfig.developer.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" icon="arrow-up-right">
                    GitHub
                  </Button>
                </a>
                <a
                  href={siteConfig.developer.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" icon="arrow-up-right">
                    LinkedIn
                  </Button>
                </a>
              </div>
            </div>

            <p className="text-sm text-[var(--ink-2)] leading-relaxed">
              Aeroloom was conceived, designed, and coded as an obsessive exploration into high-performance web cartography, type-safe Next.js architecture, and editorial digital interfaces.
            </p>

            <div className="pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--ink-2)]">
              <div>STACK: Next.js 16 · React 19 · TypeScript · MapLibre GL · Upstash Redis · Supabase</div>
              <Link href="/contact" className="text-[var(--signal-ink)] hover:underline font-semibold">
                Send Direct Feedback →
              </Link>
            </div>
          </Panel>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
