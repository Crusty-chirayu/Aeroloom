'use client';

import React, { useState } from 'react';
import type { AircraftCategory } from '@/lib/map/silhouettes/types';
import { AIRCRAFT_CATEGORIES } from '@/lib/map/silhouettes/types';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';
import { useReducedMotion } from '@/lib/motion';

export interface AircraftBlueprintProps {
  category: AircraftCategory;
  specificModel?: string;
  className?: string;
}

export function AircraftBlueprint({
  category = 'narrowbody',
  specificModel,
  className = '',
}: AircraftBlueprintProps) {
  const [activeView, setActiveView] = useState<'all' | 'top' | 'side' | 'front'>('all');
  const prefersReduced = useReducedMotion();
  const meta = AIRCRAFT_CATEGORIES[category] || AIRCRAFT_CATEGORIES.unknown;
  const def = SILHOUETTES[category] || SILHOUETTES.unknown;

  const wingspanFt = Math.round(meta.typicalWingspanM * 3.28084);
  const lengthFt = Math.round(meta.typicalLengthM * 3.28084);
  const heightFt = Math.round(meta.typicalHeightM * 3.28084);

  // SVG stroke animation style
  const animStyle: React.CSSProperties = prefersReduced
    ? {}
    : {
        strokeDasharray: 800,
        strokeDashoffset: 0,
        animation: 'blueprintDrawIn 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      };

  return (
    <div
      className={`relative w-full rounded-[var(--r-lg)] border border-[var(--line-strong)] bg-[var(--paper)] p-6 md:p-8 text-[var(--ink)] overflow-hidden ${className}`}
      data-testid="aircraft-blueprint"
    >
      {/* Background Engineering Cadastre Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(14, 17, 22, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(14, 17, 22, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header Technical Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--line)] pb-4 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--signal)]" />
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
              AERONAUTICAL TECHNICAL SPECIFICATION · REV 2.4
            </span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-[var(--ink)] font-normal tracking-tight">
            {meta.name}
          </h3>
          <p className="font-mono text-xs text-[var(--ink-2)] mt-0.5">
            {specificModel ? (
              <span>
                MODEL: <strong className="text-[var(--ink)]">{specificModel}</strong>{' '}
                <span className="text-[var(--ink-3)]">
                  (Category Representative Drawing)
                </span>
              </span>
            ) : (
              <span>STAND-IN DRAWING · TYPICAL ARCHITECTURE FOR {meta.name.toUpperCase()}</span>
            )}
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center border border-[var(--line)] rounded-[var(--r-sm)] p-0.5 bg-[var(--paper-warm)]">
          {(['all', 'top', 'side', 'front'] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`px-3 py-1 font-mono text-[11px] uppercase tracking-wider rounded-[6px] transition-all duration-150 ${
                activeView === view
                  ? 'bg-[var(--paper)] text-[var(--ink)] shadow-[var(--sh-1)] font-semibold'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Blueprint Drawing Canvases */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* TOP VIEW PLAN */}
        {(activeView === 'all' || activeView === 'top') && (
          <div
            className={`flex flex-col items-center justify-center p-4 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)]/60 ${
              activeView === 'top' ? 'md:col-span-12' : 'md:col-span-6'
            }`}
          >
            <div className="w-full flex justify-between items-center mb-2 font-mono text-[10px] text-[var(--ink-3)] tracking-wider">
              <span>VIEW A-A · PLANFORM (TOP)</span>
              <span>SCALE: NTS</span>
            </div>

            <svg
              viewBox="0 0 120 120"
              className="w-full max-w-[280px] h-auto overflow-visible select-none text-[var(--ink)]"
            >
              {/* Construction Datum Lines */}
              <line
                x1="60"
                y1="5"
                x2="60"
                y2="115"
                stroke="rgba(14,17,22,0.25)"
                strokeWidth="0.75"
                strokeDasharray="4 2 1 2"
              />
              <line
                x1="10"
                y1="60"
                x2="110"
                y2="60"
                stroke="rgba(14,17,22,0.25)"
                strokeWidth="0.75"
                strokeDasharray="4 2 1 2"
              />

              {/* Scaled Top Silhouette Contour */}
              <g transform="translate(60,60) scale(1.4) translate(-32,-32)">
                <path
                  d={def.bodyPath}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={animStyle}
                />
                {def.detailPaths?.map((d, i) => (
                  <path
                    key={i}
                    d={d.d}
                    fill="none"
                    stroke="var(--ink-2)"
                    strokeWidth={d.strokeWidth ?? 0.9}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={d.strokeDasharray}
                    style={animStyle}
                  />
                ))}
              </g>

              {/* Wingspan Dimension Callout */}
              <line x1="12" y1="12" x2="108" y2="12" stroke="var(--ink-2)" strokeWidth="0.8" />
              <line x1="12" y1="9" x2="12" y2="15" stroke="var(--ink-2)" strokeWidth="0.8" />
              <line x1="108" y1="9" x2="108" y2="15" stroke="var(--ink-2)" strokeWidth="0.8" />
              <text
                x="60"
                y="9"
                textAnchor="middle"
                className="font-mono text-[7px] fill-[var(--ink)] tracking-wider"
              >
                SPAN {meta.typicalWingspanM} m ({wingspanFt} ft)
              </text>
            </svg>
          </div>
        )}

        {/* SIDE ELEVATION VIEW */}
        {(activeView === 'all' || activeView === 'side') && (
          <div
            className={`flex flex-col items-center justify-center p-4 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)]/60 ${
              activeView === 'side' ? 'md:col-span-12' : 'md:col-span-6'
            }`}
          >
            <div className="w-full flex justify-between items-center mb-2 font-mono text-[10px] text-[var(--ink-3)] tracking-wider">
              <span>VIEW B-B · SIDE ELEVATION</span>
              <span>SCALE: NTS</span>
            </div>

            <svg
              viewBox="0 0 140 80"
              className="w-full max-w-[280px] h-auto overflow-visible select-none text-[var(--ink)]"
            >
              {/* Ground clearance line */}
              <line
                x1="5"
                y1="68"
                x2="135"
                y2="68"
                stroke="rgba(14,17,22,0.2)"
                strokeWidth="0.75"
                strokeDasharray="2 2"
              />

              {/* Category-Specific Side Profile */}
              <g style={animStyle}>
                {category === 'helicopter' ? (
                  // Helicopter Side Elevation (Cabin pod, rotor mast, tail boom, skids)
                  <>
                    <path
                      d="M 25,48 C 28,38 38,36 55,36 L 68,36 C 75,36 78,40 76,48 C 74,54 68,56 55,56 L 36,56 C 28,56 24,53 25,48 Z"
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="1.25"
                    />
                    <path d="M 76,42 L 125,43 L 126,35 L 128,43 L 126,50 Z" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
                    {/* Rotor mast and rotor head */}
                    <line x1="50" y1="36" x2="50" y2="24" stroke="var(--ink)" strokeWidth="1.5" />
                    <line x1="15" y1="24" x2="85" y2="24" stroke="var(--ink)" strokeWidth="1.25" />
                    {/* Landing skids */}
                    <path d="M 28,66 L 70,66 M 38,56 L 38,66 M 58,56 L 58,66" stroke="var(--ink-2)" strokeWidth="1.2" />
                  </>
                ) : category === 'light_ga' ? (
                  // Light GA Side Elevation (High wing, front spinner, tricycle gear)
                  <>
                    <path
                      d="M 20,48 C 22,42 28,40 45,40 L 75,40 C 95,40 115,44 124,46 C 115,49 95,51 75,51 L 30,51 C 24,51 20,49 20,48 Z"
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="1.25"
                    />
                    {/* High-mounted wing section */}
                    <rect x="42" y="36" width="22" height="4" rx="1" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
                    {/* Nose propeller */}
                    <line x1="17" y1="38" x2="17" y2="58" stroke="var(--ink)" strokeWidth="1.5" />
                    {/* Tail fin */}
                    <path d="M 105,40 L 124,24 L 127,25 L 122,46 Z" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    {/* Landing gear */}
                    <line x1="30" y1="51" x2="30" y2="67" stroke="var(--ink-2)" strokeWidth="1" />
                    <circle cx="30" cy="67" r="1.5" fill="var(--ink-2)" />
                    <line x1="54" y1="51" x2="54" y2="67" stroke="var(--ink-2)" strokeWidth="1" />
                    <circle cx="54" cy="67" r="1.8" fill="var(--ink-2)" />
                  </>
                ) : category === 'turboprop' ? (
                  // Turboprop Side Elevation (High wing, T-Tail, nose prop / nacelles)
                  <>
                    <path
                      d="M 15,46 C 17,40 25,38 42,38 L 105,38 C 114,38 122,41 126,45 C 122,49 114,52 105,52 L 35,52 C 24,52 16,49 15,46 Z"
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="1.25"
                    />
                    {/* High wing profile */}
                    <rect x="44" y="34" width="26" height="5" rx="1" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
                    {/* Propeller disc line */}
                    <line x1="42" y1="28" x2="42" y2="56" stroke="var(--ink)" strokeWidth="1.5" />
                    {/* T-Tail */}
                    <path d="M 104,38 L 122,18 L 126,18 L 122,38 Z" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <line x1="112" y1="18" x2="130" y2="18" stroke="var(--ink)" strokeWidth="1.5" />
                    {/* Gear */}
                    <line x1="32" y1="52" x2="32" y2="67" stroke="var(--ink-2)" strokeWidth="1" />
                    <circle cx="32" cy="67" r="1.5" fill="var(--ink-2)" />
                    <line x1="58" y1="52" x2="58" y2="67" stroke="var(--ink-2)" strokeWidth="1" />
                    <circle cx="58" cy="67" r="1.8" fill="var(--ink-2)" />
                  </>
                ) : category === 'military' ? (
                  // Fast Jet Military Side Elevation (Sharp radome, bubble canopy, afterburner)
                  <>
                    <path
                      d="M 10,48 L 22,44 C 30,44 40,43 55,43 L 115,43 L 126,46 L 126,49 L 112,50 L 32,50 Z"
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="1.25"
                    />
                    {/* Bubble canopy */}
                    <path d="M 30,44 C 34,36 44,36 50,44 Z" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
                    {/* Canted tail rudder */}
                    <path d="M 95,43 L 118,22 L 124,24 L 118,46 Z" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <line x1="28" y1="50" x2="28" y2="67" stroke="var(--ink-2)" strokeWidth="1" />
                    <circle cx="28" cy="67" r="1.5" fill="var(--ink-2)" />
                    <line x1="75" y1="50" x2="75" y2="67" stroke="var(--ink-2)" strokeWidth="1" />
                    <circle cx="75" cy="67" r="1.8" fill="var(--ink-2)" />
                  </>
                ) : (
                  // Mainline Airliners & Business Jets
                  <>
                    <path
                      d="M 12,46 C 14,40 22,38 38,38 L 105,38 C 114,38 122,41 126,45 C 122,49 114,52 105,52 L 35,52 C 22,52 13,49 12,46 Z"
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="1.25"
                      strokeLinejoin="round"
                    />
                    <path d="M 18,43 L 25,40" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
                    <path
                      d="M 98,38 L 122,16 L 126,17 L 122,38 Z"
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="1.25"
                      strokeLinejoin="round"
                    />
                    {/* Engine nacelle profile */}
                    <path
                      d={category === 'regional_jet' || category === 'bizjet' ? 'M 92,40 L 106,40 C 109,40 110,42 110,45 L 90,45 C 90,42 91,40 92,40 Z' : 'M 44,48 L 58,48 C 61,48 62,50 62,53 L 42,53 C 42,50 43,48 44,48 Z'}
                      fill="none"
                      stroke="var(--ink-2)"
                      strokeWidth="1"
                    />
                    <line x1="32" y1="52" x2="32" y2="67" stroke="var(--ink-2)" strokeWidth="1" />
                    <circle cx="32" cy="67" r="1.5" fill="var(--ink-2)" />
                    <line x1="68" y1="52" x2="68" y2="67" stroke="var(--ink-2)" strokeWidth="1" />
                    <circle cx="68" cy="67" r="1.8" fill="var(--ink-2)" />
                  </>
                )}
              </g>

              {/* Overall Length Dimension Callout */}
              <line x1="12" y1="74" x2="126" y2="74" stroke="var(--ink-2)" strokeWidth="0.8" />
              <line x1="12" y1="71" x2="126" y2="71" stroke="var(--ink-2)" strokeWidth="0.8" />
              <line x1="126" y1="71" x2="126" y2="74" stroke="var(--ink-2)" strokeWidth="0.8" />
              <text
                x="70"
                y="72"
                textAnchor="middle"
                className="font-mono text-[7px] fill-[var(--ink)] tracking-wider"
              >
                LENGTH {meta.typicalLengthM} m ({lengthFt} ft)
              </text>
            </svg>
          </div>
        )}

        {/* FRONT ELEVATION VIEW */}
        {(activeView === 'all' || activeView === 'front') && (
          <div
            className={`flex flex-col items-center justify-center p-4 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)]/60 ${
              activeView === 'front' ? 'md:col-span-12' : 'md:col-span-12'
            }`}
          >
            <div className="w-full flex justify-between items-center mb-2 font-mono text-[10px] text-[var(--ink-3)] tracking-wider">
              <span>VIEW C-C · FRONT ELEVATION & DIHEDRAL</span>
              <span>SCALE: NTS</span>
            </div>

            <svg
              viewBox="0 0 200 60"
              className="w-full max-w-[420px] h-auto overflow-visible select-none text-[var(--ink)]"
            >
              {/* Ground plane */}
              <line
                x1="10"
                y1="50"
                x2="190"
                y2="50"
                stroke="rgba(14,17,22,0.2)"
                strokeWidth="0.75"
                strokeDasharray="2 2"
              />

              <g style={animStyle}>
                {category === 'helicopter' ? (
                  // Helicopter Front Elevation (Teardrop pod, rotor disc line, landing skids)
                  <>
                    <ellipse cx="100" cy="34" rx="9" ry="10" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <line x1="100" y1="24" x2="100" y2="12" stroke="var(--ink)" strokeWidth="1.5" />
                    <line x1="30" y1="12" x2="170" y2="12" stroke="var(--ink)" strokeWidth="1.5" />
                    {/* Skids */}
                    <line x1="88" y1="44" x2="84" y2="50" stroke="var(--ink-2)" strokeWidth="1.2" />
                    <line x1="80" y1="50" x2="88" y2="50" stroke="var(--ink-2)" strokeWidth="1.5" />
                    <line x1="112" y1="44" x2="116" y2="50" stroke="var(--ink-2)" strokeWidth="1.2" />
                    <line x1="112" y1="50" x2="120" y2="50" stroke="var(--ink-2)" strokeWidth="1.5" />
                  </>
                ) : category === 'quad' ? (
                  // Quad Engine Heavy Front Elevation (4 engines, high-capacity fuselage)
                  <>
                    <ellipse cx="100" cy="32" rx="9" ry="10" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <line x1="100" y1="22" x2="100" y2="8" stroke="var(--ink)" strokeWidth="1.25" />
                    {/* Left Wing & 2 Engines */}
                    <path d="M 91,33 L 15,22 L 13,19" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <ellipse cx="68" cy="36" rx="4" ry="4.5" fill="none" stroke="var(--ink-2)" strokeWidth="1" />
                    <ellipse cx="44" cy="34" rx="3.5" ry="4" fill="none" stroke="var(--ink-2)" strokeWidth="1" />
                    {/* Right Wing & 2 Engines */}
                    <path d="M 109,33 L 185,22 L 187,19" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <ellipse cx="132" cy="36" rx="4" ry="4.5" fill="none" stroke="var(--ink-2)" strokeWidth="1" />
                    <ellipse cx="156" cy="34" rx="3.5" ry="4" fill="none" stroke="var(--ink-2)" strokeWidth="1" />
                  </>
                ) : category === 'turboprop' || category === 'light_ga' ? (
                  // High Wing / Propeller Front Elevation
                  <>
                    <ellipse cx="100" cy="34" rx="7" ry="8" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <line x1="100" y1="26" x2="100" y2="12" stroke="var(--ink)" strokeWidth="1.25" />
                    {/* High straight wing mounted atop fuselage */}
                    <path d="M 100,26 L 25,26 M 100,26 L 175,26" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    {category === 'turboprop' ? (
                      <>
                        {/* Twin Turboprop spinners */}
                        <circle cx="65" cy="27" r="7" fill="none" stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="3 2" />
                        <circle cx="135" cy="27" r="7" fill="none" stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="3 2" />
                      </>
                    ) : (
                      <>
                        {/* Single Nose Propeller */}
                        <circle cx="100" cy="34" r="8" fill="none" stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="3 2" />
                        {/* Wing struts */}
                        <line x1="93" y1="38" x2="60" y2="26" stroke="var(--ink-2)" strokeWidth="1" />
                        <line x1="107" y1="38" x2="140" y2="26" stroke="var(--ink-2)" strokeWidth="1" />
                      </>
                    )}
                  </>
                ) : (
                  // Standard Twin-Jet Front Elevation
                  <>
                    <ellipse cx="100" cy="32" rx="7" ry="8" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <line x1="100" y1="24" x2="100" y2="10" stroke="var(--ink)" strokeWidth="1.25" />
                    <line x1="97" y1="10" x2="103" y2="10" stroke="var(--ink)" strokeWidth="1" />
                    {/* Left Wing */}
                    <path d="M 93,33 L 25,24 L 23,21" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <ellipse cx="70" cy="38" rx="4" ry="4.5" fill="none" stroke="var(--ink-2)" strokeWidth="1" />
                    <line x1="70" y1="31" x2="70" y2="34" stroke="var(--ink-2)" strokeWidth="1" />
                    {/* Right Wing */}
                    <path d="M 107,33 L 175,24 L 177,21" fill="none" stroke="var(--ink)" strokeWidth="1.25" />
                    <ellipse cx="130" cy="38" rx="4" ry="4.5" fill="none" stroke="var(--ink-2)" strokeWidth="1" />
                    <line x1="130" y1="31" x2="130" y2="34" stroke="var(--ink-2)" strokeWidth="1" />
                  </>
                )}
              </g>

              {/* Height Dimension Callout */}
              <line x1="108" y1="10" x2="108" y2="50" stroke="var(--ink-2)" strokeWidth="0.8" />
              <line x1="106" y1="10" x2="110" y2="10" stroke="var(--ink-2)" strokeWidth="0.8" />
              <line x1="106" y1="50" x2="110" y2="50" stroke="var(--ink-2)" strokeWidth="0.8" />
              <text
                x="114"
                y="32"
                textAnchor="start"
                className="font-mono text-[7px] fill-[var(--ink)] tracking-wider"
              >
                HEIGHT {meta.typicalHeightM} m ({heightFt} ft)
              </text>
            </svg>
          </div>
        )}
      </div>

      {/* Engineering Footer Data Strip */}
      <div className="relative z-10 mt-6 pt-4 border-t border-[var(--line)] grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[11px]">
        <div>
          <span className="block text-[var(--ink-3)] text-[10px] uppercase">Category</span>
          <span className="font-semibold">{meta.name}</span>
        </div>
        <div>
          <span className="block text-[var(--ink-3)] text-[10px] uppercase">Wingspan / Length</span>
          <span>
            {meta.typicalWingspanM}m / {meta.typicalLengthM}m
          </span>
        </div>
        <div>
          <span className="block text-[var(--ink-3)] text-[10px] uppercase">Vertical Height</span>
          <span>{meta.typicalHeightM}m</span>
        </div>
        <div>
          <span className="block text-[var(--ink-3)] text-[10px] uppercase">Representative Types</span>
          <span className="truncate block" title={meta.exampleModels.join(', ')}>
            {meta.exampleModels.slice(0, 3).join(', ')}
          </span>
        </div>
      </div>
    </div>
  );
}
