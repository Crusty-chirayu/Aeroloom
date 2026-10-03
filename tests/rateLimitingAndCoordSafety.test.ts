import test from 'node:test';
import assert from 'node:assert/strict';
import { AircraftInterpolator } from '../lib/map/interpolation.ts';
import { globalRateLimiter } from '../lib/cache/rateLimiter.ts';
import type { AircraftState } from '../lib/providers/types.ts';

test('Coordinate & Telemetry Bounds Safety Tests', async (t) => {
  await t.test('AircraftInterpolator rejects NaN and out-of-range coordinates on ingest', () => {
    const interpolator = new AircraftInterpolator();

    const badRecords: AircraftState[] = [
      {
        id: 'bad_lat_high',
        callsign: 'BAD01',
        lat: 95.5, // Out of bounds
        lon: -73.5,
        altitudeFt: 30000,
        groundSpeedKt: 450,
        trackDeg: 90,
        verticalRateFpm: 0,
        onGround: false,
        source: 'test',
        updatedAt: Date.now(),
      },
      {
        id: 'bad_lat_nan',
        callsign: 'BAD02',
        lat: NaN,
        lon: -73.5,
        altitudeFt: 30000,
        groundSpeedKt: 450,
        trackDeg: 90,
        verticalRateFpm: 0,
        onGround: false,
        source: 'test',
        updatedAt: Date.now(),
      },
      {
        id: 'good_aircraft',
        callsign: 'GOOD01',
        lat: 40.7128,
        lon: -74.006,
        altitudeFt: 32000,
        groundSpeedKt: 460,
        trackDeg: 180,
        verticalRateFpm: 0,
        onGround: false,
        source: 'test',
        updatedAt: Date.now(),
      },
    ];

    interpolator.ingestBatch(badRecords);

    assert.equal(interpolator.get('bad_lat_high'), undefined);
    assert.equal(interpolator.get('bad_lat_nan'), undefined);
    assert.notEqual(interpolator.get('good_aircraft'), undefined);
  });

  await t.test('Dead-reckoning step clamps latitude within [-89.9, 89.9] and never produces NaN', () => {
    const interpolator = new AircraftInterpolator();
    const northPoleAircraft: AircraftState = {
      id: 'pole_flyer',
      callsign: 'POLAR',
      lat: 89.85,
      lon: 0,
      altitudeFt: 35000,
      groundSpeedKt: 600,
      trackDeg: 0, // Flying directly towards and over North Pole
      verticalRateFpm: 0,
      onGround: false,
      source: 'test',
      updatedAt: Date.now(),
    };

    interpolator.ingestBatch([northPoleAircraft]);

    // Simulate 120 frames (~2 seconds) of high-speed dead reckoning
    for (let i = 0; i < 120; i++) {
      interpolator.step(Date.now() + i * 16.6);
    }

    const current = interpolator.get('pole_flyer');
    assert.ok(current);
    assert.ok(Number.isFinite(current.currentLat));
    assert.ok(Number.isFinite(current.currentLng));
    assert.ok(current.currentLat <= 89.9, `Lat ${current.currentLat} should be <= 89.9`);
    assert.ok(current.currentLat >= -89.9, `Lat ${current.currentLat} should be >= -89.9`);
    assert.ok(current.currentLng >= -180 && current.currentLng <= 180);
  });

  await t.test('Route-scoped rate limiter ensures independent endpoint quotas', () => {
    const testIp = '192.168.1.55';

    // Check live feed endpoint quota
    const liveCheck1 = globalRateLimiter.check(`${testIp}:live`, 5, 10000);
    assert.equal(liveCheck1.allowed, true);

    // Consume all 5 quota units on live
    for (let i = 0; i < 4; i++) {
      globalRateLimiter.check(`${testIp}:live`, 5, 10000);
    }
    const liveBlocked = globalRateLimiter.check(`${testIp}:live`, 5, 10000);
    assert.equal(liveBlocked.allowed, false, 'Live endpoint should now be rate limited');

    // Aircraft detail endpoint should still be completely unblocked because of scoped keys
    const aircraftCheck = globalRateLimiter.check(`${testIp}:aircraft`, 5, 10000);
    assert.equal(aircraftCheck.allowed, true, 'Aircraft endpoint should not be blocked by live traffic');
  });
});
