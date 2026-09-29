import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

interface MockAlert {
  id: string;
  aircraftId: string;
  type: string;
  timestamp: number;
}

function processAlert(
  existingAlerts: MockAlert[],
  newAlert: { aircraftId: string; type: string; timestamp: number },
  cooldownMs = 300000
): { accepted: boolean; alerts: MockAlert[] } {
  const isDup = existingAlerts.some(
    (a) =>
      a.aircraftId.toLowerCase() === newAlert.aircraftId.toLowerCase() &&
      a.type === newAlert.type &&
      newAlert.timestamp - a.timestamp < cooldownMs
  );

  if (isDup) {
    return { accepted: false, alerts: existingAlerts };
  }

  const alertRecord: MockAlert = {
    ...newAlert,
    id: `alt_${newAlert.timestamp}`,
  };

  return {
    accepted: true,
    alerts: [alertRecord, ...existingAlerts],
  };
}

describe('User Store & Airspace Alert Engine Tests', () => {
  test('accepts initial emergency squawk alert', () => {
    const existing: MockAlert[] = [];
    const res = processAlert(existing, {
      aircraftId: 'a38d95',
      type: 'EMERGENCY_SQUAWK',
      timestamp: 1000000,
    });

    assert.strictEqual(res.accepted, true);
    assert.strictEqual(res.alerts.length, 1);
    assert.strictEqual(res.alerts[0].aircraftId, 'a38d95');
  });

  test('deduplicates identical emergency squawk within cooldown period', () => {
    const existing: MockAlert[] = [
      { id: 'alt_1', aircraftId: 'a38d95', type: 'EMERGENCY_SQUAWK', timestamp: 1000000 },
    ];

    // Attempt duplicate 30 seconds later (within 5-min cooldown)
    const res = processAlert(existing, {
      aircraftId: 'a38d95',
      type: 'EMERGENCY_SQUAWK',
      timestamp: 1030000,
    });

    assert.strictEqual(res.accepted, false);
    assert.strictEqual(res.alerts.length, 1);
  });

  test('allows alert after cooldown period has elapsed', () => {
    const existing: MockAlert[] = [
      { id: 'alt_1', aircraftId: 'a38d95', type: 'EMERGENCY_SQUAWK', timestamp: 1000000 },
    ];

    // Attempt alert 6 minutes later (> 5-min cooldown)
    const res = processAlert(existing, {
      aircraftId: 'a38d95',
      type: 'EMERGENCY_SQUAWK',
      timestamp: 1361000,
    });

    assert.strictEqual(res.accepted, true);
    assert.strictEqual(res.alerts.length, 2);
  });

  test('allows alerts for distinct aircraft without interference', () => {
    const existing: MockAlert[] = [
      { id: 'alt_1', aircraftId: 'a38d95', type: 'EMERGENCY_SQUAWK', timestamp: 1000000 },
    ];

    const res = processAlert(existing, {
      aircraftId: 'c0ffee',
      type: 'EMERGENCY_SQUAWK',
      timestamp: 1010000,
    });

    assert.strictEqual(res.accepted, true);
    assert.strictEqual(res.alerts.length, 2);
  });
});
