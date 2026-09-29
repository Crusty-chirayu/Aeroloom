import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { trailToGeoJson } from '../lib/map/trailGeoJson.ts';
import type { PositionSample } from '../lib/providers/positions/types.ts';

describe('Flight Trail GeoJSON & Breadcrumb Engine Tests', () => {
  test('returns empty feature collection when given undefined, empty, or single point', () => {
    assert.strictEqual(trailToGeoJson(undefined).features.length, 0);
    assert.strictEqual(trailToGeoJson([]).features.length, 0);
    const single: PositionSample[] = [
      { latitude: 40.64, longitude: -73.78, altitude: 5000, speed: 250, heading: 90, timestamp: 1000 },
    ];
    assert.strictEqual(trailToGeoJson(single).features.length, 0);
  });

  test('sorts samples chronologically and constructs valid LineString GeoJSON', () => {
    const samples: PositionSample[] = [
      { latitude: 40.66, longitude: -73.74, altitude: 7000, speed: 280, heading: 90, timestamp: 3000 },
      { latitude: 40.64, longitude: -73.78, altitude: 5000, speed: 250, heading: 90, timestamp: 1000 },
      { latitude: 40.65, longitude: -73.76, altitude: 6000, speed: 270, heading: 90, timestamp: 2000 },
    ];

    const result = trailToGeoJson(samples);
    assert.strictEqual(result.features.length, 1);
    const feature = result.features[0];
    assert.strictEqual(feature.geometry.type, 'LineString');
    assert.strictEqual(feature.geometry.coordinates.length, 3);
    // Verified chronological ordering [lng, lat]:
    assert.deepStrictEqual(feature.geometry.coordinates[0], [-73.78, 40.64]);
    assert.deepStrictEqual(feature.geometry.coordinates[1], [-73.76, 40.65]);
    assert.deepStrictEqual(feature.geometry.coordinates[2], [-73.74, 40.66]);

    assert.strictEqual(feature.properties.pointCount, 3);
    assert.strictEqual(feature.properties.durationSeconds, 2);
    assert.strictEqual(feature.properties.avgSpeed, 267);
  });

  test('filters out duplicate stationary points', () => {
    const samples: PositionSample[] = [
      { latitude: 40.64, longitude: -73.78, altitude: 5000, speed: 250, heading: 90, timestamp: 1000 },
      // Identical coordinates with slight timestamp delta (e.g. stationary transponder beacon)
      { latitude: 40.64, longitude: -73.78, altitude: 5000, speed: 250, heading: 90, timestamp: 2000 },
      { latitude: 40.65, longitude: -73.76, altitude: 6000, speed: 270, heading: 90, timestamp: 3000 },
    ];

    const result = trailToGeoJson(samples);
    assert.strictEqual(result.features.length, 1);
    // Duplicate point is discarded
    assert.strictEqual(result.features[0].geometry.coordinates.length, 2);
  });

  test('breaks discontinuity when an unrealistic geographic jump occurs', () => {
    const samples: PositionSample[] = [
      { latitude: 40.64, longitude: -73.78, altitude: 5000, speed: 250, heading: 90, timestamp: 1000 },
      { latitude: 40.65, longitude: -73.76, altitude: 6000, speed: 270, heading: 90, timestamp: 2000 },
      // Discontinuous jump to California (2200+ nm away within 2 seconds)
      { latitude: 37.62, longitude: -122.37, altitude: 32000, speed: 450, heading: 270, timestamp: 4000 },
      { latitude: 37.63, longitude: -122.39, altitude: 31000, speed: 440, heading: 270, timestamp: 6000 },
    ];

    const result = trailToGeoJson(samples);
    assert.strictEqual(result.features.length, 1);
    // Trail was reset at California, discarding previous segment
    assert.strictEqual(result.features[0].geometry.coordinates.length, 2);
    assert.deepStrictEqual(result.features[0].geometry.coordinates[0], [-122.37, 37.62]);
    assert.deepStrictEqual(result.features[0].geometry.coordinates[1], [-122.39, 37.63]);
  });
});
