import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  aircraftToGeoJson,
  formatAltitude,
  formatSpeed,
  formatVerticalRate,
  normalizeHeading,
  getStatusColor,
} from '../lib/map/aircraftGeoJson.ts';
import type { AircraftPosition } from '../lib/providers/positions/types.ts';

const MOCK_AIRCRAFT: AircraftPosition[] = [
  {
    id: 'a84a1a',
    callsign: 'JIA5567',
    registration: 'N633NN',
    aircraftType: 'CRJ9',
    latitude: 40.4709,
    longitude: -76.0836,
    altitude: 17150,
    heading: 282.15,
    speed: 375.4,
    verticalRate: -800,
    squawk: '1111',
    timestamp: Date.now(),
    source: 'adsb-open',
    isGround: false,
  },
  {
    id: 'a12b3c',
    callsign: 'DAL397',
    registration: 'N801DN',
    aircraftType: 'B738',
    latitude: 40.6413,
    longitude: -73.7781,
    altitude: 35000,
    heading: 90.0,
    speed: 450.0,
    verticalRate: 0,
    squawk: '7700', // Emergency squawk
    timestamp: Date.now(),
    source: 'airplanes.live',
    isGround: false,
  },
  {
    id: 'c45d6e',
    callsign: 'GNDTAXI',
    registration: 'N12345',
    aircraftType: 'C172',
    latitude: 40.75,
    longitude: -73.98,
    altitude: 0,
    heading: 45.0,
    speed: 15.0,
    verticalRate: 0,
    squawk: '1200',
    timestamp: Date.now(),
    source: 'adsb-open',
    isGround: true,
  },
  // Malformed records
  {
    id: 'bad1',
    callsign: 'BADCOORD',
    registration: '',
    latitude: NaN,
    longitude: -73.98,
    altitude: 5000,
    heading: 0,
    speed: 200,
    timestamp: Date.now(),
    source: 'fixture',
    isGround: false,
  },
  {
    id: 'bad2',
    callsign: 'OUTOFBOUNDS',
    registration: '',
    latitude: 105.0, // Invalid latitude
    longitude: -73.98,
    altitude: 5000,
    heading: 0,
    speed: 200,
    timestamp: Date.now(),
    source: 'fixture',
    isGround: false,
  },
];

describe('Aircraft GeoJSON & Telemetry Formatter', () => {
  test('formatAltitude formats flight levels, thousands ft, and ground', () => {
    assert.strictEqual(formatAltitude(35000, false), 'FL350');
    assert.strictEqual(formatAltitude(18000, false), 'FL180');
    assert.strictEqual(formatAltitude(2400, false), '2,400 FT');
    assert.strictEqual(formatAltitude(0, true), 'GND');
    assert.strictEqual(formatAltitude(500, true), 'GND');
  });

  test('formatSpeed formats knots cleanly', () => {
    assert.strictEqual(formatSpeed(375.4), '375 KTS');
    assert.strictEqual(formatSpeed(0), '0 KTS');
    assert.strictEqual(formatSpeed(NaN), '0 KTS');
  });

  test('formatVerticalRate identifies climbs, descents, and level flight', () => {
    assert.strictEqual(formatVerticalRate(1800), '+1,800 FPM');
    assert.strictEqual(formatVerticalRate(-2200), '-2,200 FPM');
    assert.strictEqual(formatVerticalRate(0), 'LEVEL');
    assert.strictEqual(formatVerticalRate(30), 'LEVEL'); // below 64 fpm noise threshold
    assert.strictEqual(formatVerticalRate(undefined), 'LEVEL');
  });

  test('normalizeHeading wraps angles into 0-359.9 range safely', () => {
    assert.strictEqual(normalizeHeading(0), 0);
    assert.strictEqual(normalizeHeading(365), 5);
    assert.strictEqual(normalizeHeading(-45), 315);
    assert.strictEqual(normalizeHeading(undefined), 0);
    assert.strictEqual(normalizeHeading(NaN), 0);
  });

  test('getStatusColor returns emergency crimson for 7700/7600 squawks', () => {
    assert.strictEqual(getStatusColor(MOCK_AIRCRAFT[1]), '#ef4444');
  });

  test('getStatusColor returns amber for active descent/climb', () => {
    assert.strictEqual(getStatusColor(MOCK_AIRCRAFT[0]), '#f59e0b');
  });

  test('aircraftToGeoJson converts valid aircraft and filters invalid/corrupted records', () => {
    const geojson = aircraftToGeoJson(MOCK_AIRCRAFT);
    assert.strictEqual(geojson.type, 'FeatureCollection');
    // Out of 5 mock records, 2 are invalid/out-of-bounds, so 3 valid features should remain
    assert.strictEqual(geojson.features.length, 3);

    const f1 = geojson.features.find((f) => f.properties.id === 'a84a1a');
    assert.ok(f1);
    assert.strictEqual(f1.properties.callsign, 'JIA5567');
    assert.strictEqual(f1.properties.aircraftType, 'CRJ9');
    assert.strictEqual(f1.geometry.coordinates[0], -76.0836);
    assert.strictEqual(f1.geometry.coordinates[1], 40.4709);
    assert.strictEqual(f1.properties.telemetryLabel, '17,150 FT • 375 KTS');
    assert.strictEqual(f1.properties.isSelected, false);
  });

  test('aircraftToGeoJson sets isSelected flag when aircraft ID matches', () => {
    const geojson = aircraftToGeoJson(MOCK_AIRCRAFT, 'a84a1a');
    const selected = geojson.features.find((f) => f.properties.id === 'a84a1a');
    const unselected = geojson.features.find((f) => f.properties.id === 'a12b3c');

    assert.ok(selected);
    assert.strictEqual(selected.properties.isSelected, true);
    assert.ok(unselected);
    assert.strictEqual(unselected.properties.isSelected, false);
  });

  test('aircraftToGeoJson filters by callsign or hex query', () => {
    const dalResults = aircraftToGeoJson(MOCK_AIRCRAFT, null, 'DAL');
    assert.strictEqual(dalResults.features.length, 1);
    assert.strictEqual(dalResults.features[0].properties.callsign, 'DAL397');

    const hexResults = aircraftToGeoJson(MOCK_AIRCRAFT, null, 'a84a');
    assert.strictEqual(hexResults.features.length, 1);
    assert.strictEqual(hexResults.features[0].properties.id, 'a84a1a');

    const nonMatch = aircraftToGeoJson(MOCK_AIRCRAFT, null, 'ZZZZ');
    assert.strictEqual(nonMatch.features.length, 0);
  });

  test('aircraftToGeoJson handles empty or non-array input gracefully', () => {
    // @ts-expect-error testing invalid input
    const empty = aircraftToGeoJson(null);
    assert.strictEqual(empty.type, 'FeatureCollection');
    assert.strictEqual(empty.features.length, 0);
  });
});
