import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAirspaceRules, EMERGENCY_SQUAWKS } from '../lib/alerts/alertEngine.ts';
import type { AircraftPosition } from '../lib/providers/positions/types.ts';
import type { StoredAlertRule } from '../lib/storage/persistenceAdapter.ts';
import type { WatchlistEntry } from '../lib/storage/userStore.ts';

describe('Deterministic Airspace Alert Engine Tests', () => {
  const baseAircraft: AircraftPosition = {
    id: 'a38d95',
    callsign: 'UAL123',
    latitude: 37.6188,
    longitude: -122.375,
    altitude: 35000,
    heading: 270,
    speed: 450,
    timestamp: Date.now(),
    source: 'airplanes.live',
  };

  const defaultRules: StoredAlertRule[] = [
    {
      id: 'rule_7700',
      name: 'Emergency Squawk 7700 Alert',
      ruleType: 'EMERGENCY_SQUAWK',
      squawkCode: '7700',
      enabled: true,
      createdAt: Date.now(),
    },
    {
      id: 'rule_fl400',
      name: 'Stratospheric Ceiling FL400',
      ruleType: 'ALTITUDE_CEILING',
      thresholdAltitude: 40000,
      enabled: true,
      createdAt: Date.now(),
    },
    {
      id: 'rule_wl',
      name: 'Watchlist Target Active',
      ruleType: 'WATCHLIST_MATCH',
      enabled: true,
      createdAt: Date.now(),
    },
  ];

  test('detects general emergency squawk 7700 immediately', () => {
    const aircraftList: AircraftPosition[] = [
      {
        ...baseAircraft,
        squawk: '7700',
      },
    ];

    const alerts = evaluateAirspaceRules(aircraftList, defaultRules);
    assert.strictEqual(alerts.length, 1);
    assert.strictEqual(alerts[0].type, 'EMERGENCY_SQUAWK');
    assert.strictEqual(alerts[0].severity, 'critical');
    assert.strictEqual(alerts[0].aircraftId, 'a38d95');
    assert.match(alerts[0].title, /GENERAL EMERGENCY/i);
  });

  test('does not trigger emergency alert on normal squawk 1200 or 4721', () => {
    const aircraftList: AircraftPosition[] = [
      { ...baseAircraft, squawk: '1200' },
      { ...baseAircraft, id: 'b45c67', squawk: '4721' },
    ];

    const alerts = evaluateAirspaceRules(aircraftList, defaultRules);
    assert.strictEqual(alerts.length, 0);
  });

  test('detects altitude ceiling excursion when altitude exceeds threshold', () => {
    const aircraftList: AircraftPosition[] = [
      {
        ...baseAircraft,
        id: 'c89e01',
        altitude: 43000, // Exceeds 40,000 ft threshold
      },
    ];

    const alerts = evaluateAirspaceRules(aircraftList, defaultRules);
    assert.strictEqual(alerts.length, 1);
    assert.strictEqual(alerts[0].type, 'ALTITUDE_EXCURSION');
    assert.match(alerts[0].title, /ALTITUDE CEILING EXCEEDED/i);
    assert.match(alerts[0].message, /43,000 ft/);
  });

  test('detects transponder when matching active watchlist', () => {
    const watchlists: WatchlistEntry[] = [
      {
        id: 'wl_priority',
        name: 'High Priority VIP Transports',
        aircraftHexes: ['a38d95'],
        createdAt: Date.now(),
      },
    ];

    const aircraftList: AircraftPosition[] = [baseAircraft];

    const alerts = evaluateAirspaceRules(aircraftList, defaultRules, watchlists);
    assert.strictEqual(alerts.length, 1);
    assert.strictEqual(alerts[0].type, 'WATCHLIST_DETECTED');
    assert.strictEqual(alerts[0].severity, 'warning');
    assert.match(alerts[0].title, /WATCHLIST TARGET ACTIVE/i);
    assert.match(alerts[0].message, /High Priority VIP Transports/);
  });

  test('suppresses alert evaluation when rule is disabled', () => {
    const disabledRules: StoredAlertRule[] = defaultRules.map((r) => ({
      ...r,
      enabled: false,
    }));

    const aircraftList: AircraftPosition[] = [
      {
        ...baseAircraft,
        squawk: '7700',
        altitude: 45000,
      },
    ];

    const alerts = evaluateAirspaceRules(aircraftList, disabledRules);
    assert.strictEqual(alerts.length, 0);
  });

  test('suppresses stale telemetry alerts when data timestamp exceeds maxStaleSeconds', () => {
    const now = Date.now();
    const staleAircraft: AircraftPosition = {
      ...baseAircraft,
      squawk: '7700',
      timestamp: now - 300 * 1000, // 5 minutes old (stale)
    };

    const alerts = evaluateAirspaceRules([staleAircraft], defaultRules, [], {
      currentTime: now,
      maxStaleSeconds: 120,
    });

    assert.strictEqual(alerts.length, 0, 'Stale telemetry must not trigger phantom alerts');
  });

  test('recognizes standard emergency squawks catalog', () => {
    assert.ok(EMERGENCY_SQUAWKS['7700']);
    assert.ok(EMERGENCY_SQUAWKS['7600']);
    assert.ok(EMERGENCY_SQUAWKS['7500']);
  });
});
