'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

interface NarrativeBeat {
  id: string;
  stage: string;
  title: string;
  description: string;
  altitudeFt: number;
  speedKt: number;
  distRemainingNm: number;
  verticalRateFpm: number;
  mach: string;
  location: string;
}

const BEATS: NarrativeBeat[] = [
  {
    id: 'departure',
    stage: 'STAGE 01 / DEPARTURE CORRIDOR',
    title: 'Climb out over the English Channel',
    description:
      'Departing runway 27R at London Heathrow. Mode-S transponder broadcasting altitude gains at +2,400 FPM through FL180 towards initial cruise level.',
    altitudeFt: 18000,
    speedKt: 320,
    distRemainingNm: 5840,
    verticalRateFpm: 2400,
    mach: 'M 0.58',
    location: 'Dover Strait / FL180',
  },
  {
    id: 'cruise',
    stage: 'STAGE 02 / TRANSCONTINENTAL CRUISE',
    title: 'Level cruise at Flight Level 380',
    description:
      'Cruising along the South Asian airway corridor at Mach 0.84. ADS-B feeder stations across twelve sovereign airspaces relay position packets every two seconds.',
    altitudeFt: 38000,
    speedKt: 495,
    distRemainingNm: 3120,
    verticalRateFpm: 0,
    mach: 'M 0.84',
    location: 'Central Asia Airway / FL380',
  },
  {
    id: 'arrival',
    stage: 'STAGE 03 / TERMINAL ARRIVAL',
    title: 'Descent into Singapore Changi',
    description:
      'Descending through cloud tops above the Malacca Strait. Air traffic control radar vectors established for ILS approach runway 02L.',
    altitudeFt: 2800,
    speedKt: 165,
    distRemainingNm: 18,
    verticalRateFpm: -900,
    mach: 'M 0.28',
    location: 'Malacca Corridor / 2,800 FT',
  },
];

export function FollowFlightSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const reducedMotion = useReducedMotion();

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / totalScrollable));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [reducedMotion]);

  // Determine active narrative beat based on scroll progress
  const activeBeatIndex = scrollProgress < 0.38 ? 0 : scrollProgress < 0.75 ? 1 : 2;
  const currentBeat = BEATS[activeBeatIndex];

  // Interpolate dynamic metrics
  const p = scrollProgress;
  let currentAlt = 0;
  let currentSpeed = 0;
  let currentDist = 5980;

  if (p < 0.38) {
    const subP = p / 0.38;
    currentAlt = Math.round(1500 + subP * (38000 - 1500));
    currentSpeed = Math.round(180 + subP * (495 - 180));
    currentDist = Math.round(5980 - subP * (5980 - 3500));
  } else if (p < 0.75) {
    currentAlt = 38000;
    currentSpeed = 495;
    const subP = (p - 0.38) / (0.75 - 0.38);
    currentDist = Math.round(3500 - subP * (3500 - 1200));
  } else {
    const subP = (p - 0.75) / (1 - 0.75);
    currentAlt = Math.round(38000 - subP * (38000 - 150));
    currentSpeed = Math.round(495 - subP * (495 - 145));
    currentDist = Math.round(1200 - subP * (1200 - 2));
  }

  // Calculate position along flight route arc
  // Cubic Bezier curve from LHR (x: 80, y: 160) to SIN (x: 620, y: 320) through Middle East (x: 350, y: 120)
  // Coordinates in SVG viewBox: 0 0 700 400
  const t = Math.max(0.001, Math.min(0.999, p));
  const p0 = { x: 90, y: 160 };
  const p1 = { x: 260, y: 100 };
  const p2 = { x: 440, y: 180 };
  const p3 = { x: 620, y: 330 };

  // Cubic bezier formula
  const cx =
    Math.pow(1 - t, 3) * p0.x +
    3 * Math.pow(1 - t, 2) * t * p1.x +
    3 * (1 - t) * Math.pow(t, 2) * p2.x +
    Math.pow(t, 3) * p3.x;

  const cy =
    Math.pow(1 - t, 3) * p0.y +
    3 * Math.pow(1 - t, 2) * t * p1.y +
    3 * (1 - t) * Math.pow(t, 2) * p2.y +
    Math.pow(t, 3) * p3.y;

  // Tangent for rotation
  const dx =
    3 * Math.pow(1 - t, 2) * (p1.x - p0.x) +
    6 * (1 - t) * t * (p2.x - p1.x) +
    3 * Math.pow(t, 2) * (p3.x - p2.x);

  const dy =
    3 * Math.pow(1 - t, 2) * (p1.y - p0.y) +
    6 * (1 - t) * t * (p2.y - p1.y) +
    3 * Math.pow(t, 2) * (p3.y - p2.y);

  const tangentAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

  // Reduced motion alternative: static multi-beat cards
  if (reducedMotion) {
    return (
      <section className="py-20 px-6 sm:px-12 max-w-[1360px] mx-auto border-t border-[var(--line)] space-y-12">
        <div className="space-y-3">
          <Chip variant="signal">Follow One Flight</Chip>
          <h2 className="font-serif text-3xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Transcontinental Trajectory: London to Singapore
          </h2>
          <p className="text-base text-[var(--ink-2)] max-w-2xl">
            Sample transcontinental flight corridor (SQ317 · Boeing 777-300ER) demonstrating telemetry dynamics across departure, cruise, and arrival.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BEATS.map((beat) => (
            <div
              key={beat.id}
              className="p-6 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] space-y-4 shadow-sm"
            >
              <div className="mono-label text-[10px] text-[var(--signal-ink)] font-bold">
                {beat.stage}
              </div>
              <h3 className="font-serif text-2xl text-[var(--ink)]">{beat.title}</h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">{beat.description}</p>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--line)] text-xs font-mono">
                <div>
                  <span className="text-[var(--ink-3)] block text-[10px]">ALTITUDE</span>
                  <span className="font-bold text-[var(--ink)]">{beat.altitudeFt.toLocaleString()} FT</span>
                </div>
                <div>
                  <span className="text-[var(--ink-3)] block text-[10px]">GROUND SPEED</span>
                  <span className="font-bold text-[var(--ink)]">{beat.speedKt} KT</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] border-t border-[var(--line)]">
      {/* Pinned Viewport Container */}
      <div
        ref={triggerRef}
        className="sticky top-0 w-full h-screen max-h-screen overflow-hidden flex flex-col justify-between pt-24 sm:pt-28 pb-6 px-4 sm:px-12 max-w-[1360px] mx-auto relative select-none bg-[var(--paper)]"
      >
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3 z-10">
          <div className="flex items-center gap-2.5">
            <Chip variant="signal" dot>
              Follow One Flight
            </Chip>
            <span className="mono-label text-[10px] sm:text-[11px] text-[var(--ink-2)] truncate">
              SAMPLE CORRIDOR: SQ317 · LHR → SIN
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--ink-3)]">
            <span className="text-[10px] sm:text-xs">SCRUBBED 1:1 WITH SCROLL</span>
            <div className="w-20 sm:w-24 h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--signal)] transition-all duration-75"
                style={{ width: `${Math.round(p * 100)}%` }}
              />
            </div>
            <span className="font-bold text-[var(--ink)] tabular-nums">{Math.round(p * 100)}%</span>
          </div>
        </div>

        {/* Center Interactive Layout: Great-Circle Arc Map (Left/Center) + Telemetry Deck (Right) */}
        <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
          {/* Main Map Corridor Illustration */}
          <div className="lg:col-span-7 relative w-full aspect-[700/400] rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line-strong)] p-4 shadow-sm overflow-hidden">
            {/* Soft grid background */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(var(--ink-3) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Geographical Vector Guides */}
            <svg
              viewBox="0 0 700 400"
              className="w-full h-full overflow-visible"
              fill="none"
            >
              {/* Waypoint Markers */}
              {/* London Heathrow */}
              <g transform="translate(90, 160)">
                <circle r="4" fill="var(--ink)" />
                <circle r="8" stroke="var(--ink)" strokeWidth="1" strokeDasharray="2 2" />
                <text x="-12" y="-12" className="text-[11px] font-mono font-bold fill-[var(--ink)]">
                  LHR
                </text>
                <text x="-12" y="20" className="text-[9px] font-mono fill-[var(--ink-3)]">
                  LONDON
                </text>
              </g>

              {/* Waypoint Waypoint Corridor Points */}
              <g transform="translate(260, 100)">
                <circle r="2.5" fill="var(--line-strong)" />
                <text x="6" y="3" className="text-[8px] font-mono fill-[var(--ink-4)]">
                  WAYPOINT ALKIN
                </text>
              </g>
              <g transform="translate(440, 180)">
                <circle r="2.5" fill="var(--line-strong)" />
                <text x="6" y="3" className="text-[8px] font-mono fill-[var(--ink-4)]">
                  WAYPOINT PARDI
                </text>
              </g>

              {/* Singapore Changi */}
              <g transform="translate(620, 330)">
                <circle r="4" fill="var(--signal)" />
                <circle r="8" stroke="var(--signal)" strokeWidth="1" strokeDasharray="2 2" />
                <text x="-12" y="-12" className="text-[11px] font-mono font-bold fill-[var(--signal)]">
                  SIN
                </text>
                <text x="-12" y="20" className="text-[9px] font-mono fill-[var(--ink-3)]">
                  SINGAPORE
                </text>
              </g>

              {/* Full planned corridor curve (dashed) */}
              <path
                ref={pathRef}
                d="M 90 160 C 260 100, 440 180, 620 330"
                stroke="var(--line-strong)"
                strokeWidth="2"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />

              {/* Completed flown path (solid signal) */}
              <path
                d="M 90 160 C 260 100, 440 180, 620 330"
                stroke="var(--signal)"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
              />

              {/* Aircraft silhouette rotating along curve tangent */}
              <g
                transform={`translate(${cx}, ${cy}) rotate(${tangentAngle})`}
                className="text-[var(--ink)] fill-current transition-transform duration-75"
              >
                {/* Ground shadow offset down-right */}
                <g transform="translate(4, 5) scale(0.4)" className="opacity-15 fill-[var(--ink)]">
                  <path d={SILHOUETTES['widebody_twin'].bodyPath} />
                </g>
                {/* Aircraft Body */}
                <g transform="translate(-16, -16) scale(0.5)">
                  <path d={SILHOUETTES['widebody_twin'].bodyPath} />
                </g>
              </g>
            </svg>

            {/* Position Coordinate Tag */}
            <div className="absolute bottom-3 left-4 font-mono text-[10px] text-[var(--ink-3)] bg-[var(--surface)]/90 px-2 py-1 rounded border border-[var(--line)]">
              TRACK VECTOR: {Math.round(tangentAngle)}° · LAT {((1 - p) * 51.4 + p * 1.3).toFixed(2)}° N
            </div>
          </div>

          {/* Right Narrative & Telemetry Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Narrative Beat Stage */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)]" />
                <span className="mono-label text-[11px] font-bold text-[var(--signal-ink)]">
                  {currentBeat.stage}
                </span>
              </div>

              {/* Masked Headline Transition */}
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[var(--ink)] tracking-tight leading-snug">
                {currentBeat.title}
              </h2>

              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                {currentBeat.description}
              </p>
            </div>

            {/* Live Ticking Telemetry Deck */}
            <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--line-strong)] space-y-4 shadow-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded bg-[var(--paper)] border border-[var(--line)]">
                  <span className="mono-label text-[9px] text-[var(--ink-3)] block">ALTITUDE</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
                    {currentAlt.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--ink-3)] block">FT MSL</span>
                </div>

                <div className="p-2.5 rounded bg-[var(--paper)] border border-[var(--line)]">
                  <span className="mono-label text-[9px] text-[var(--ink-3)] block">GROUND SPEED</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-[var(--ink)] tabular-nums">
                    {currentSpeed}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--ink-3)] block">KNOTS</span>
                </div>

                <div className="p-2.5 rounded bg-[var(--paper)] border border-[var(--line)]">
                  <span className="mono-label text-[9px] text-[var(--ink-3)] block">REMAINING</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-[var(--signal-ink)] tabular-nums">
                    {currentDist.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--ink-3)] block">NM</span>
                </div>
              </div>

              {/* Self-Drawing Dynamic Altitude Profile SVG */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-3)]">
                  <span>VERTICAL FLIGHT PROFILE</span>
                  <span>{currentBeat.mach}</span>
                </div>

                <div className="h-14 w-full bg-[var(--paper)] border border-[var(--line)] rounded p-1.5 relative overflow-hidden">
                  <svg viewBox="0 0 300 50" className="w-full h-full overflow-visible" fill="none">
                    {/* Planned profile curve */}
                    <path
                      d="M 5 45 C 50 10, 100 10, 150 10 C 200 10, 250 10, 295 45"
                      stroke="var(--line-strong)"
                      strokeWidth="1.5"
                      strokeDasharray="2 3"
                    />

                    {/* Flown profile fill */}
                    <path
                      d="M 5 45 C 50 10, 100 10, 150 10 C 200 10, 250 10, 295 45"
                      stroke="var(--signal)"
                      strokeWidth="2"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - p}
                    />

                    {/* Scrub position indicator */}
                    <circle
                      cx={5 + p * 290}
                      cy={p < 0.38 ? 45 - (p / 0.38) * 35 : p < 0.75 ? 10 : 10 + ((p - 0.75) / 0.25) * 35}
                      r="3.5"
                      fill="var(--signal)"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="pt-2">
              <Link href="/flight/SQ317">
                <Button variant="outline" size="sm" icon="arrow-right" iconPosition="right">
                  Open SQ317 flight dossier
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Status Footnote */}
        <div className="border-t border-[var(--line)] pt-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] font-mono text-[var(--ink-3)] z-10">
          <span>AIRFRAME: B777-300ER (WIDEBODY TWIN)</span>
          <span>FLIGHT OBSERVATORY ARCHITECTURE</span>
        </div>
      </div>
    </div>
  );
}
