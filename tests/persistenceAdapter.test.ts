import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  LocalDevicePersistenceAdapter,
  type StoredFlight,
  type StoredWatchlist,
  type StoredAlert,
  type AeroloomExportBundle,
} from '../lib/storage/persistenceAdapter.ts';

// Mock localStorage for Node environment testing
const storageMap = new Map<string, string>();
(globalThis as unknown as { localStorage: { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; clear: () => void } }).localStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, v),
  clear: () => storageMap.clear(),
};

describe('Unified Persistence Adapter Tests', () => {
  let adapter: LocalDevicePersistenceAdapter;

  beforeEach(() => {
    storageMap.clear();
    adapter = new LocalDevicePersistenceAdapter();
  });

  test('reports mode as device-local and isConfigured as true', () => {
    assert.equal(adapter.mode, 'device-local');
    assert.equal(adapter.isConfigured(), true);
  });

  test('saves and retrieves flights safely', async () => {
    const flight: StoredFlight = {
      id: 'a38d95',
      callsign: 'UAL400',
      aircraftType: 'B789',
      registration: 'N3895U',
      savedAt: 1700000000000,
    };

    await adapter.saveFlight(flight);
    const retrieved = await adapter.getSavedFlights();
    assert.equal(retrieved.length, 1);
    assert.equal(retrieved[0].id, 'a38d95');
    assert.equal(retrieved[0].callsign, 'UAL400');
  });

  test('removes saved flight by hex ID', async () => {
    const f1: StoredFlight = { id: 'a11111', savedAt: 1 };
    const f2: StoredFlight = { id: 'b22222', savedAt: 2 };
    await adapter.saveFlight(f1);
    await adapter.saveFlight(f2);

    assert.equal((await adapter.getSavedFlights()).length, 2);
    await adapter.removeSavedFlight('a11111');
    const remaining = await adapter.getSavedFlights();
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, 'b22222');
  });

  test('saves and deletes watchlists', async () => {
    const customWl: StoredWatchlist = {
      id: 'wl_test',
      name: 'Pacific Freighters',
      aircraftHexes: ['c0ffee', 'deadbf'],
      createdAt: 1700000000000,
    };

    await adapter.saveWatchlist(customWl);
    let watchlists = await adapter.getWatchlists();
    assert.ok(watchlists.some((w) => w.id === 'wl_test'));

    await adapter.deleteWatchlist('wl_test');
    watchlists = await adapter.getWatchlists();
    assert.equal(watchlists.some((w) => w.id === 'wl_test'), false);
  });

  test('saves, marks read, and clears airspace alerts', async () => {
    const alert: StoredAlert = {
      id: 'alt_1',
      type: 'EMERGENCY_SQUAWK',
      severity: 'critical',
      title: '7700 Declared',
      message: 'Aircraft A38D95 broadcasting general emergency',
      aircraftId: 'a38d95',
      timestamp: 1700000000000,
      read: false,
    };

    await adapter.saveAlert(alert);
    let alerts = await adapter.getAlerts();
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].read, false);

    await adapter.markAlertRead('alt_1');
    alerts = await adapter.getAlerts();
    assert.equal(alerts[0].read, true);

    await adapter.clearAlerts();
    alerts = await adapter.getAlerts();
    assert.equal(alerts.length, 0);
  });

  test('exports and imports backup bundle correctly', async () => {
    await adapter.saveFlight({ id: 'c12345', callsign: 'AAL100', savedAt: 100 });
    const bundle = await adapter.exportData();
    assert.equal(bundle.version, '1.0');
    assert.equal(bundle.savedFlights.length, 1);

    // Wipe storage
    storageMap.clear();
    assert.equal((await adapter.getSavedFlights()).length, 0);

    // Import bundle
    const success = await adapter.importData(bundle);
    assert.equal(success, true);
    const restored = await adapter.getSavedFlights();
    assert.equal(restored.length, 1);
    assert.equal(restored[0].id, 'c12345');
  });

  test('rejects corrupted or incompatible import bundles', async () => {
    const badBundle = { version: '2.0', foo: 'bar' } as unknown as AeroloomExportBundle;
    const res = await adapter.importData(badBundle);
    assert.equal(res, false);
  });
});
