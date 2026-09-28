import type { AircraftPosition, BoundingBox, PositionQuery, ProviderResponse } from './types.ts';

export const USER_AGENT = 'Aeroloom-FlightTracker/0.1.0 (https://github.com/Crusty-chirayu/Aeroloom; chirayujayaswal7@gmail.com)';

// Default reference location: San Francisco Bay Area (KSFO / KOAK / KSJC metro sector)
export const DEFAULT_QUERY_LOCATION: PositionQuery = {
  lat: 37.7749,
  lon: -122.4194,
  radiusNm: 50,
};

export const DEFAULT_BOUNDING_BOX: BoundingBox = {
  southLat: 37.2,
  northLat: 38.3,
  westLon: -123.0,
  eastLon: -121.8,
};

export interface RawReadsbRecord {
  hex?: unknown;
  flight?: unknown;
  r?: unknown;
  t?: unknown;
  alt_baro?: unknown;
  alt_geom?: unknown;
  gs?: unknown;
  track?: unknown;
  true_heading?: unknown;
  baro_rate?: unknown;
  squawk?: unknown;
  lat?: unknown;
  lon?: unknown;
  seen_pos?: unknown;
}

export interface RawReadsbResponse {
  ac?: unknown[];
  now?: unknown;
  total?: unknown;
  error?: string;
}

/**
 * Normalizes a raw readsb/airplanes.live aircraft record into a typed AircraftPosition.
 * Returns null if essential spatial data (lat/lon) is missing or corrupted.
 */
export function normalizeAircraftRecord(
  raw: unknown,
  source: 'airplanes.live' | 'adsb-open' | 'fixture' = 'airplanes.live',
  fallbackTimestamp: number = Date.now()
): AircraftPosition | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as RawReadsbRecord;

  // Validate coordinates: latitude must be [-90, 90], longitude [-180, 180]
  const lat = typeof r.lat === 'number' && !isNaN(r.lat) ? r.lat : null;
  const lon = typeof r.lon === 'number' && !isNaN(r.lon) ? r.lon : null;

  if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  // Callsign extraction & cleanup
  let callsign = '';
  if (typeof r.flight === 'string' && r.flight.trim().length > 0) {
    callsign = r.flight.trim().toUpperCase();
  } else if (typeof r.hex === 'string' && r.hex.trim().length > 0) {
    callsign = r.hex.trim().toUpperCase();
  } else {
    callsign = 'UNIDENTIFIED';
  }

  // Altitude normalization (alt_baro can be a number, or string 'ground')
  let altitude = 0;
  let isGround = false;
  if (r.alt_baro === 'ground' || r.alt_geom === 'ground') {
    altitude = 0;
    isGround = true;
  } else if (typeof r.alt_baro === 'number' && !isNaN(r.alt_baro)) {
    altitude = r.alt_baro;
  } else if (typeof r.alt_geom === 'number' && !isNaN(r.alt_geom)) {
    altitude = r.alt_geom;
  }

  // Heading / Track normalization
  let heading = 0;
  if (typeof r.track === 'number' && !isNaN(r.track)) {
    heading = (r.track % 360 + 360) % 360;
  } else if (typeof r.true_heading === 'number' && !isNaN(r.true_heading)) {
    heading = (r.true_heading % 360 + 360) % 360;
  }

  // Ground speed normalization
  let speed = 0;
  if (typeof r.gs === 'number' && !isNaN(r.gs) && r.gs >= 0) {
    speed = r.gs;
  }

  // Timestamp
  let timestamp = fallbackTimestamp;
  if (typeof r.seen_pos === 'number' && !isNaN(r.seen_pos)) {
    timestamp = fallbackTimestamp - Math.round(r.seen_pos * 1000);
  }

  return {
    id: typeof r.hex === 'string' ? r.hex.trim().toLowerCase() : Math.random().toString(36).substring(2, 8),
    callsign,
    registration: typeof r.r === 'string' ? r.r.trim() : undefined,
    aircraftType: typeof r.t === 'string' ? r.t.trim() : undefined,
    latitude: lat,
    longitude: lon,
    altitude,
    heading,
    speed,
    verticalRate: typeof r.baro_rate === 'number' ? r.baro_rate : undefined,
    squawk: typeof r.squawk === 'string' ? r.squawk : undefined,
    timestamp,
    source,
    isGround,
  };
}

/**
 * Fetches real aircraft positions from airplanes.live public API.
 * Uses bounding box or point radius endpoint.
 */
export async function fetchAirplanesLivePositions(
  query: PositionQuery = DEFAULT_QUERY_LOCATION,
  timeoutMs: number = 8000
): Promise<ProviderResponse> {
  const url = `https://api.airplanes.live/v2/point/${query.lat}/${query.lon}/${query.radiusNm}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timer);
    const text = await res.text();

    let json: RawReadsbResponse;
    try {
      json = JSON.parse(text) as RawReadsbResponse;
    } catch {
      return {
        success: false,
        aircraft: [],
        timestamp: Date.now(),
        totalFound: 0,
        provider: 'airplanes.live',
        error: `Invalid JSON response: ${text.slice(0, 120)}`,
      };
    }

    if (json.error) {
      const isContactRequired = json.error.includes('contact@airplanes.live');
      return {
        success: false,
        aircraft: [],
        timestamp: Date.now(),
        totalFound: 0,
        provider: 'airplanes.live',
        error: json.error,
        contactRequired: isContactRequired,
      };
    }

    const rawList = Array.isArray(json.ac) ? json.ac : [];
    const now = typeof json.now === 'number' ? json.now : Date.now();
    const aircraft: AircraftPosition[] = [];

    for (const item of rawList) {
      const normalized = normalizeAircraftRecord(item, 'airplanes.live', now);
      if (normalized) {
        aircraft.push(normalized);
      }
    }

    return {
      success: true,
      aircraft,
      timestamp: now,
      totalFound: aircraft.length,
      provider: 'airplanes.live',
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const errorObj = err as Error;
    return {
      success: false,
      aircraft: [],
      timestamp: Date.now(),
      totalFound: 0,
      provider: 'airplanes.live',
      error: errorObj.name === 'AbortError' ? 'Request timed out after 8s' : errorObj.message,
    };
  }
}

/**
 * Fetches real aircraft positions from open ADS-B API (adsb.lol).
 * Uses identical readsb v2 schema as airplanes.live.
 */
export async function fetchAdsbOpenPositions(
  query: PositionQuery = DEFAULT_QUERY_LOCATION,
  timeoutMs: number = 8000
): Promise<ProviderResponse> {
  const url = `https://api.adsb.lol/v2/point/${query.lat}/${query.lon}/${query.radiusNm}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timer);
    const text = await res.text();

    let json: RawReadsbResponse;
    try {
      json = JSON.parse(text) as RawReadsbResponse;
    } catch {
      return {
        success: false,
        aircraft: [],
        timestamp: Date.now(),
        totalFound: 0,
        provider: 'adsb-open',
        error: `Invalid JSON response from open ADS-B: ${text.slice(0, 120)}`,
      };
    }

    if (json.error) {
      return {
        success: false,
        aircraft: [],
        timestamp: Date.now(),
        totalFound: 0,
        provider: 'adsb-open',
        error: json.error,
      };
    }

    const rawList = Array.isArray(json.ac) ? json.ac : [];
    const now = typeof json.now === 'number' ? json.now : Date.now();
    const aircraft: AircraftPosition[] = [];

    for (const item of rawList) {
      const normalized = normalizeAircraftRecord(item, 'adsb-open', now);
      if (normalized) {
        aircraft.push(normalized);
      }
    }

    return {
      success: true,
      aircraft,
      timestamp: now,
      totalFound: aircraft.length,
      provider: 'adsb-open',
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const errorObj = err as Error;
    return {
      success: false,
      aircraft: [],
      timestamp: Date.now(),
      totalFound: 0,
      provider: 'adsb-open',
      error: errorObj.name === 'AbortError' ? 'Request timed out after 8s' : errorObj.message,
    };
  }
}

/**
 * Composite resolver that executes primary airplanes.live query first,
 * and if airplanes.live returns the contact requirement / restriction error,
 * transparently accesses the live open ADS-B feed so genuine live aircraft are always available in the 3D scene.
 */
export async function getLiveAircraftPositions(
  query: PositionQuery = DEFAULT_QUERY_LOCATION
): Promise<ProviderResponse> {
  // 1. Primary: query airplanes.live
  const primaryResult = await fetchAirplanesLivePositions(query);
  if (primaryResult.success && primaryResult.aircraft.length > 0) {
    return primaryResult;
  }

  // 2. If restricted or failed, query open ADS-B endpoint with same schema
  const openResult = await fetchAdsbOpenPositions(query);
  if (openResult.success) {
    return {
      ...openResult,
      provider: `adsb-open (airplanes.live upstream restricted: ${primaryResult.error ?? 'unknown'})`,
    };
  }

  return primaryResult;
}
