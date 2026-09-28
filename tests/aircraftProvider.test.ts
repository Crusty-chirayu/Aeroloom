import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAircraftRecord } from '../lib/providers/positions/airplanesLive.ts';

describe('lib/providers/positions/airplanesLive normalization tests', () => {
  test('normalizes complete readsb aircraft record', () => {
    const raw = {
      hex: 'a38d95',
      type: 'adsb_icao',
      flight: 'REH35   ',
      r: 'N328RX',
      t: 'EC35',
      alt_baro: 6000,
      alt_geom: 6050,
      gs: 114.6,
      track: 339.03,
      baro_rate: 64,
      squawk: '4574',
      lat: 37.923843,
      lon: -122.611746,
      seen_pos: 0.1,
    };

    const norm = normalizeAircraftRecord(raw, 'airplanes.live', 1700000000000);
    assert.ok(norm);
    assert.equal(norm.id, 'a38d95');
    assert.equal(norm.callsign, 'REH35'); // Trailing spaces trimmed
    assert.equal(norm.registration, 'N328RX');
    assert.equal(norm.aircraftType, 'EC35');
    assert.equal(norm.altitude, 6000);
    assert.equal(norm.speed, 114.6);
    assert.equal(norm.heading, 339.03);
    assert.equal(norm.latitude, 37.923843);
    assert.equal(norm.longitude, -122.611746);
    assert.equal(norm.squawk, '4574');
    assert.equal(norm.verticalRate, 64);
    assert.equal(norm.isGround, false);
    assert.equal(norm.source, 'airplanes.live');
  });

  test('rejects records without valid latitude or longitude', () => {
    assert.equal(normalizeAircraftRecord({ hex: '123', flight: 'TST1' }), null);
    assert.equal(normalizeAircraftRecord({ lat: 'bad', lon: -122.4 }), null);
    assert.equal(normalizeAircraftRecord({ lat: 37.5, lon: NaN }), null);
    assert.equal(normalizeAircraftRecord({ lat: 105.0, lon: -122.4 }), null); // Out of latitude bounds
    assert.equal(normalizeAircraftRecord({ lat: 37.5, lon: -195.0 }), null); // Out of longitude bounds
  });

  test('handles ground status correctly', () => {
    const rawGround = {
      hex: 'a3541a',
      flight: 'OPS36',
      alt_baro: 'ground',
      lat: 37.626823,
      lon: -122.395804,
      gs: 15.5,
      track: 140.62,
    };

    const norm = normalizeAircraftRecord(rawGround, 'adsb-open', 1700000000000);
    assert.ok(norm);
    assert.equal(norm.altitude, 0);
    assert.equal(norm.isGround, true);
    assert.equal(norm.callsign, 'OPS36');
  });

  test('falls back to hex when flight callsign is absent or empty', () => {
    const rawNoFlight = {
      hex: 'adbaca',
      lat: 37.613207,
      lon: -122.389725,
      alt_baro: 12000,
    };

    const norm = normalizeAircraftRecord(rawNoFlight, 'airplanes.live', 1700000000000);
    assert.ok(norm);
    assert.equal(norm.callsign, 'ADBACA');
  });

  test('handles track normalization for extreme or negative values', () => {
    const raw = {
      hex: 'test1',
      lat: 37.0,
      lon: -122.0,
      track: -45, // Negative track
    };

    const norm = normalizeAircraftRecord(raw);
    assert.ok(norm);
    assert.equal(norm.heading, 315); // Normalizes -45 to 315 degrees
  });

  test('handles null or primitive input gracefully without throwing', () => {
    assert.equal(normalizeAircraftRecord(null), null);
    assert.equal(normalizeAircraftRecord(undefined), null);
    assert.equal(normalizeAircraftRecord('invalid string'), null);
    assert.equal(normalizeAircraftRecord(12345), null);
  });
});
