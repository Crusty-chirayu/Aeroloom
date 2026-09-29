import type { AircraftDetails } from '@/lib/providers/positions/types';

/**
 * Open aircraft catalog mapping standard ICAO 4-character aircraft type designators.
 */
export const AIRCRAFT_CATALOG: Record<string, AircraftDetails> = {
  // --- BOEING NARROWBODY ---
  B737: { typeCode: 'B737', manufacturer: 'Boeing', model: '737-700', category: 'Jet', wakeClass: 'M' },
  B738: { typeCode: 'B738', manufacturer: 'Boeing', model: '737-800', category: 'Jet', wakeClass: 'M' },
  B739: { typeCode: 'B739', manufacturer: 'Boeing', model: '737-900ER', category: 'Jet', wakeClass: 'M' },
  B38M: { typeCode: 'B38M', manufacturer: 'Boeing', model: '737 MAX 8', category: 'Jet', wakeClass: 'M' },
  B39M: { typeCode: 'B39M', manufacturer: 'Boeing', model: '737 MAX 9', category: 'Jet', wakeClass: 'M' },
  B752: { typeCode: 'B752', manufacturer: 'Boeing', model: '757-200', category: 'Jet', wakeClass: 'M' },
  B753: { typeCode: 'B753', manufacturer: 'Boeing', model: '757-300', category: 'Jet', wakeClass: 'M' },

  // --- BOEING WIDEBODY ---
  B763: { typeCode: 'B763', manufacturer: 'Boeing', model: '767-300ER', category: 'Jet', wakeClass: 'H' },
  B764: { typeCode: 'B764', manufacturer: 'Boeing', model: '767-400ER', category: 'Jet', wakeClass: 'H' },
  B772: { typeCode: 'B772', manufacturer: 'Boeing', model: '777-200ER', category: 'Jet', wakeClass: 'H' },
  B77W: { typeCode: 'B77W', manufacturer: 'Boeing', model: '777-300ER', category: 'Jet', wakeClass: 'H' },
  B77L: { typeCode: 'B77L', manufacturer: 'Boeing', model: '777-200LR', category: 'Jet', wakeClass: 'H' },
  B788: { typeCode: 'B788', manufacturer: 'Boeing', model: '787-8 Dreamliner', category: 'Jet', wakeClass: 'H' },
  B789: { typeCode: 'B789', manufacturer: 'Boeing', model: '787-9 Dreamliner', category: 'Jet', wakeClass: 'H' },
  B78X: { typeCode: 'B78X', manufacturer: 'Boeing', model: '787-10 Dreamliner', category: 'Jet', wakeClass: 'H' },
  B744: { typeCode: 'B744', manufacturer: 'Boeing', model: '747-400', category: 'Jet', wakeClass: 'H' },
  B748: { typeCode: 'B748', manufacturer: 'Boeing', model: '747-8 Intercontinental', category: 'Jet', wakeClass: 'H' },

  // --- AIRBUS NARROWBODY ---
  A319: { typeCode: 'A319', manufacturer: 'Airbus', model: 'A319-100', category: 'Jet', wakeClass: 'M' },
  A320: { typeCode: 'A320', manufacturer: 'Airbus', model: 'A320-200', category: 'Jet', wakeClass: 'M' },
  A321: { typeCode: 'A321', manufacturer: 'Airbus', model: 'A321-200', category: 'Jet', wakeClass: 'M' },
  A20N: { typeCode: 'A20N', manufacturer: 'Airbus', model: 'A320neo', category: 'Jet', wakeClass: 'M' },
  A21N: { typeCode: 'A21N', manufacturer: 'Airbus', model: 'A321neo', category: 'Jet', wakeClass: 'M' },
  BCS1: { typeCode: 'BCS1', manufacturer: 'Airbus', model: 'A220-100', category: 'Jet', wakeClass: 'M' },
  BCS3: { typeCode: 'BCS3', manufacturer: 'Airbus', model: 'A220-300', category: 'Jet', wakeClass: 'M' },

  // --- AIRBUS WIDEBODY ---
  A332: { typeCode: 'A332', manufacturer: 'Airbus', model: 'A330-200', category: 'Jet', wakeClass: 'H' },
  A333: { typeCode: 'A333', manufacturer: 'Airbus', model: 'A330-300', category: 'Jet', wakeClass: 'H' },
  A339: { typeCode: 'A339', manufacturer: 'Airbus', model: 'A330-900neo', category: 'Jet', wakeClass: 'H' },
  A359: { typeCode: 'A359', manufacturer: 'Airbus', model: 'A350-900', category: 'Jet', wakeClass: 'H' },
  A35K: { typeCode: 'A35K', manufacturer: 'Airbus', model: 'A350-1000', category: 'Jet', wakeClass: 'H' },
  A388: { typeCode: 'A388', manufacturer: 'Airbus', model: 'A380-800', category: 'Jet', wakeClass: 'J' },

  // --- REGIONAL JETS ---
  CRJ2: { typeCode: 'CRJ2', manufacturer: 'Bombardier', model: 'CRJ-200', category: 'Jet', wakeClass: 'M' },
  CRJ7: { typeCode: 'CRJ7', manufacturer: 'Bombardier', model: 'CRJ-700', category: 'Jet', wakeClass: 'M' },
  CRJ9: { typeCode: 'CRJ9', manufacturer: 'Bombardier', model: 'CRJ-900', category: 'Jet', wakeClass: 'M' },
  E170: { typeCode: 'E170', manufacturer: 'Embraer', model: 'E170', category: 'Jet', wakeClass: 'M' },
  E175: { typeCode: 'E175', manufacturer: 'Embraer', model: 'E175', category: 'Jet', wakeClass: 'M' },
  E190: { typeCode: 'E190', manufacturer: 'Embraer', model: 'E190', category: 'Jet', wakeClass: 'M' },
  E195: { typeCode: 'E195', manufacturer: 'Embraer', model: 'E195', category: 'Jet', wakeClass: 'M' },

  // --- GENERAL AVIATION & TURBOPROPS ---
  C172: { typeCode: 'C172', manufacturer: 'Cessna', model: '172 Skyhawk', category: 'Piston', wakeClass: 'L' },
  C182: { typeCode: 'C182', manufacturer: 'Cessna', model: '182 Skylane', category: 'Piston', wakeClass: 'L' },
  PA28: { typeCode: 'PA28', manufacturer: 'Piper', model: 'PA-28 Cherokee', category: 'Piston', wakeClass: 'L' },
  PA30: { typeCode: 'PA30', manufacturer: 'Piper', model: 'PA-30 Twin Comanche', category: 'Piston', wakeClass: 'L' },
  C208: { typeCode: 'C208', manufacturer: 'Cessna', model: '208 Caravan', category: 'Turboprop', wakeClass: 'L' },
  PC12: { typeCode: 'PC12', manufacturer: 'Pilatus', model: 'PC-12', category: 'Turboprop', wakeClass: 'L' },
  BE20: { typeCode: 'BE20', manufacturer: 'Beechcraft', model: 'Super King Air 200', category: 'Turboprop', wakeClass: 'L' },
  DH8D: { typeCode: 'DH8D', manufacturer: 'De Havilland Canada', model: 'Dash 8-400', category: 'Turboprop', wakeClass: 'M' },
  AT72: { typeCode: 'AT72', manufacturer: 'ATR', model: '72-600', category: 'Turboprop', wakeClass: 'M' },

  // --- SPECIAL & MILITARY ---
  C17: { typeCode: 'C17', manufacturer: 'Boeing', model: 'C-17 Globemaster III', category: 'Military', wakeClass: 'H' },
  C130: { typeCode: 'C130', manufacturer: 'Lockheed Martin', model: 'C-130 Hercules', category: 'Military', wakeClass: 'M' },
  EC35: { typeCode: 'EC35', manufacturer: 'Eurocopter', model: 'EC135', category: 'Helicopter', wakeClass: 'L' },
  H60: { typeCode: 'H60', manufacturer: 'Sikorsky', model: 'UH-60 Black Hawk', category: 'Helicopter', wakeClass: 'M' },
};

/**
 * Resolves full manufacturer and model from ICAO type designator code.
 */
export function getAircraftDetails(typeCode?: string): AircraftDetails | undefined {
  if (!typeCode) return undefined;
  const clean = typeCode.trim().toUpperCase();
  return AIRCRAFT_CATALOG[clean];
}
