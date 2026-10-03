import type { AircraftState, Bounds, FlightProvider, TrackPoint } from './types.ts';
import { normalizeAircraftRecord, type RawReadsbResponse } from './positions/airplanesLive.ts';
import { boundsToCenterRadius } from './quantization.ts';
import { enrichAircraftPositions } from './enrichment.ts';
import { toAircraftState } from './types.ts';
import { AEROLOOM_USER_AGENT, PROVIDER_TIMEOUT_MS } from './config.ts';
import { recordProviderSuccess, recordProviderFailure } from './healthTracker.ts';

export class AdsbFiProvider implements FlightProvider {
  readonly name = 'adsb.fi';
  private baseUrl = 'https://opendata.adsb.fi/api/v2';
  private timeoutMs: number;

  constructor(timeoutMs: number = PROVIDER_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  async getAircraftInBounds(bounds: Bounds): Promise<AircraftState[]> {
    const { lat, lon, radiusNm } = boundsToCenterRadius(bounds);
    const clampedRadius = Math.min(250, Math.max(10, radiusNm));
    const url = `${this.baseUrl}/lat/${lat}/lon/${lon}/dist/${clampedRadius}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': AEROLOOM_USER_AGENT },
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
      const errText = `adsb.fi HTTP ${res.status}`;
      recordProviderFailure(this.name, errText, res.status);
      throw new Error(errText);
    }

    let json: RawReadsbResponse & { aircraft?: unknown[] };
    try {
      json = await res.json();
    } catch {
      const errText = 'adsb.fi returned invalid non-JSON body';
      recordProviderFailure(this.name, errText, res.status);
      throw new Error(errText);
    }

    if (json.error) {
      recordProviderFailure(this.name, json.error, res.status);
      throw new Error(json.error);
    }

    const rawList = Array.isArray(json.aircraft)
      ? json.aircraft
      : Array.isArray(json.ac)
        ? json.ac
        : null;

    if (!rawList) {
      const errText = 'adsb.fi schema mismatch (missing aircraft/ac array)';
      recordProviderFailure(this.name, errText, res.status);
      throw new Error(errText);
    }

    recordProviderSuccess(this.name, res.status);

    const now = typeof json.now === 'number' ? json.now * (json.now < 1e11 ? 1000 : 1) : Date.now();
    const rawPositions = [];

    for (const item of rawList) {
      const norm = normalizeAircraftRecord(item, 'adsb-open', now);
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
        headers: { Accept: 'application/json', 'User-Agent': AEROLOOM_USER_AGENT },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (!res.ok) {
        if (res.status >= 500) {
          recordProviderFailure(this.name, `HTTP ${res.status}`, res.status);
        }
        return null;
      }

      const json = (await res.json()) as RawReadsbResponse & { aircraft?: unknown[] };
      if (json.error) {
        return null;
      }

      const rawList = Array.isArray(json.aircraft)
        ? json.aircraft
        : Array.isArray(json.ac)
          ? json.ac
          : [];

      if (rawList.length === 0) return null;

      recordProviderSuccess(this.name, res.status);
      const now = typeof json.now === 'number' ? json.now * (json.now < 1e11 ? 1000 : 1) : Date.now();
      const norm = normalizeAircraftRecord(rawList[0], 'adsb-open', now);
      if (!norm) return null;

      const enriched = enrichAircraftPositions([norm]);
      return toAircraftState(enriched[0], now);
    } catch {
      clearTimeout(timer);
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
        headers: { Accept: 'application/json', 'User-Agent': AEROLOOM_USER_AGENT },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (!res.ok) return [];
      const json = (await res.json()) as RawReadsbResponse & { aircraft?: unknown[] };
      const rawList = Array.isArray(json.aircraft)
        ? json.aircraft
        : Array.isArray(json.ac)
          ? json.ac
          : [];
      if (rawList.length === 0) return [];

      const raw = rawList[0] as {
        lat?: number;
        lon?: number;
        alt_baro?: number;
        gs?: number;
        track?: number;
        seen_pos?: number;
      };

      const now = typeof json.now === 'number' ? json.now * (json.now < 1e11 ? 1000 : 1) : Date.now();
      if (typeof raw.lat === 'number' && typeof raw.lon === 'number') {
        return [
          {
            lat: raw.lat,
            lon: raw.lon,
            altitudeFt: typeof raw.alt_baro === 'number' ? raw.alt_baro : 0,
            groundSpeedKt: typeof raw.gs === 'number' ? raw.gs : undefined,
            trackDeg: typeof raw.track === 'number' ? raw.track : undefined,
            timestamp: raw.seen_pos ? now - Math.round(raw.seen_pos * 1000) : now,
          },
        ];
      }
      return [];
    } catch {
      clearTimeout(timer);
      return [];
    }
  }
}
