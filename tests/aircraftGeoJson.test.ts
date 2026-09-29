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

  test('classifyAltitudeStrata categorizes stratosphere, cruise, terminal, and ground correctly', async () => {
    const { classifyAltitudeStrata } = await import('../lib/map/aircraftGeoJson.ts');
    assert.strictEqual(classifyAltitudeStrata(35000, false), 'stratosphere');
    assert.strictEqual(classifyAltitudeStrata(22000, false), 'cruise');
    assert.strictEqual(classifyAltitudeStrata(5000, false), 'terminal');
    assert.strictEqual(classifyAltitudeStrata(0, true), 'ground');
    assert.strictEqual(classifyAltitudeStrata(-100, false), 'ground');
  });

  test('calculateClutterMetrics measures label reduction ratio on dense airspace cluster', async () => {
    const { calculateClutterMetrics, aircraftToGeoJson } = await import('../lib/map/aircraftGeoJson.ts');
    // Generate a synthetic dense cluster of 100 aircraft (similar to JFK/EWR confluence)
    // 60 high-altitude level cruise flights, 30 terminal/climbing flights, 10 ground
    const denseFleet: AircraftPosition[] = [];
    for (let i = 0; i < 60; i++) {
      denseFleet.push({
        id: `high_${i}`,
        callsign: `CRZ${i}`,
        latitude: 40.7 + (i * 0.01),
        longitude: -74.0 + (i * 0.01),
        altitude: 33000 + (i * 100),
        heading: 90,
        speed: 480,
        verticalRate: 0, // Level cruise
        timestamp: Date.now(),
        source: 'adsb-open',
        isGround: false,
      });
    }
    for (let i = 0; i < 30; i++) {
      denseFleet.push({
        id: `term_${i}`,
        callsign: `TRM${i}`,
        latitude: 40.6 + (i * 0.01),
        longitude: -73.8 + (i * 0.01),
        altitude: 4000 + (i * 100),
        heading: 220,
        speed: 210,
        verticalRate: -800, // Active descent
        timestamp: Date.now(),
        source: 'adsb-open',
        isGround: false,
      });
    }
    for (let i = 0; i < 10; i++) {
      denseFleet.push({
        id: `gnd_${i}`,
        callsign: `GND${i}`,
        latitude: 40.64 + (i * 0.001),
        longitude: -73.78 + (i * 0.001),
        altitude: 0,
        heading: 45,
        speed: 12,
        timestamp: Date.now(),
        source: 'adsb-open',
        isGround: true,
      });
    }

    const geojson = aircraftToGeoJson(denseFleet);
    const metrics = calculateClutterMetrics(geojson);

    assert.strictEqual(metrics.totalAircraft, 100);
    assert.strictEqual(metrics.stratosphereCount, 60);
    assert.strictEqual(metrics.terminalCount, 30);
    assert.strictEqual(metrics.groundCount, 10);
    assert.strictEqual(metrics.baselineUnfilteredLabelCount, 90);
    // Only terminal and climbing flights show labels by default in dense airspace
    assert.strictEqual(metrics.strataFilteredLabelCount, 30);
    // Reduction ratio: (90 - 30) / 90 = 0.67 (~67% reduction)
    assert.ok(metrics.labelReductionRatio >= 0.65, `Expected >= 65% clutter reduction, got ${metrics.labelReductionRatio}`);
  });

  test('aircraftToGeoJson filters correctly by active category', () => {
    // CRUISE: should return DAL397 (35000ft)
    const cruiseGeo = aircraftToGeoJson(MOCK_AIRCRAFT, null, '', 'CRUISE');
    const cruiseIds = cruiseGeo.features.map((f) => f.properties.callsign);
    assert.ok(cruiseIds.includes('DAL397'));
    assert.ok(!cruiseIds.includes('GNDTAXI'));

    // CLIMB: should return JIA5567 (-800 FPM)
    const climbGeo = aircraftToGeoJson(MOCK_AIRCRAFT, null, '', 'CLIMB');
    const climbIds = climbGeo.features.map((f) => f.properties.callsign);
    assert.ok(climbIds.includes('JIA5567'));
    assert.ok(!climbIds.includes('DAL397'));

    // GROUND: should return GNDTAXI
    const gndGeo = aircraftToGeoJson(MOCK_AIRCRAFT, null, '', 'GROUND');
    const gndIds = gndGeo.features.map((f) => f.properties.callsign);
    assert.ok(gndIds.includes('GNDTAXI'));
    assert.ok(!gndIds.includes('DAL397'));

    // EMERGENCY: should return DAL397 (squawk 7700)
    const emgGeo = aircraftToGeoJson(MOCK_AIRCRAFT, null, '', 'EMERGENCY');
    const emgIds = emgGeo.features.map((f) => f.properties.callsign);
    assert.strictEqual(emgIds.length, 1);
    assert.strictEqual(emgIds[0], 'DAL397');

    // Preservation of selected aircraft even when filter does not match
    const preservedGeo = aircraftToGeoJson(MOCK_AIRCRAFT, 'c45d6e', '', 'CRUISE');
    const preservedIds = preservedGeo.features.map((f) => f.properties.id);
    assert.ok(preservedIds.includes('c45d6e'), 'Selected flight should be retained even if it is on the ground');
  });

  test('emergency squawks 7500, 7600, 7700 assign crimson status color', () => {
    const baseAircraft: AircraftPosition = {
      id: 'emg1',
      callsign: 'EMG1',
      latitude: 40.0,
      longitude: -74.0,
      altitude: 20000,
      heading: 180,
      speed: 400,
      timestamp: Date.now(),
      source: 'adsb-open',
      isGround: false,
    };

    assert.strictEqual(getStatusColor({ ...baseAircraft, squawk: '7700' }), '#ef4444');
    assert.strictEqual(getStatusColor({ ...baseAircraft, squawk: '7600' }), '#ef4444');
    assert.strictEqual(getStatusColor({ ...baseAircraft, squawk: '7500' }), '#ef4444');
    assert.notStrictEqual(getStatusColor({ ...baseAircraft, squawk: '1200' }), '#ef4444');
  });
});

