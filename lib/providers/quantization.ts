import type { Bounds } from './types.ts';

/**
 * Returns quantization step in decimal degrees for a given zoom level.
 * Coarser at world zoom, finer at local airport zoom.
 */
export function getQuantizationStep(zoom: number = 10): number {
  if (zoom <= 4) return 0.5; // World / Continental (~30 NM)
  if (zoom <= 7) return 0.2; // Regional (~12 NM)
  if (zoom <= 10) return 0.1; // Metro Area (~6 NM)
  return 0.05; // Terminal / Airport (~3 NM)
}

/**
 * Quantizes bounding box coordinates to fixed grid steps so that concurrent or nearby
 * users looking at roughly the same map view share exact cache keys.
 */
export function quantizeBounds(bounds: Bounds, zoom: number = 10): Bounds {
  const step = getQuantizationStep(zoom);

  const south = Math.floor(bounds.south / step) * step;
  const west = Math.floor(bounds.west / step) * step;
  const north = Math.ceil(bounds.north / step) * step;
  const east = Math.ceil(bounds.east / step) * step;

  return {
    south: Number(south.toFixed(4)),
    west: Number(west.toFixed(4)),
    north: Number(north.toFixed(4)),
    east: Number(east.toFixed(4)),
    zoom: Math.round(zoom),
  };
}

/**
 * Generates a deterministic cache key for quantized bounds.
 */
export function getBoundsCacheKey(bounds: Bounds, zoom: number = 10): string {
  const q = quantizeBounds(bounds, zoom);
  return `b_${q.south}_${q.west}_${q.north}_${q.east}_z${q.zoom ?? 10}`;
}

/**
 * Converts a geographic bounding box into a center point and radius in nautical miles.
 * Useful for upstream providers that take point + radius queries (e.g. airplanes.live /point/lat/lon/radius).
 */
export function boundsToCenterRadius(bounds: Bounds): { lat: number; lon: number; radiusNm: number } {
  const lat = (bounds.south + bounds.north) / 2;
  const lon = (bounds.west + bounds.east) / 2;

  // Approximate geodesic distance from center to corner
  const latDiffDeg = Math.abs(bounds.north - bounds.south);
  const lonDiffDeg = Math.abs(bounds.east - bounds.west);

  // 1 degree latitude ~= 60 nautical miles
  const latDistNm = (latDiffDeg / 2) * 60;
  // 1 degree longitude ~= 60 * cos(lat) nautical miles
  const lonDistNm = (lonDiffDeg / 2) * 60 * Math.cos((lat * Math.PI) / 180);

  // Radius is hypotenuse, capped between 10 NM and 250 NM
  const hypotNm = Math.sqrt(latDistNm * latDistNm + lonDistNm * lonDistNm);
  const radiusNm = Math.min(250, Math.max(10, Math.round(hypotNm)));

  return {
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
    radiusNm,
  };
}
