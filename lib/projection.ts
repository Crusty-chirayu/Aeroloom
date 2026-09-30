import { DEFAULT_QUERY_LOCATION } from './providers/positions/airplanesLive.ts';

export class Vector3 {
  x: number;
  y: number;
  z: number;
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

/**
 * Decorative Cartesian Radar Projection
 * 
 * PROJECTION SPECIFICATION:
 * Converts geographic coordinates (latitude, longitude, altitude)
 * to decorative 3D radar terrain coordinates (X, Y, Z).
 * 
 * Note: This is an isometric decorative visualization projection,
 * NOT a certified cartographic or nautical navigation chart.
 */
export function projectGeoToTerrain(
  lat: number,
  lon: number,
  altFt: number = 0,
  centerLat: number = DEFAULT_QUERY_LOCATION.lat,
  centerLon: number = DEFAULT_QUERY_LOCATION.lon
): Vector3 {
  // Delta in degrees
  const dLat = lat - centerLat;
  const dLon = lon - centerLon;

  // Scale: 1 degree latitude ~ 60 nautical miles.
  // We map a ~1 degree span to ~22-26 scene units across X and Z
  const scaleLon = 26.0;
  const scaleLat = 24.0;

  const rawX = dLon * scaleLon || 0;
  const rawZ = -dLat * scaleLat || 0; // Invert Z so North is -Z (towards top of screen)

  // Clamp within the visual dotted terrain perimeter
  const x = Math.max(-17.0, Math.min(17.0, rawX));
  const z = Math.max(-11.5, Math.min(11.5, rawZ));

  // Elevation Y: elevated above the wavy terrain (terrain reaches y ~ 0.5-2.0)
  // Aircraft flies at y = 2.2 to 5.4 depending on altitude (0 to 45,000 ft)
  const normalizedAlt = Math.max(0, Math.min(45000, altFt)) / 45000;
  const y = 2.2 + normalizedAlt * 3.2;

  return new Vector3(x, y, z);
}
