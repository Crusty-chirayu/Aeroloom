/**
 * Aviation Spatial & Telemetry Validation Module
 * Enforces strict bounds checking for coordinates, radio squawks, and query constraints.
 */

export interface SpatialValidationResult {
  valid: boolean;
  error?: string;
  lat: number;
  lon: number;
  radiusNm: number;
}

export function validateSpatialQuery(
  rawLat: unknown,
  rawLon: unknown,
  rawRadius: unknown,
  defaultLat: number = 37.7749,
  defaultLon: number = -122.4194,
  defaultRadius: number = 50
): SpatialValidationResult {
  const lat = rawLat !== undefined && rawLat !== null && rawLat !== '' ? Number(rawLat) : defaultLat;
  const lon = rawLon !== undefined && rawLon !== null && rawLon !== '' ? Number(rawLon) : defaultLon;
  const radiusNm = rawRadius !== undefined && rawRadius !== null && rawRadius !== '' ? Number(rawRadius) : defaultRadius;

  if (isNaN(lat) || lat < -90.0 || lat > 90.0) {
    return {
      valid: false,
      error: 'Invalid latitude: WGS84 coordinate must be between -90.0 and +90.0 degrees.',
      lat: defaultLat,
      lon: defaultLon,
      radiusNm: defaultRadius,
    };
  }

  if (isNaN(lon) || lon < -180.0 || lon > 180.0) {
    return {
      valid: false,
      error: 'Invalid longitude: WGS84 coordinate must be between -180.0 and +180.0 degrees.',
      lat: defaultLat,
      lon: defaultLon,
      radiusNm: defaultRadius,
    };
  }

  if (isNaN(radiusNm) || radiusNm <= 0 || radiusNm > 300) {
    return {
      valid: false,
      error: 'Invalid radius: operational radius must be between 1 and 300 nautical miles.',
      lat: defaultLat,
      lon: defaultLon,
      radiusNm: defaultRadius,
    };
  }

  return {
    valid: true,
    lat,
    lon,
    radiusNm,
  };
}

/**
 * Validates a 24-bit ICAO Mode-S transponder hex address.
 * Standard hex format is exactly 6 hexadecimal characters.
 */
export function isValidIcaoHex(hex: unknown): boolean {
  if (typeof hex !== 'string') return false;
  const trimmed = hex.trim();
  return /^[0-9a-fA-F]{6}$/.test(trimmed);
}

/**
 * Validates a Mode A/C 4-digit transponder squawk code (octal 0000 - 7777).
 */
export function isValidSquawk(squawk: unknown): boolean {
  if (typeof squawk !== 'string') return false;
  const trimmed = squawk.trim();
  return /^[0-7]{4}$/.test(trimmed);
}

/**
 * Identifies emergency squawk codes:
 * 7500: Hijack / Unlawful Interference
 * 7600: Lost Communications
 * 7700: General Aviation Emergency
 */
export function getEmergencyType(squawk: string | undefined): 'HIJACK' | 'RADIO_FAILURE' | 'GENERAL_EMERGENCY' | null {
  if (!squawk) return null;
  const clean = squawk.trim();
  if (clean === '7500') return 'HIJACK';
  if (clean === '7600') return 'RADIO_FAILURE';
  if (clean === '7700') return 'GENERAL_EMERGENCY';
  return null;
}
