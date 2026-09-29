import type { AirlineInfo } from '@/lib/providers/positions/types';

/**
 * Open airline catalog mapping ICAO 3-letter prefixes and IATA codes.
 */
export const AIRLINE_CATALOG: AirlineInfo[] = [
  { icao: 'DAL', iata: 'DL', name: 'Delta Air Lines', callsignTelephony: 'DELTA', country: 'United States' },
  { icao: 'UAL', iata: 'UA', name: 'United Airlines', callsignTelephony: 'UNITED', country: 'United States' },
  { icao: 'AAL', iata: 'AA', name: 'American Airlines', callsignTelephony: 'AMERICAN', country: 'United States' },
  { icao: 'SWA', iata: 'WN', name: 'Southwest Airlines', callsignTelephony: 'SOUTHWEST', country: 'United States' },
  { icao: 'JBU', iata: 'B6', name: 'JetBlue Airways', callsignTelephony: 'JETBLUE', country: 'United States' },
  { icao: 'ASA', iata: 'AS', name: 'Alaska Airlines', callsignTelephony: 'ALASKA', country: 'United States' },
  { icao: 'FFT', iata: 'F9', name: 'Frontier Airlines', callsignTelephony: 'FRONTIER FLIGHT', country: 'United States' },
  { icao: 'NKS', iata: 'NK', name: 'Spirit Airlines', callsignTelephony: 'SPIRIT WINGS', country: 'United States' },
  { icao: 'FDX', iata: 'FX', name: 'FedEx Express', callsignTelephony: 'FEDEX', country: 'United States' },
  { icao: 'UPS', iata: '5X', name: 'UPS Airlines', callsignTelephony: 'UPS', country: 'United States' },
  { icao: 'JIA', iata: 'OH', name: 'PSA Airlines (American Eagle)', callsignTelephony: 'BLUE STREAK', country: 'United States' },
  { icao: 'RPA', iata: 'YX', name: 'Republic Airways', callsignTelephony: 'BRICKYARD', country: 'United States' },
  { icao: 'SKW', iata: 'OO', name: 'SkyWest Airlines', callsignTelephony: 'SKYWEST', country: 'United States' },
  { icao: 'EDV', iata: '9E', name: 'Endeavor Air (Delta Connection)', callsignTelephony: 'ENDEAVOR', country: 'United States' },
  { icao: 'MTN', iata: 'N8', name: 'Mountain Air Cargo', callsignTelephony: 'MOUNTAIN', country: 'United States' },
  { icao: 'BAW', iata: 'BA', name: 'British Airways', callsignTelephony: 'SPEEDBIRD', country: 'United Kingdom' },
  { icao: 'AFR', iata: 'AF', name: 'Air France', callsignTelephony: 'AIRFRANS', country: 'France' },
  { icao: 'DLH', iata: 'LH', name: 'Lufthansa', callsignTelephony: 'LUFTHANSA', country: 'Germany' },
  { icao: 'KLM', iata: 'KL', name: 'KLM Royal Dutch Airlines', callsignTelephony: 'KLM', country: 'Netherlands' },
  { icao: 'IBE', iata: 'IB', name: 'Iberia', callsignTelephony: 'IBERIA', country: 'Spain' },
  { icao: 'SWR', iata: 'LX', name: 'Swiss International Air Lines', callsignTelephony: 'EUROSWISS', country: 'Switzerland' },
  { icao: 'AZA', iata: 'AZ', name: 'ITA Airways', callsignTelephony: 'ITAWAY', country: 'Italy' },
  { icao: 'THY', iata: 'TK', name: 'Turkish Airlines', callsignTelephony: 'TURKISH', country: 'Turkey' },
  { icao: 'UAE', iata: 'EK', name: 'Emirates', callsignTelephony: 'EMIRATES', country: 'United Arab Emirates' },
  { icao: 'QTR', iata: 'QR', name: 'Qatar Airways', callsignTelephony: 'QATARI', country: 'Qatar' },
  { icao: 'ETD', iata: 'EY', name: 'Etihad Airways', callsignTelephony: 'ETIHAD', country: 'United Arab Emirates' },
  { icao: 'SIA', iata: 'SQ', name: 'Singapore Airlines', callsignTelephony: 'SINGAPORE', country: 'Singapore' },
  { icao: 'CPA', iata: 'CX', name: 'Cathay Pacific', callsignTelephony: 'CATHAY', country: 'Hong Kong' },
  { icao: 'ANA', iata: 'NH', name: 'All Nippon Airways', callsignTelephony: 'ALL NIPPON', country: 'Japan' },
  { icao: 'JAL', iata: 'JL', name: 'Japan Airlines', callsignTelephony: 'JAPAN AIR', country: 'Japan' },
  { icao: 'QFA', iata: 'QF', name: 'Qantas', callsignTelephony: 'QANTAS', country: 'Australia' },
  { icao: 'ACA', iata: 'AC', name: 'Air Canada', callsignTelephony: 'AIR CANADA', country: 'Canada' },
  { icao: 'AMX', iata: 'AM', name: 'Aeroméxico', callsignTelephony: 'AEROMEXICO', country: 'Mexico' },
  { icao: 'VOI', iata: 'Y4', name: 'Volaris', callsignTelephony: 'VOLARIS', country: 'Mexico' },
];

const AIRLINE_MAP = new Map<string, AirlineInfo>();
for (const al of AIRLINE_CATALOG) {
  AIRLINE_MAP.set(al.icao.toUpperCase(), al);
}

/**
 * Resolves airline metadata from flight callsign (first 3 alphabetic characters).
 * Example: 'DAL397' -> Delta Air Lines; 'BAW112' -> British Airways.
 */
export function getAirlineByCallsign(callsign?: string): AirlineInfo | undefined {
  if (!callsign) return undefined;
  const clean = callsign.trim().toUpperCase();
  if (clean.length < 3) return undefined;

  // Extract leading 3 alphabetic characters
  const match = clean.match(/^([A-Z]{3})/);
  if (!match) return undefined;

  return AIRLINE_MAP.get(match[1]);
}

/**
 * Search airlines by name, ICAO, or telephony callsign.
 */
export function searchAirlines(query: string, limit: number = 6): AirlineInfo[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const results: AirlineInfo[] = [];
  for (const al of AIRLINE_CATALOG) {
    if (
      al.icao.includes(q) ||
      (al.iata && al.iata.includes(q)) ||
      al.name.toUpperCase().includes(q) ||
      (al.callsignTelephony && al.callsignTelephony.includes(q))
    ) {
      results.push(al);
      if (results.length >= limit) break;
    }
  }
  return results;
}
