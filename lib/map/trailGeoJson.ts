import type { PositionSample } from '../providers/positions/types.ts';
import { calculateDistanceNm } from '../airports/airportData.ts';

export interface TrailProperties {
  pointCount: number;
  startAltitude?: number;
  endAltitude?: number;
  avgSpeed?: number;
  durationSeconds?: number;
}

export type TrailFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: [number, number][]; // [longitude, latitude]
    };
    properties: TrailProperties;
  }>;
};

// Maximum plausible distance between consecutive position samples (e.g. 50 nautical miles in 1-2 minutes)
const MAX_DISCONTINUOUS_DISTANCE_NM = 45;

/**
 * Converts an array of timestamped PositionSamples into a sanitized GeoJSON LineString.
 * Prevents invalid coordinates, filters out stationary duplicate points,
 * and breaks or drops geographically discontinuous jumps.
 */
export function trailToGeoJson(samples?: PositionSample[]): TrailFeatureCollection {
  if (!samples || samples.length < 2) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  // Sort chronologically by timestamp
  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp);

  const validCoordinates: [number, number][] = [];
  let prevSample: PositionSample | null = null;
  let totalSpeed = 0;
  let speedCount = 0;

  for (const sample of sorted) {
    if (
      typeof sample.latitude !== 'number' ||
      typeof sample.longitude !== 'number' ||
      isNaN(sample.latitude) ||
      isNaN(sample.longitude) ||
      sample.latitude < -90 ||
      sample.latitude > 90 ||
      sample.longitude < -180 ||
      sample.longitude > 180
    ) {
      continue;
    }

    if (prevSample) {
      // Calculate distance between consecutive points
      const distNm = calculateDistanceNm(
        prevSample.latitude,
        prevSample.longitude,
        sample.latitude,
        sample.longitude
      );

      // Discard duplicate position (< 0.005 nm / ~30 ft)
      if (distNm < 0.005) {
        continue;
      }

      // Check for discontinuous telemetry jumps (e.g. transponder glitch or ID collision)
      if (distNm > MAX_DISCONTINUOUS_DISTANCE_NM) {
        // Break discontinuity: reset trail segment from this new point
        validCoordinates.length = 0;
      }
    }

    validCoordinates.push([sample.longitude, sample.latitude]);
    if (typeof sample.speed === 'number' && sample.speed > 0) {
      totalSpeed += sample.speed;
      speedCount++;
    }
    prevSample = sample;
  }

  if (validCoordinates.length < 2) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const durationSeconds = Math.max(0, Math.round((last.timestamp - first.timestamp) / 1000));

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: validCoordinates,
        },
        properties: {
          pointCount: validCoordinates.length,
          startAltitude: first.altitude,
          endAltitude: last.altitude,
          avgSpeed: speedCount > 0 ? Math.round(totalSpeed / speedCount) : undefined,
          durationSeconds,
        },
      },
    ],
  };
}
