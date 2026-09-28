import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { projectGeoToTerrain } from '../lib/projection.ts';

describe('components/hero/LiveAircraftPing projection tests', () => {
  test('projects reference center coordinates to center of terrain', () => {
    // Reference center: lat 37.7749, lon -122.4194
    const v = projectGeoToTerrain(37.7749, -122.4194, 0);
    assert.equal(v.x, 0);
    assert.equal(v.z, 0);
    assert.ok(v.y >= 2.0 && v.y <= 2.5); // Baseline elevation
  });

  test('projects higher altitudes with higher Y values', () => {
    const seaLevel = projectGeoToTerrain(37.7749, -122.4194, 0);
    const cruising = projectGeoToTerrain(37.7749, -122.4194, 38000);
    assert.ok(cruising.y > seaLevel.y);
  });

  test('projects northern coordinates to negative Z space (top of isometric screen)', () => {
    const northOfCenter = projectGeoToTerrain(38.0, -122.4194, 10000);
    assert.ok(northOfCenter.z < 0);
  });

  test('projects eastern coordinates to positive X space', () => {
    const eastOfCenter = projectGeoToTerrain(37.7749, -122.0, 10000);
    assert.ok(eastOfCenter.x > 0);
  });

  test('clamps out-of-sector coordinates within visual terrain bounds', () => {
    // Extreme far away coordinates
    const extreme = projectGeoToTerrain(70.0, 50.0, 40000);
    assert.ok(extreme.x <= 17.0 && extreme.x >= -17.0);
    assert.ok(extreme.z <= 11.5 && extreme.z >= -11.5);
  });
});
