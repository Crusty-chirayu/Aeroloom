/**
 * Aeroloom ICAO Aircraft Type Designator Mapping Engine
 *
 * Maps standard ICAO 4-character aircraft type designators to one of the 11 canonical
 * silhouette categories. Contains 175+ explicit mappings for common commercial, regional,
 * business, general aviation, cargo, and rotary aircraft, with fallback to the metadata
 * catalog and a safe geometric fallback.
 */

import type { AircraftCategory } from './silhouettes/types.ts';
import { AIRCRAFT_CATALOG } from '../metadata/aircraftCatalog.ts';

export const ICAO_TYPE_MAP: Record<string, AircraftCategory> = {
  // ─── NARROWBODY AIRLINERS (Twin underwing turbofans, single-aisle) ───────────
  A318: 'narrowbody',
  A319: 'narrowbody',
  A320: 'narrowbody',
  A321: 'narrowbody',
  A20N: 'narrowbody',
  A21N: 'narrowbody',
  A19N: 'narrowbody',
  B731: 'narrowbody',
  B732: 'narrowbody',
  B733: 'narrowbody',
  B734: 'narrowbody',
  B735: 'narrowbody',
  B736: 'narrowbody',
  B737: 'narrowbody',
  B738: 'narrowbody',
  B739: 'narrowbody',
  B37M: 'narrowbody',
  B38M: 'narrowbody',
  B39M: 'narrowbody',
  B3XM: 'narrowbody',
  B752: 'narrowbody',
  B753: 'narrowbody',
  BCS1: 'narrowbody', // Airbus A220-100
  BCS3: 'narrowbody', // Airbus A220-300
  C919: 'narrowbody', // Comac C919
  MD80: 'narrowbody',
  MD82: 'narrowbody',
  MD83: 'narrowbody',
  MD88: 'narrowbody',
  MD90: 'narrowbody',
  B712: 'narrowbody',
  TU54: 'narrowbody',

  // ─── WIDEBODY TWINS (High-bypass twins, twin-aisle long-haul) ───────────────
  B762: 'widebody_twin',
  B763: 'widebody_twin',
  B764: 'widebody_twin',
  B772: 'widebody_twin',
  B773: 'widebody_twin',
  B77W: 'widebody_twin',
  B77L: 'widebody_twin',
  B778: 'widebody_twin',
  B779: 'widebody_twin',
  B788: 'widebody_twin',
  B789: 'widebody_twin',
  B78X: 'widebody_twin',
  A306: 'widebody_twin',
  A310: 'widebody_twin',
  A332: 'widebody_twin',
  A333: 'widebody_twin',
  A338: 'widebody_twin',
  A339: 'widebody_twin',
  A359: 'widebody_twin',
  A35K: 'widebody_twin',
  IL96: 'widebody_twin',

  // ─── QUAD ENGINE HEAVIES (Four-engine ultra-heavies) ────────────────────────
  A342: 'quad',
  A343: 'quad',
  A345: 'quad',
  A346: 'quad',
  A388: 'quad', // Airbus A380-800
  B741: 'quad',
  B742: 'quad',
  B743: 'quad',
  B744: 'quad', // Boeing 747-400
  B748: 'quad', // Boeing 747-8
  IL76: 'quad',
  IL62: 'quad',
  A340: 'quad',

  // ─── REGIONAL JETS (Rear-mounted engines / small feeder jets) ────────────────
  CRJ1: 'regional_jet',
  CRJ2: 'regional_jet',
  CRJ7: 'regional_jet',
  CRJ9: 'regional_jet',
  CRJX: 'regional_jet',
  E135: 'regional_jet',
  E140: 'regional_jet',
  E145: 'regional_jet',
  E170: 'regional_jet',
  E175: 'regional_jet',
  E190: 'regional_jet',
  E195: 'regional_jet',
  E290: 'regional_jet',
  E295: 'regional_jet',
  SU95: 'regional_jet',
  ARJ2: 'regional_jet',
  F70: 'regional_jet',
  F100: 'regional_jet',
  BA11: 'regional_jet',

  // ─── TURBOPROPS (Twin prop regional / high-wing commuters) ──────────────────
  AT43: 'turboprop',
  AT45: 'turboprop',
  AT46: 'turboprop',
  AT72: 'turboprop',
  AT73: 'turboprop',
  AT75: 'turboprop',
  AT76: 'turboprop',
  DH8A: 'turboprop',
  DH8B: 'turboprop',
  DH8C: 'turboprop',
  DH8D: 'turboprop', // Dash 8 Q400
  B190: 'turboprop',
  B350: 'turboprop',
  JS31: 'turboprop',
  JS32: 'turboprop',
  JS41: 'turboprop',
  SF34: 'turboprop',
  SB20: 'turboprop',
  D328: 'turboprop',
  C208: 'turboprop', // Cessna 208 Caravan
  PC12: 'turboprop', // Pilatus PC-12
  TBM7: 'turboprop',
  TBM8: 'turboprop',
  TBM9: 'turboprop',
  BE20: 'turboprop',
  BE30: 'turboprop',
  BE9L: 'turboprop',
  PAY2: 'turboprop',
  AN24: 'turboprop',
  AN26: 'turboprop',

  // ─── BUSINESS JETS (Aft engines, needle nose, high sweep) ───────────────────
  C500: 'bizjet',
  C510: 'bizjet', // Mustang
  C525: 'bizjet', // CJ series
  C550: 'bizjet',
  C560: 'bizjet',
  C56X: 'bizjet', // Excel / XLS
  C680: 'bizjet', // Sovereign
  C750: 'bizjet', // Citation X
  C700: 'bizjet', // Longitude
  CL30: 'bizjet', // Challenger 300
  CL35: 'bizjet', // Challenger 350
  CL60: 'bizjet', // Challenger 600/604/605
  GL5T: 'bizjet', // Global 5000
  GLEX: 'bizjet', // Global Express
  GL75: 'bizjet', // Global 7500
  FA50: 'bizjet',
  FA7X: 'bizjet',
  FA8X: 'bizjet',
  F2TH: 'bizjet',
  F900: 'bizjet',
  GLF4: 'bizjet', // Gulfstream IV
  GLF5: 'bizjet', // Gulfstream V
  GLF6: 'bizjet', // Gulfstream G650
  G280: 'bizjet',
  E50P: 'bizjet', // Phenom 100
  E55P: 'bizjet', // Phenom 300
  E545: 'bizjet', // Praetor 500
  E550: 'bizjet', // Praetor 600
  H25B: 'bizjet', // Hawker 800
  LJ35: 'bizjet',
  LJ45: 'bizjet',
  LJ60: 'bizjet',
  LJ75: 'bizjet',
  PRM1: 'bizjet',
  PC24: 'bizjet', // Pilatus PC-24 Super Versatile Jet
  HA42: 'bizjet', // HondaJet

  // ─── LIGHT GENERAL AVIATION (Single piston / light twin trainer) ─────────────
  C150: 'light_ga',
  C152: 'light_ga',
  C172: 'light_ga', // Skyhawk
  C182: 'light_ga', // Skylane
  C206: 'light_ga',
  C210: 'light_ga',
  PA18: 'light_ga', // Super Cub
  PA24: 'light_ga',
  PA28: 'light_ga', // Cherokee
  PA32: 'light_ga', // Saratoga
  PA34: 'light_ga', // Seneca
  PA44: 'light_ga', // Seminole
  SR20: 'light_ga',
  SR22: 'light_ga', // Cirrus SR22
  SF50: 'bizjet',   // Cirrus Vision Jet
  DA20: 'light_ga',
  DA40: 'light_ga', // Diamond Star
  DA42: 'light_ga', // Twin Star
  DA62: 'light_ga',
  BE33: 'light_ga',
  BE35: 'light_ga',
  BE36: 'light_ga', // Bonanza
  BE58: 'light_ga', // Baron
  M20P: 'light_ga', // Mooney
  M20T: 'light_ga',
  RV6: 'light_ga',
  RV7: 'light_ga',
  RV8: 'light_ga',
  RV10: 'light_ga',
  AA5: 'light_ga',
  P28A: 'light_ga',

  // ─── HELICOPTERS / ROTARY-WING ──────────────────────────────────────────────
  H125: 'helicopter',
  H130: 'helicopter',
  H135: 'helicopter',
  H145: 'helicopter',
  H155: 'helicopter',
  H160: 'helicopter',
  H175: 'helicopter',
  H225: 'helicopter',
  AS50: 'helicopter',
  AS55: 'helicopter',
  EC20: 'helicopter',
  EC30: 'helicopter',
  EC35: 'helicopter',
  EC45: 'helicopter',
  EC55: 'helicopter',
  B06: 'helicopter',
  B206: 'helicopter',
  B407: 'helicopter',
  B412: 'helicopter',
  B429: 'helicopter',
  B505: 'helicopter',
  S76: 'helicopter',
  S92: 'helicopter',
  UH60: 'helicopter',
  AW109: 'helicopter',
  AW119: 'helicopter',
  AW139: 'helicopter',
  AW169: 'helicopter',
  AW189: 'helicopter',
  R22: 'helicopter',
  R44: 'helicopter',
  R66: 'helicopter',
  MD50: 'helicopter',
  MD52: 'helicopter',
  MD60: 'helicopter',
  CH47: 'helicopter',

  // ─── DEDICATED CARGO FREIGHTERS ─────────────────────────────────────────────
  B74F: 'cargo',
  B744F: 'cargo',
  B748F: 'cargo',
  B77F: 'cargo',
  A33F: 'cargo',
  MD11F: 'cargo',
  MD11: 'cargo',
  A30F: 'cargo',
  A124: 'cargo', // Antonov An-124
  A225: 'cargo', // Antonov An-225
  C130: 'cargo', // Lockheed C-130 Hercules
  AN12: 'cargo',
  C17: 'cargo',  // Boeing C-17 Globemaster III
  A400: 'cargo', // Airbus A400M

  // ─── MILITARY / TACTICAL FAST JETS ──────────────────────────────────────────
  F15: 'military',
  F16: 'military',
  F18: 'military',
  F18H: 'military',
  F22: 'military',
  F35: 'military',
  F35A: 'military',
  F35B: 'military',
  EUFI: 'military', // Eurofighter Typhoon
  RFLE: 'military', // Dassault Rafale
  TOR: 'military',  // Panavia Tornado
  SU27: 'military',
  SU30: 'military',
  SU35: 'military',
  SU57: 'military',
  MG29: 'military',
  MG31: 'military',
  B1: 'military',
  B2: 'military',
  B52: 'military',
  T38: 'military',
  HAWK: 'military',
};

/**
 * Resolves an ICAO type designator to an AircraftCategory.
 *
 * Strategy:
 * 1. Direct lookup in ICAO_TYPE_MAP.
 * 2. Lookup in AIRCRAFT_CATALOG (if matched, infer from category / wake / model).
 * 3. Heuristic matching on prefix (e.g. 'B73', 'A32', 'C17', etc.).
 * 4. Safe fallback to 'unknown'.
 */
export function getAircraftCategory(typeCode?: string | null): AircraftCategory {
  if (!typeCode) return 'unknown';

  const normalized = typeCode.trim().toUpperCase();

  // 1. Direct match
  if (ICAO_TYPE_MAP[normalized]) {
    return ICAO_TYPE_MAP[normalized];
  }

  // 2. Check metadata catalog
  const catalogEntry = AIRCRAFT_CATALOG[normalized];
  if (catalogEntry) {
    if (catalogEntry.category === 'Piston') return 'light_ga';
    if (catalogEntry.category === 'Turboprop') return 'turboprop';
    if (catalogEntry.wakeClass === 'J') return 'quad';
    if (catalogEntry.wakeClass === 'H') return 'widebody_twin';
    if (catalogEntry.category === 'Jet') return 'narrowbody';
  }

  // 3. Prefix heuristics
  if (normalized.startsWith('A38') || normalized.startsWith('B74')) return 'quad';
  if (normalized.startsWith('A35') || normalized.startsWith('B78') || normalized.startsWith('B77') || normalized.startsWith('A33')) return 'widebody_twin';
  if (normalized.startsWith('A32') || normalized.startsWith('A31') || normalized.startsWith('A20') || normalized.startsWith('B73') || normalized.startsWith('B38')) return 'narrowbody';
  if (normalized.startsWith('CRJ') || normalized.startsWith('E17') || normalized.startsWith('E19') || normalized.startsWith('ERJ')) return 'regional_jet';
  if (normalized.startsWith('AT7') || normalized.startsWith('AT4') || normalized.startsWith('DH8') || normalized.startsWith('DHC')) return 'turboprop';
  if (normalized.startsWith('GLF') || normalized.startsWith('GLEX') || normalized.startsWith('CIT') || normalized.startsWith('CL6')) return 'bizjet';
  if (normalized.startsWith('C17') || normalized.startsWith('PA2') || normalized.startsWith('SR2') || normalized.startsWith('DA4')) return 'light_ga';
  if (normalized.startsWith('EC') || normalized.startsWith('AS3') || normalized.startsWith('H1') || normalized.startsWith('UH') || normalized.startsWith('S7')) return 'helicopter';
  if (normalized.startsWith('F1') || normalized.startsWith('F2') || normalized.startsWith('F3') || normalized.startsWith('MIG') || normalized.startsWith('SU')) return 'military';

  return 'unknown';
}
