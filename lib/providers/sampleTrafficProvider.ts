import type { AircraftState, Bounds, FlightProvider, TrackPoint } from './types.ts';
import { enrichAircraftPositions } from './enrichment.ts';
import { toAircraftState } from './types.ts';
import type { AircraftPosition } from './positions/types.ts';

const SAMPLE_AIRLINES = ['UAL', 'DAL', 'AAL', 'SWA', 'BAW', 'DLH', 'AFR', 'UAE', 'JAL', 'QFA', 'CPA', 'ACA'];
const SAMPLE_TYPES = ['B738', 'A320', 'B77W', 'A359', 'B789', 'A321', 'E190', 'B744', 'A388', 'C172', 'GLF6'];

export function generateSampleAircraft(bounds: Bounds, count: number = 60): AircraftState[] {
  const now = Date.now();
  const south = Math.max(-85, bounds.south);
  const north = Math.min(85, bounds.north);
  const west = Math.max(-175, bounds.west);
  const east = Math.min(175, bounds.east);

  const latSpan = Math.max(0.2, north - south);
  const lonSpan = Math.max(0.2, east - west);

  const rawPositions: AircraftPosition[] = [];

  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random seed per index so positions stay stable across polls
    const seed = (i * 9301 + 49297) % 233280;
    const r1 = seed / 233280;
    const r2 = ((seed * 9301 + 49297) % 233280) / 233280;
    const r3 = ((seed * 131071 + 524287) % 233280) / 233280;

    const lat = Number((south + latSpan * (0.05 + 0.9 * r1)).toFixed(4));
    const lon = Number((west + lonSpan * (0.05 + 0.9 * r2)).toFixed(4));

    const airline = SAMPLE_AIRLINES[i % SAMPLE_AIRLINES.length];
    const flightNum = 100 + (i * 37) % 900;
    const callsign = `${airline}${flightNum}`;
    const hex = (0xa00000 + i * 137).toString(16).padStart(6, '0');
    const typeCode = SAMPLE_TYPES[i % SAMPLE_TYPES.length];

    const isGround = i % 10 === 0;
    const altitude = isGround ? 0 : Math.round(5000 + r3 * 35000);
    const speed = isGround ? 15 : Math.round(220 + r1 * 300);
    const heading = Math.round(r2 * 360);
    const squawk = (1200 + (i * 111) % 6500).toString();

    rawPositions.push({
      id: hex,
      callsign,
      registration: `N${(1000 + i * 7).toString(16).toUpperCase()}`,
      aircraftType: typeCode,
      latitude: lat,
      longitude: lon,
      altitude,
      heading,
      speed,
      verticalRate: isGround ? 0 : (i % 3 === 0 ? 800 : i % 3 === 1 ? -600 : 0),
      squawk,
      timestamp: now,
      source: 'fixture',
      isGround,
    });
  }

  const enriched = enrichAircraftPositions(rawPositions);
  return enriched.map((pos) => toAircraftState(pos, now));
}

export class SampleTrafficProvider implements FlightProvider {
  readonly name = 'sample-dev-traffic';

  async getAircraftInBounds(bounds: Bounds): Promise<AircraftState[]> {
    return generateSampleAircraft(bounds, 60);
  }

  async getAircraftByCallsign(callsignOrHex: string): Promise<AircraftState | null> {
    const list = generateSampleAircraft({ south: 30, north: 50, west: -125, east: -70 }, 60);
    const match = list.find(
      (a) => a.callsign.toLowerCase() === callsignOrHex.toLowerCase() || a.id.toLowerCase() === callsignOrHex.toLowerCase()
    );
    return match || null;
  }

  async getTrack(_id: string): Promise<TrackPoint[]> {
    const now = Date.now();
    return [
      { lat: 40.0, lon: -74.0, altitudeFt: 25000, groundSpeedKt: 420, trackDeg: 90, timestamp: now - 120000 },
      { lat: 40.2, lon: -73.8, altitudeFt: 22000, groundSpeedKt: 380, trackDeg: 85, timestamp: now - 60000 },
      { lat: 40.4, lon: -73.6, altitudeFt: 18000, groundSpeedKt: 320, trackDeg: 80, timestamp: now },
    ];
  }
}
