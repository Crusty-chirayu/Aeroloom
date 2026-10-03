/**
 * Aeroloom Top-Down Hand-Authored Vector Silhouettes
 *
 * All geometries authored on a 64×64 viewBox (center: 32, 32, nose: North / 000°).
 * Proportions and aerodynamic features reference authentic manufacturer engineering drawings.
 */

import type { AircraftCategory } from './types';

export interface SilhouetteDefinition {
  category: AircraftCategory;
  /** Primary body path (fuselage, wings, tail) */
  bodyPath: string;
  /** Secondary details (engines, props, rotor discs, canopy, panel lines) */
  detailPaths?: {
    d: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    opacity?: number;
  }[];
  viewBox: string;
}

export const SILHOUETTES: Record<AircraftCategory, SilhouetteDefinition> = {
  // ─── 1. NARROWBODY (A320 / B737) ───────────────────────────────────────────
  // Characteristic: 1:1 length/span ratio, moderate 25° sweep, underwing twin engines
  narrowbody: {
    category: 'narrowbody',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,7',
      // Nose cone & forward fuselage
      'C 33.2,7 34.5,10 34.5,16',
      'L 34.5,23',
      // Right wing root & leading edge (swept 25°)
      'L 41,27.5 L 57.5,33.5',
      // Wingtip sharklet / raked tip
      'L 58,35 L 56.5,35.5',
      // Right wing trailing edge with flap tracks
      'L 41,33 L 34.5,34.5',
      // Aft fuselage
      'L 34.5,47',
      // Right horizontal stabilizer
      'L 45,51.5 L 45,53 L 33.5,53',
      // Tail cone tip
      'L 32,56.5',
      // Left horizontal stabilizer
      'L 30.5,53 L 19,53 L 19,51.5',
      // Left aft fuselage
      'L 29.5,47 L 29.5,34.5',
      // Left wing trailing edge
      'L 23,33 L 7.5,35.5 L 6,35 L 6.5,33.5',
      // Left wing leading edge
      'L 23,27.5 L 29.5,23',
      // Left forward fuselage & nose
      'L 29.5,16',
      'C 29.5,10 30.8,7 32,7',
      'Z',
    ].join(' '),
    detailPaths: [
      // Right engine nacelle (underwing)
      {
        d: 'M 40,25 C 41.2,25 42,26 42,27.5 L 42,32 C 42,33 41.2,33.5 40,33.5 C 38.8,33.5 38,33 38,32 L 38,27.5 C 38,26 38.8,25 40,25 Z',
      },
      // Left engine nacelle (underwing)
      {
        d: 'M 24,25 C 25.2,25 26,26 26,27.5 L 26,32 C 26,33 25.2,33.5 24,33.5 C 22.8,33.5 22,33 22,32 L 22,27.5 C 22,26 22.8,25 24,25 Z',
      },
    ],
  },

  // ─── 2. WIDEBODY TWIN (B787 / A350 / B777) ─────────────────────────────────
  // Characteristic: Wide fuselage, high-aspect 32° swept wings, large high-bypass twin turbofans
  widebody_twin: {
    category: 'widebody_twin',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,5',
      // Nose cone & wide fuselage
      'C 33.8,5 35.5,8.5 35.5,15',
      'L 35.5,23',
      // Right wing root strake & 32° swept wing
      'L 43,28 L 60,34',
      // Raked wingtip
      'L 60.5,35.5 L 58.5,36',
      // Trailing edge
      'L 43.5,33.5 L 35.5,35.5',
      // Fuselage aft
      'L 35.5,48',
      // Swept right horizontal stabilizer
      'L 47.5,53.5 L 47,55 L 34,54',
      // Aft APU cone
      'L 32,58.5',
      // Swept left horizontal stabilizer
      'L 30,54 L 17,55 L 16.5,53.5',
      // Fuselage aft
      'L 28.5,48 L 28.5,35.5',
      // Left wing trailing edge
      'L 20.5,33.5 L 5.5,36 L 3.5,35.5 L 4,34',
      // Left wing leading edge
      'L 21,28 L 28.5,23',
      // Forward fuselage
      'L 28.5,15',
      'C 28.5,8.5 30.2,5 32,5',
      'Z',
    ].join(' '),
    detailPaths: [
      // Large GE90 / Trent XWB right engine nacelle
      {
        d: 'M 42,24 C 43.8,24 45,25.2 45,27.2 L 45,33.5 C 45,34.8 43.8,35.5 42,35.5 C 40.2,35.5 39,34.8 39,33.5 L 39,27.2 C 39,25.2 40.2,24 42,24 Z',
      },
      // Left engine nacelle
      {
        d: 'M 22,24 C 23.8,24 25,25.2 25,27.2 L 25,33.5 C 25,34.8 23.8,35.5 22,35.5 C 20.2,35.5 19,34.8 19,33.5 L 19,27.2 C 19,25.2 20.2,24 22,24 Z',
      },
    ],
  },

  // ─── 3. QUAD ENGINE HEAVY (A380 / B747) ────────────────────────────────────
  // Characteristic: Massive wingspan, 4 distinct underwing engine nacelles (2 per wing)
  quad: {
    category: 'quad',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,4',
      // Heavy wide fuselage
      'C 34.5,4 36.5,7.5 36.5,15',
      'L 36.5,23',
      // Right wing root & high-sweep wing
      'L 46,29 L 61.5,36',
      // Wingtip fence
      'L 62,37.5 L 60,38',
      // Trailing edge
      'L 46,35 L 36.5,37',
      // Rear fuselage
      'L 36.5,49',
      // Large tailplane
      'L 49,54.5 L 48.5,56.5 L 35,55',
      // Tail stinger
      'L 32,59',
      // Left tailplane
      'L 29,55 L 15.5,56.5 L 15,54.5',
      // Fuselage
      'L 27.5,49 L 27.5,37',
      // Left wing trailing edge
      'L 18,35 L 4,38 L 2,37.5 L 2.5,36',
      // Left wing leading edge
      'L 18,29 L 27.5,23',
      // Nose
      'L 27.5,15',
      'C 27.5,7.5 29.5,4 32,4',
      'Z',
    ].join(' '),
    detailPaths: [
      // Right inboard engine
      {
        d: 'M 43,26 C 44.5,26 45.5,27 45.5,28.5 L 45.5,33.5 C 45.5,34.5 44.5,35 43,35 C 41.5,35 40.5,34.5 40.5,33.5 L 40.5,28.5 C 40.5,27 41.5,26 43,26 Z',
      },
      // Right outboard engine
      {
        d: 'M 51,31 C 52.5,31 53.5,32 53.5,33.5 L 53.5,38 C 53.5,39 52.5,39.5 51,39.5 C 49.5,39.5 48.5,39 48.5,38 L 48.5,33.5 C 48.5,32 49.5,31 51,31 Z',
      },
      // Left inboard engine
      {
        d: 'M 21,26 C 22.5,26 23.5,27 23.5,28.5 L 23.5,33.5 C 23.5,34.5 22.5,35 21,35 C 19.5,35 18.5,34.5 18.5,33.5 L 18.5,28.5 C 18.5,27 19.5,26 21,26 Z',
      },
      // Left outboard engine
      {
        d: 'M 13,31 C 14.5,31 15.5,32 15.5,33.5 L 15.5,38 C 15.5,39 14.5,39.5 13,39.5 C 11.5,39.5 10.5,39 10.5,38 L 10.5,33.5 C 10.5,32 11.5,31 13,31 Z',
      },
    ],
  },

  // ─── 4. REGIONAL JET (E175 / CRJ900) ───────────────────────────────────────
  // Characteristic: Long slender fuselage, rear fuselage-mounted twin engines, T-tail
  regional_jet: {
    category: 'regional_jet',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,8',
      // Slender forward fuselage
      'C 33,8 34,11 34,18',
      'L 34,26',
      // Wing root & moderately swept wing
      'L 40,29.5 L 54,34',
      // Winglet
      'L 54.5,35.5 L 53,36',
      // Trailing edge
      'L 39,33.5 L 34,35',
      // Aft fuselage
      'L 34,44',
      // Rear engine mounts
      'L 37,44.5 L 37,50 L 33.5,50.5',
      // T-Tail base & elevator
      'L 42,54 L 41.5,55.5 L 33,55',
      // Fin stinger
      'L 32,57.5',
      // Left T-Tail elevator
      'L 31,55 L 22.5,55.5 L 22,54',
      // Left engine mount
      'L 30.5,50.5 L 27,50 L 27,44.5 L 30,44',
      // Aft fuselage
      'L 30,35 L 25,33.5',
      // Left wing trailing edge
      'L 11,36 L 9.5,35.5 L 10,34',
      // Left wing leading edge
      'L 24,29.5 L 30,26',
      // Forward fuselage
      'L 30,18',
      'C 30,11 31,8 32,8',
      'Z',
    ].join(' '),
    detailPaths: [
      // Rear right fuselage nacelle
      {
        d: 'M 35.5,43 C 36.8,43 37.5,43.8 37.5,45 L 37.5,50 C 37.5,51 36.8,51.5 35.5,51.5 C 34.2,51.5 33.5,51 33.5,50 L 33.5,45 C 33.5,43.8 34.2,43 35.5,43 Z',
      },
      // Rear left fuselage nacelle
      {
        d: 'M 28.5,43 C 29.8,43 30.5,43.8 30.5,45 L 30.5,50 C 30.5,51 29.8,51.5 28.5,51.5 C 27.2,51.5 26.5,51 26.5,50 L 26.5,45 C 26.5,43.8 27.2,43 28.5,43 Z',
      },
    ],
  },

  // ─── 5. TURBOPROP (ATR 72 / Dash 8 Q400) ───────────────────────────────────
  // Characteristic: High straight wings, twin wing-mounted turboprop engine nacelles with propeller discs
  turboprop: {
    category: 'turboprop',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,7',
      // Nose cone & slender fuselage
      'C 33.2,7 34.2,10 34.2,17',
      'L 34.2,25.5',
      // High wing leading edge (straight/minimal sweep)
      'L 57,26.5',
      // Square wingtip
      'L 57.5,29 L 56.5,29.5',
      // Wing trailing edge
      'L 34.2,29.5',
      // Fuselage aft
      'L 34.2,47',
      // T-Tail elevator
      'L 44.5,51 L 44,52.5 L 33.5,52.5',
      // Tail stinger
      'L 32,56',
      // Left T-Tail elevator
      'L 30.5,52.5 L 20,52.5 L 19.5,51',
      // Left aft fuselage
      'L 29.8,47 L 29.8,29.5',
      // Left wing trailing edge
      'L 7.5,29.5 L 6.5,29 L 7,26.5',
      // Left wing leading edge
      'L 29.8,25.5',
      // Forward fuselage
      'L 29.8,17',
      'C 29.8,10 30.8,7 32,7',
      'Z',
    ].join(' '),
    detailPaths: [
      // Right turboprop nacelle & prop disc
      {
        d: 'M 42,22 C 43.2,22 44,23 44,24.5 L 44,32 C 44,33 43.2,33.5 42,33.5 C 40.8,33.5 40,33 40,32 L 40,24.5 C 40,23 40.8,22 42,22 Z',
      },
      // Right propeller blades & spinner hub
      {
        d: 'M 36,23.5 L 48,23.5',
        stroke: '#0E1116',
        strokeWidth: 1.5,
      },
      {
        d: 'M 42,20.5 L 42,26.5',
        stroke: '#0E1116',
        strokeWidth: 1.25,
      },
      // Left turboprop nacelle & prop disc
      {
        d: 'M 22,22 C 23.2,22 24,23 24,24.5 L 24,32 C 24,33 23.2,33.5 22,33.5 C 20.8,33.5 20,33 20,32 L 20,24.5 C 20,23 20.8,22 22,22 Z',
      },
      // Left propeller blades & spinner hub
      {
        d: 'M 16,23.5 L 28,23.5',
        stroke: '#0E1116',
        strokeWidth: 1.5,
      },
      {
        d: 'M 22,20.5 L 22,26.5',
        stroke: '#0E1116',
        strokeWidth: 1.25,
      },
    ],
  },

  // ─── 6. BUSINESS JET (Global 7500 / Citation X) ────────────────────────────
  // Characteristic: Needle nose, high sweep angle, rear engines, swept T-tail
  bizjet: {
    category: 'bizjet',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,6',
      // Sharp needle nose
      'C 32.8,6 33.6,9 33.6,17',
      'L 33.6,26',
      // 35° swept high-speed wing
      'L 41,31 L 56,38',
      // Sleek canted winglet
      'L 56.5,39.5 L 55,40',
      // Wing trailing edge
      'L 39,34.5 L 33.6,35.5',
      // Aft fuselage
      'L 33.6,43',
      // Rear engine nacelle fairing
      'L 37,44 L 37,49.5 L 33.2,50',
      // High swept T-tail
      'L 43,53.5 L 42.5,55 L 33,54.5',
      // Tail stinger
      'L 32,58',
      // Left swept T-tail
      'L 31,54.5 L 21.5,55 L 21,53.5',
      // Left engine fairing
      'L 30.8,50 L 27,49.5 L 27,44 L 30.4,43',
      // Fuselage & wing
      'L 30.4,35.5 L 25,34.5',
      // Left wing trailing edge
      'L 9,40 L 7.5,39.5 L 8,38',
      // Left wing leading edge
      'L 23,31 L 30.4,26',
      // Forward fuselage
      'L 30.4,17',
      'C 30.4,9 31.2,6 32,6',
      'Z',
    ].join(' '),
    detailPaths: [
      // Aft right nacelle
      {
        d: 'M 35.5,43 C 36.8,43 37.5,44 37.5,45.5 L 37.5,50 C 37.5,51 36.8,51.5 35.5,51.5 C 34.2,51.5 33.5,51 33.5,50 L 33.5,45.5 C 33.5,44 34.2,43 35.5,43 Z',
      },
      // Aft left nacelle
      {
        d: 'M 28.5,43 C 29.8,43 30.5,44 30.5,45.5 L 30.5,50 C 30.5,51 29.8,51.5 28.5,51.5 C 27.2,51.5 26.5,51 26.5,50 L 26.5,45.5 C 26.5,44 27.2,43 28.5,43 Z',
      },
    ],
  },

  // ─── 7. LIGHT GENERAL AVIATION (Cessna 172 Skyhawk) ────────────────────────
  // Characteristic: Compact, straight high wing, single nose propeller, wide horizontal stabilizer
  light_ga: {
    category: 'light_ga',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,15',
      // Cowling & cabin
      'C 33,15 34,17 34,22',
      'L 34,25',
      // Right straight wing leading edge
      'L 55,25',
      // Wingtip
      'L 55.5,26.5 L 55,29.5 L 54,29.5',
      // Wing trailing edge
      'L 33.5,29.5',
      // Fuselage taper to empennage
      'L 33,42',
      // Right horizontal stabilizer
      'L 41,44 L 40.5,46 L 32.8,46',
      // Rudder trailing edge
      'L 32,49',
      // Left horizontal stabilizer
      'L 31.2,46 L 23.5,46 L 23,44',
      // Left fuselage
      'L 31,42 L 30.5,29.5',
      // Left wing trailing edge
      'L 10,29.5 L 9,29.5 L 8.5,26.5 L 9,25',
      // Left wing leading edge
      'L 30,25 L 30,22',
      // Nose cone
      'C 30,17 31,15 32,15',
      'Z',
    ].join(' '),
    detailPaths: [
      // Nose propeller spinner bar
      {
        d: 'M 28,14.5 L 36,14.5',
        stroke: '#0E1116',
        strokeWidth: 2,
      },
    ],
  },

  // ─── 8. HELICOPTER (Airbus H145 / Sikorsky S-76) ───────────────────────────
  // Characteristic: Cabin pod, slender tail boom, distinct rotor disc + 4-blade rotor cross
  helicopter: {
    category: 'helicopter',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,18',
      // Teardrop cabin pod
      'C 34.5,18 36,20.5 36,25',
      'L 36,32',
      'C 36,35 34.5,37 33.5,38',
      // Slender tail boom
      'L 33.2,50',
      // Tail vertical fin & horizontal stabilizer
      'L 36,51.5 L 35.5,53 L 32.8,53',
      // Tail rotor blade
      'L 32,56 L 31.2,53',
      'L 28,53 L 27.5,51.5 L 30.8,50',
      // Tail boom left
      'L 30.5,38',
      // Cabin pod left
      'C 29.5,37 28,35 28,32',
      'L 28,25',
      'C 28,20.5 29.5,18 32,18',
      'Z',
    ].join(' '),
    detailPaths: [
      // Main rotor disc (faint guideline)
      {
        d: 'M 32,7 A 23,23 0 1,0 32,53 A 23,23 0 1,0 32,7 Z',
        stroke: '#0E1116',
        strokeWidth: 1,
        strokeDasharray: '3,3',
        opacity: 0.35,
      },
      // 4-blade rotor blades
      {
        d: 'M 32,9 L 32,47 M 13,28 L 51,28',
        stroke: '#0E1116',
        strokeWidth: 1.5,
      },
      // Rotor mast hub
      {
        d: 'M 32,26.5 A 1.5,1.5 0 1,0 32,29.5 A 1.5,1.5 0 1,0 32,26.5 Z',
      },
      // Left & right landing skids
      {
        d: 'M 26,22 L 26,34 M 38,22 L 38,34',
        stroke: '#0E1116',
        strokeWidth: 1.25,
      },
    ],
  },

  // ─── 9. CARGO / FREIGHTER (747F / 777F / Heavy Transport) ─────────────────
  // Characteristic: Bulkier fuselage forward hump, heavy wingspan, robust cargo footprint
  cargo: {
    category: 'cargo',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,4',
      // Widened upper deck hump
      'C 34.5,4 37,7 37,13',
      'L 37,23',
      // Heavy swept wing leading edge
      'L 46,28.5 L 61,35',
      // Wingtip
      'L 61.5,36.5 L 59.5,37',
      // Wing trailing edge with flap track fairings
      'L 46,34 L 37,36',
      // Fuselage aft
      'L 37,48',
      // Heavy horizontal stabilizer
      'L 48,53.5 L 47.5,55.5 L 35,54.5',
      // Tail cone
      'L 32,58.5',
      // Left horizontal stabilizer
      'L 29,54.5 L 16.5,55.5 L 16,53.5',
      // Left aft fuselage
      'L 27,48 L 27,36',
      // Left wing trailing edge
      'L 18,34 L 4.5,37 L 2.5,36.5 L 3,35',
      // Left wing leading edge
      'L 18,28.5 L 27,23',
      // Forward cargo fuselage
      'L 27,13',
      'C 27,7 29.5,4 32,4',
      'Z',
    ].join(' '),
    detailPaths: [
      // Right heavy twin engine nacelles
      {
        d: 'M 43,25 C 44.5,25 45.5,26 45.5,27.5 L 45.5,33.5 C 45.5,34.5 44.5,35 43,35 C 41.5,35 40.5,34.5 40.5,33.5 L 40.5,27.5 C 40.5,26 41.5,25 43,25 Z',
      },
      {
        d: 'M 51,29.5 C 52.5,29.5 53.5,30.5 53.5,32 L 53.5,37.5 C 53.5,38.5 52.5,39 51,39 C 49.5,39 48.5,38.5 48.5,37.5 L 48.5,32 C 48.5,30.5 49.5,29.5 51,29.5 Z',
      },
      // Left heavy twin engine nacelles
      {
        d: 'M 21,25 C 22.5,25 23.5,26 23.5,27.5 L 23.5,33.5 C 23.5,34.5 22.5,35 21,35 C 19.5,35 18.5,34.5 18.5,33.5 L 18.5,27.5 C 18.5,26 19.5,25 21,25 Z',
      },
      {
        d: 'M 13,29.5 C 14.5,29.5 15.5,30.5 15.5,32 L 15.5,37.5 C 15.5,38.5 14.5,39 13,39 C 11.5,39 10.5,38.5 10.5,37.5 L 10.5,32 C 10.5,30.5 11.5,29.5 13,29.5 Z',
      },
      // Cargo main-deck loading ramp seam
      {
        d: 'M 30,52 L 34,52',
        stroke: '#FFFFFF',
        strokeWidth: 1.25,
      },
    ],
  },

  // ─── 10. MILITARY / FAST JET (Fighter / Interceptor) ───────────────────────
  // Characteristic: Sharp delta/trapezoid wing, twin canted tails, slender pointed radome
  military: {
    category: 'military',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,7',
      // Pointed nose radome
      'L 33.5,14 L 34,22',
      // LERX strake & 50° delta wing leading edge
      'L 51,36.5',
      // Missile rail / wingtip
      'L 51.5,38.5 L 49.5,39',
      // Trailing edge
      'L 36.5,37',
      // Twin canted vertical stabilizer right
      'L 37.5,50 L 35,52.5',
      // Twin afterburner nozzle right
      'L 34,54.5 L 32.5,54.5',
      // Center tail spine
      'L 32,53.5',
      // Twin afterburner nozzle left
      'L 31.5,54.5 L 30,54.5',
      // Twin canted vertical stabilizer left
      'L 29,52.5 L 26.5,50',
      // Trailing edge left
      'L 27.5,37 L 14.5,39 L 12.5,38.5 L 13,36.5',
      // LERX & nose left
      'L 30,22 L 30.5,14',
      'Z',
    ].join(' '),
    detailPaths: [
      // Canopy glass outline
      {
        d: 'M 32,15 C 32.8,15 33.4,17 33.4,21 L 33.4,26 C 33.4,28 32.8,29 32,29 C 31.2,29 30.6,28 30.6,26 L 30.6,21 C 30.6,17 31.2,15 32,15 Z',
        stroke: '#0E1116',
        strokeWidth: 1,
      },
    ],
  },

  // ─── 11. UNKNOWN (Modern Clean Aeronautical Chevron) ──────────────────────
  // Characteristic: Clean, bold, unmistakable geometric aeronautical arrow
  unknown: {
    category: 'unknown',
    viewBox: '0 0 64 64',
    bodyPath: [
      'M 32,8',
      // Right swept leading edge
      'L 54,48',
      // Right trailing notch
      'L 48,48',
      'L 32,38',
      // Left trailing notch
      'L 16,48',
      // Left wingtip
      'L 10,48',
      'Z',
    ].join(' '),
  },
};
