import type { AircraftState, Bounds, FlightProvider, TrackPoint } from './types.ts';
import { enrichAircraftPositions } from './enrichment.ts';
import { toAircraftState } from './types.ts';
import type { AircraftPosition } from './positions/types.ts';
import { AEROLOOM_USER_AGENT, PROVIDER_TIMEOUT_MS, getProviderCredentials } from './config.ts';
import { recordProviderSuccess, recordProviderFailure } from './healthTracker.ts';

interface OpenSkyResponse {
  time?: number;
  states?: Array<[
    string, // 0: icao24
    string | null, // 1: callsign
    string, // 2: origin_country
    number | null, // 3: time_position
    number | null, // 4: last_contact
    number | null, // 5: longitude
    number | null, // 6: latitude
    number | null, // 7: baro_altitude (m)
    boolean, // 8: on_ground
    number | null, // 9: velocity (m/s)
    number | null, // 10: true_track (deg)
    number | null, // 11: vertical_rate (m/s)
    number[] | null, // 12: sensors
    number | null, // 13: geo_altitude (m)
    string | null, // 14: squawk
    boolean, // 15: spi
    number // 16: position_source
  ]>;
  error?: string;
}

export class OpenSkyProvider implements FlightProvider {
  readonly name = 'opensky-network';
  private baseUrl = 'https://opensky-network.org/api';
  private timeoutMs: number;

  constructor(timeoutMs: number = PROVIDER_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  private getAuthHeaders(): HeadersInit {
    const creds = getProviderCredentials();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': AEROLOOM_USER_AGENT,
    };

    if (creds.openSkyUsername && creds.openSkyPassword) {
      const basic = Buffer.from(`${creds.openSkyUsername}:${creds.openSkyPassword}`).toString('base64');
      headers['Authorization'] = `Basic ${basic}`;
    }

    return headers;
  }

  async getAircraftInBounds(bounds: Bounds): Promise<AircraftState[]> {
    // OpenSky supports bounding box: lamin, lomin, lamax, lomax
    // Anonymous users are limited to bounding box <= 25 sq deg; clamp if necessary
    let south = Math.max(-90, bounds.south);
    let north = Math.min(90, bounds.north);
    let west = Math.max(-180, bounds.west);
    let east = Math.min(180, bounds.east);

    const latSpan = Math.abs(north - south);
    const lonSpan = Math.abs(east - west);
    if (latSpan * lonSpan > 25) {
      // Clamp to center 5x5 degree box to respect anonymous limit
      const centerLat = (south + north) / 2;
      const centerLon = (west + east) / 2;
      south = Math.max(-90, centerLat - 2.5);
      north = Math.min(90, centerLat + 2.5);
      west = Math.max(-180, centerLon - 2.5);
      east = Math.min(180, centerLon + 2.5);
    }

    const url = `${this.baseUrl}/states/all?lamin=${south.toFixed(4)}&lomin=${west.toFixed(4)}&lamax=${north.toFixed(4)}&lomax=${east.toFixed(4)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: this.getAuthHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : 'Network error';
      recordProviderFailure(this.name, msg, null);
      throw err;
    }
    clearTimeout(timer);

    if (!res.ok) {
      const errText = `OpenSky HTTP ${res.status}`;
      recordProviderFailure(this.name, errText, res.status);
      throw new Error(errText);
    }

    let json: OpenSkyResponse;
    try {
      json = await res.json();
    } catch {
      const errText = 'OpenSky returned non-JSON body';
      recordProviderFailure(this.name, errText, res.status);
      throw new Error(errText);
    }

    if (json.error) {
      recordProviderFailure(this.name, json.error, res.status);
      throw new Error(json.error);
    }

    if (!Array.isArray(json.states)) {
      const errText = 'OpenSky schema mismatch (missing states array)';
      recordProviderFailure(this.name, errText, res.status);
      throw new Error(errText);
    }

    recordProviderSuccess(this.name, res.status);

    const now = typeof json.time === 'number' ? json.time * 1000 : Date.now();
    const rawPositions: AircraftPosition[] = [];

    for (const s of json.states) {
      const hex = s[0];
      const callsign = (s[1] || hex).trim().toUpperCase();
      const lon = s[5];
      const lat = s[6];

      if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
        continue;
      }

      const baroMeters = s[7];
      const altitudeFt = typeof baroMeters === 'number' && !isNaN(baroMeters) ? Math.round(baroMeters * 3.28084) : 0;
      const onGround = Boolean(s[8]);
      const velocityMs = s[9];
      const speedKt = typeof velocityMs === 'number' && !isNaN(velocityMs) ? Math.round(velocityMs * 1.94384) : 0;
      const headingDeg = typeof s[10] === 'number' && !isNaN(s[10]) ? (s[10] % 360 + 360) % 360 : 0;
      const vertRateMs = s[11];
      const vertRateFpm = typeof vertRateMs === 'number' && !isNaN(vertRateMs) ? Math.round(vertRateMs * 196.85) : undefined;
      const squawk = typeof s[14] === 'string' ? s[14].trim() : undefined;
      const timePos = s[3] ? s[3] * 1000 : now;

      rawPositions.push({
        id: hex.toLowerCase(),
        callsign: callsign || 'UNIDENTIFIED',
        latitude: lat,
        longitude: lon,
        altitude: altitudeFt,
        heading: headingDeg,
        speed: speedKt,
        verticalRate: vertRateFpm,
        squawk,
        timestamp: timePos,
        source: 'adsb-open',
        isGround: onGround,
      });
    }

    const enriched = enrichAircraftPositions(rawPositions);
    return enriched.map((pos) => toAircraftState(pos, now));
  }

  async getAircraftByCallsign(query: string): Promise<AircraftState | null> {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return null;

    const isHex = /^[0-9A-Fa-f]{6}$/.test(trimmed);
    const url = isHex
      ? `${this.baseUrl}/states/all?icao24=${trimmed.toLowerCase()}`
      : `${this.baseUrl}/states/all`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        headers: this.getAuthHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (!res.ok) {
        recordProviderFailure(this.name, `HTTP ${res.status}`, res.status);
        return null;
      }

      const json = (await res.json()) as OpenSkyResponse;
      if (!Array.isArray(json.states) || json.states.length === 0) return null;

      const now = typeof json.time === 'number' ? json.time * 1000 : Date.now();
      const matched = json.states.find((s) => {
        if (isHex) return s[0].toLowerCase() === trimmed.toLowerCase();
        return (s[1] || '').trim().toUpperCase() === trimmed;
      });

      if (!matched) return null;

      const hex = matched[0];
      const callsign = (matched[1] || hex).trim().toUpperCase();
      const lon = matched[5];
      const lat = matched[6];
      if (typeof lat !== 'number' || typeof lon !== 'number') return null;

      recordProviderSuccess(this.name, res.status);

      const baroMeters = matched[7];
      const pos: AircraftPosition = {
        id: hex.toLowerCase(),
        callsign: callsign || 'UNIDENTIFIED',
        latitude: lat,
        longitude: lon,
        altitude: typeof baroMeters === 'number' ? Math.round(baroMeters * 3.28084) : 0,
        heading: typeof matched[10] === 'number' ? matched[10] : 0,
        speed: typeof matched[9] === 'number' ? Math.round(matched[9] * 1.94384) : 0,
        timestamp: matched[3] ? matched[3] * 1000 : now,
        source: 'adsb-open',
        isGround: Boolean(matched[8]),
      };

      const enriched = enrichAircraftPositions([pos]);
      return toAircraftState(enriched[0], now);
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : 'Lookup error';
      recordProviderFailure(this.name, msg, null);
      return null;
    }
  }

  async getTrack(): Promise<TrackPoint[]> {
    // OpenSky tracks endpoint requires authenticated credentials
    return [];
  }
}
