import type { AircraftState, Bounds, FlightProvider, TrackPoint } from './types.ts';
import { normalizeAircraftRecord, type RawReadsbResponse } from './positions/airplanesLive.ts';
import { boundsToCenterRadius } from './quantization.ts';
import { enrichAircraftPositions } from './enrichment.ts';
import { toAircraftState } from './types.ts';
import { AEROLOOM_USER_AGENT, PROVIDER_TIMEOUT_MS, getProviderCredentials } from './config.ts';
import { recordProviderSuccess, recordProviderFailure } from './healthTracker.ts';

export class AirplanesLiveProvider implements FlightProvider {
  readonly name = 'airplanes.live';
  private baseUrl = 'https://api.airplanes.live/v2';
  private timeoutMs: number;

  constructor(timeoutMs: number = PROVIDER_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  private getHeaders(): HeadersInit {
    const creds = getProviderCredentials();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': AEROLOOM_USER_AGENT,
    };
    if (creds.airplanesLiveApiKey) {
      headers['api-auth'] = creds.airplanesLiveApiKey;
    }
    return headers;
  }

  async getAircraftInBounds(bounds: Bounds): Promise<AircraftState[]> {
    const { lat, lon, radiusNm } = boundsToCenterRadius(bounds);
    const clampedRadius = Math.min(250, Math.max(10, radiusNm));
    const url = `${this.baseUrl}/point/${lat}/${lon}/${clampedRadius}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: this.getHeaders(),
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
      let errDetail = `Airplanes.live HTTP ${res.status}`;
      try {
        const errJson = (await res.json()) as { error?: string };
        if (errJson?.error) {
          errDetail = errJson.error;
        }
      } catch {
        // Body was not JSON
      }
      recordProviderFailure(this.name, errDetail, res.status);
      throw new Error(errDetail);
    }

    let json: RawReadsbResponse;
    try {
      json = await res.json();
    } catch {
      const errText = 'Airplanes.live returned invalid non-JSON body';
      recordProviderFailure(this.name, errText, res.status);
      throw new Error(errText);
    }

    if (json.error) {
      recordProviderFailure(this.name, json.error, res.status);
      throw new Error(json.error);
    }

    if (!Array.isArray(json.ac)) {
      const errText = 'Airplanes.live schema mismatch (missing ac array)';
      recordProviderFailure(this.name, errText, res.status);
      throw new Error(errText);
    }

    recordProviderSuccess(this.name, res.status);

    const now = typeof json.now === 'number' ? (json.now < 1e11 ? json.now * 1000 : json.now) : Date.now();
    const rawList = json.ac;

    const rawPositions = [];
    for (const item of rawList) {
      const norm = normalizeAircraftRecord(item, 'airplanes.live', now);
      if (norm) {
        if (
          norm.latitude >= bounds.south &&
          norm.latitude <= bounds.north &&
          norm.longitude >= bounds.west &&
          norm.longitude <= bounds.east
        ) {
          rawPositions.push(norm);
        }
      }
    }

    const enriched = enrichAircraftPositions(rawPositions);
    return enriched.map((pos) => toAircraftState(pos, now));
  }

  async getAircraftByCallsign(query: string): Promise<AircraftState | null> {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return null;

    const isHex = /^[0-9A-Fa-f]{6}$/.test(trimmed);
    const endpoint = isHex
      ? `${this.baseUrl}/hex/${trimmed.toLowerCase()}`
      : `${this.baseUrl}/callsign/${encodeURIComponent(trimmed)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(endpoint, {
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (!res.ok) {
        recordProviderFailure(this.name, `HTTP ${res.status}`, res.status);
        return null;
      }

      const json = (await res.json()) as RawReadsbResponse;
      if (json.error) {
        recordProviderFailure(this.name, json.error, res.status);
        return null;
      }

      const rawList = Array.isArray(json.ac) ? json.ac : [];
      if (rawList.length === 0) return null;

      recordProviderSuccess(this.name, res.status);

      const now = typeof json.now === 'number' ? json.now : Date.now();
      const norm = normalizeAircraftRecord(rawList[0], 'airplanes.live', now);
      if (!norm) return null;

      const enriched = enrichAircraftPositions([norm]);
      return toAircraftState(enriched[0], now);
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : 'Lookup error';
      recordProviderFailure(this.name, msg, null);
      return null;
    }
  }

  async getTrack(id: string): Promise<TrackPoint[]> {
    const hex = id.trim().toLowerCase();
    const url = `${this.baseUrl}/hex/${hex}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (!res.ok) return [];
      const json = (await res.json()) as RawReadsbResponse;
      const rawList = Array.isArray(json.ac) ? json.ac : [];
      if (rawList.length === 0) return [];

      const raw = rawList[0] as {
        lat?: number;
        lon?: number;
        alt_baro?: number;
        gs?: number;
        track?: number;
        seen_pos?: number;
        recent_positions?: Array<[number, number, number, number]>;
      };

      const now = typeof json.now === 'number' ? json.now : Date.now();
      const points: TrackPoint[] = [];

      if (Array.isArray(raw.recent_positions)) {
        for (const pt of raw.recent_positions) {
          if (Array.isArray(pt) && pt.length >= 3) {
            points.push({
              lat: pt[0],
              lon: pt[1],
              altitudeFt: pt[2],
              timestamp: pt[3] ? pt[3] * 1000 : now,
            });
          }
        }
      }

      if (typeof raw.lat === 'number' && typeof raw.lon === 'number') {
        points.push({
          lat: raw.lat,
          lon: raw.lon,
          altitudeFt: typeof raw.alt_baro === 'number' ? raw.alt_baro : 0,
          groundSpeedKt: typeof raw.gs === 'number' ? raw.gs : undefined,
          trackDeg: typeof raw.track === 'number' ? raw.track : undefined,
          timestamp: raw.seen_pos ? now - Math.round(raw.seen_pos * 1000) : now,
        });
      }

      return points;
    } catch {
      clearTimeout(timer);
      return [];
    }
  }
}
