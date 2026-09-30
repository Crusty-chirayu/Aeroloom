import type { AircraftState, Bounds, FlightProvider, TrackPoint } from './types.ts';
import {
  USER_AGENT,
  normalizeAircraftRecord,
  type RawReadsbResponse,
} from './positions/airplanesLive.ts';
import { boundsToCenterRadius } from './quantization.ts';
import { enrichAircraftPositions } from './enrichment.ts';
import { toAircraftState } from './types.ts';

export class AdsbLolProvider implements FlightProvider {
  readonly name = 'adsb.lol';
  private baseUrl = 'https://api.adsb.lol/v2';
  private timeoutMs: number;

  constructor(timeoutMs: number = 8000) {
    this.timeoutMs = timeoutMs;
  }

  async getAircraftInBounds(bounds: Bounds): Promise<AircraftState[]> {
    const { lat, lon, radiusNm } = boundsToCenterRadius(bounds);
    const url = `${this.baseUrl}/point/${lat}/${lon}/${radiusNm}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`adsb.lol HTTP ${res.status}`);
      }

      const json = (await res.json()) as RawReadsbResponse;
      if (json.error) {
        throw new Error(json.error);
      }

      const now = typeof json.now === 'number' ? json.now : Date.now();
      const rawList = Array.isArray(json.ac) ? json.ac : [];

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
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
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
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (!res.ok) return null;
      const json = (await res.json()) as RawReadsbResponse;
      const rawList = Array.isArray(json.ac) ? json.ac : [];
      if (rawList.length === 0) return null;

      const now = typeof json.now === 'number' ? json.now : Date.now();
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
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
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
      };

      const now = typeof json.now === 'number' ? json.now : Date.now();
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
