/**
 * Aeroloom Aircraft Silhouettes & Categories
 *
 * Hand-authored top-down SVG geometry on a 64×64 coordinate space (origin [0, 0] to [64, 64], center at [32, 32]).
 * Oriented True North (heading 000°).
 */

export type AircraftCategory =
  | 'narrowbody'
  | 'widebody_twin'
  | 'quad'
  | 'regional_jet'
  | 'turboprop'
  | 'bizjet'
  | 'light_ga'
  | 'helicopter'
  | 'cargo'
  | 'military'
  | 'unknown';

export type SilhouetteState =
  | 'default'
  | 'selected'
  | 'hover'
  | 'stale'
  | 'on_ground'
  | 'ground_shadow';

export interface AircraftCategoryMeta {
  category: AircraftCategory;
  name: string;
  description: string;
  typicalWingspanM: number;
  typicalLengthM: number;
  typicalHeightM: number;
  exampleModels: string[];
}

export const AIRCRAFT_CATEGORIES: Record<AircraftCategory, AircraftCategoryMeta> = {
  narrowbody: {
    category: 'narrowbody',
    name: 'Narrowbody Airliner',
    description: 'Single-aisle twin-engine mainline transport (e.g. A320, B737)',
    typicalWingspanM: 35.8,
    typicalLengthM: 37.6,
    typicalHeightM: 11.8,
    exampleModels: ['A320neo', 'B737-800', 'B737 MAX 8', 'A220-300'],
  },
  widebody_twin: {
    category: 'widebody_twin',
    name: 'Widebody Twin Airliner',
    description: 'Twin-aisle long-haul twin-engine airliner (e.g. B787, A350, B777)',
    typicalWingspanM: 60.1,
    typicalLengthM: 63.7,
    typicalHeightM: 17.0,
    exampleModels: ['B787-9', 'A350-900', 'B777-300ER', 'A330-900'],
  },
  quad: {
    category: 'quad',
    name: 'Quad-Engine Heavy',
    description: 'Four-engine super/heavy widebody transport (e.g. A380, B747)',
    typicalWingspanM: 79.8,
    typicalLengthM: 72.7,
    typicalHeightM: 24.1,
    exampleModels: ['A380-800', 'B747-400', 'B747-8', 'A340-600'],
  },
  regional_jet: {
    category: 'regional_jet',
    name: 'Regional Jet',
    description: 'Short-to-medium haul feeder airliner (e.g. E175, CRJ900)',
    typicalWingspanM: 28.7,
    typicalLengthM: 31.7,
    typicalHeightM: 9.8,
    exampleModels: ['Embraer E175', 'Bombardier CRJ900', 'E190-E2'],
  },
  turboprop: {
    category: 'turboprop',
    name: 'Turboprop Regional',
    description: 'High-wing twin turboprop airliner / utility (e.g. ATR 72, Dash 8)',
    typicalWingspanM: 27.1,
    typicalLengthM: 27.2,
    typicalHeightM: 7.7,
    exampleModels: ['ATR 72-600', 'De Havilland Dash 8 Q400', 'Beech 1900D'],
  },
  bizjet: {
    category: 'bizjet',
    name: 'Business Jet',
    description: 'High-speed executive transport with swept wings and aft engines',
    typicalWingspanM: 28.7,
    typicalLengthM: 30.3,
    typicalHeightM: 7.8,
    exampleModels: ['Bombardier Global 7500', 'Gulfstream G650', 'Citation X'],
  },
  light_ga: {
    category: 'light_ga',
    name: 'Light General Aviation',
    description: 'Single-engine piston trainer / utility aircraft (e.g. C172, PA-28)',
    typicalWingspanM: 11.0,
    typicalLengthM: 8.3,
    typicalHeightM: 2.7,
    exampleModels: ['Cessna 172 Skyhawk', 'Piper PA-28 Cherokee', 'Cirrus SR22'],
  },
  helicopter: {
    category: 'helicopter',
    name: 'Helicopter / Rotary',
    description: 'Civil or utility rotary-wing rotorcraft with main rotor disc',
    typicalWingspanM: 11.0, // Rotor diameter
    typicalLengthM: 13.0,
    typicalHeightM: 4.0,
    exampleModels: ['Airbus H145', 'Sikorsky S-76', 'Bell 407'],
  },
  cargo: {
    category: 'cargo',
    name: 'Dedicated Freighter',
    description: 'Heavy cargo freighter with reinforced fuselage and high volume',
    typicalWingspanM: 64.4,
    typicalLengthM: 76.3,
    typicalHeightM: 19.4,
    exampleModels: ['B747-8F', 'B777F', 'MD-11F', 'An-124'],
  },
  military: {
    category: 'military',
    name: 'Tactical / Military Fast Jet',
    description: 'High-performance combat or patrol aircraft with sharp swept delta geometry',
    typicalWingspanM: 14.7,
    typicalLengthM: 18.9,
    typicalHeightM: 5.1,
    exampleModels: ['F/A-18', 'Eurofighter Typhoon', 'F-35A', 'C-17 Globemaster'],
  },
  unknown: {
    category: 'unknown',
    name: 'Unspecified Aircraft',
    description: 'Unidentified or unclassified aircraft shape (clean geometric dart)',
    typicalWingspanM: 25.0,
    typicalLengthM: 25.0,
    typicalHeightM: 7.0,
    exampleModels: ['Unregistered / Unknown ICAO Code'],
  },
};
