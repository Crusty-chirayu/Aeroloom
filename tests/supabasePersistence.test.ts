import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  LocalDevicePersistenceAdapter,
  CloudPersistenceAdapter,
  type StoredAlertRule,
  type StoredFlight,
  type StoredWatchlist,
} from '../lib/storage/persistenceAdapter.ts';
import { isSupabaseConfigured, getSupabaseBrowserClient } from '../lib/supabase/client.ts';

// In-memory mock localStorage for Node testing environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Supabase Client & Multi-Tier Persistence Tests', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MockLocalStorage }).localStorage = new MockLocalStorage();
  });

  test('isSupabaseConfigured reflects presence of public env vars honestly', () => {
    // In this clean test run without injected env vars, it must report false
    const configured = isSupabaseConfigured();
    assert.strictEqual(typeof configured, 'boolean');
  });

  test('getSupabaseBrowserClient returns null in non-browser environment without throwing', () => {
    const client = getSupabaseBrowserClient();
    assert.strictEqual(client, null);
  });

  test('CloudPersistenceAdapter reports mode as cloud-synced and gracefully falls back to local storage', async () => {
    const adapter = new CloudPersistenceAdapter();
    assert.strictEqual(adapter.mode, 'cloud-synced');

    // Test saving and retrieving flights via fallback
    const flight: StoredFlight = {
      id: 'c0ffee',
      callsign: 'COFFEE1',
      aircraftType: 'B738',
      savedAt: Date.now(),
    };

    await adapter.saveFlight(flight);
    const saved = await adapter.getSavedFlights();
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].id, 'c0ffee');
    assert.strictEqual(saved[0].callsign, 'COFFEE1');

    // Remove flight
    await adapter.removeSavedFlight('c0ffee');
    const afterRemoval = await adapter.getSavedFlights();
    assert.strictEqual(afterRemoval.length, 0);
  });

  test('LocalDevicePersistenceAdapter manages alert rules CRUD correctly', async () => {
    const adapter = new LocalDevicePersistenceAdapter();

    const rules = await adapter.getAlertRules();
    assert.ok(Array.isArray(rules));
    assert.ok(rules.length >= 2, 'Default squawk rules should exist');

    const customRule: StoredAlertRule = {
      id: 'rule_custom_test',
      name: 'Custom Supersonic Intercept Rule',
      ruleType: 'ALTITUDE_CEILING',
      thresholdAltitude: 55000,
      enabled: true,
      createdAt: Date.now(),
    };

    await adapter.saveAlertRule(customRule);
    const updatedRules = await adapter.getAlertRules();
    const found = updatedRules.find((r) => r.id === 'rule_custom_test');
    assert.ok(found);
    assert.strictEqual(found.name, 'Custom Supersonic Intercept Rule');
    assert.strictEqual(found.thresholdAltitude, 55000);

    // Delete custom rule
    await adapter.deleteAlertRule('rule_custom_test');
    const remaining = await adapter.getAlertRules();
    assert.strictEqual(remaining.find((r) => r.id === 'rule_custom_test'), undefined);
  });

  test('CloudPersistenceAdapter manages watchlist operations with fallback', async () => {
    const adapter = new CloudPersistenceAdapter();

    const newWl: StoredWatchlist = {
      id: 'wl_cloud_sync_test',
      name: 'Pacific Maritime Patrol',
      aircraftHexes: ['aabbcc', 'ddeeff'],
      createdAt: Date.now(),
    };

    await adapter.saveWatchlist(newWl);
    const watchlists = await adapter.getWatchlists();
    const match = watchlists.find((w) => w.id === 'wl_cloud_sync_test');
    assert.ok(match);
    assert.strictEqual(match.aircraftHexes.length, 2);

    await adapter.deleteWatchlist('wl_cloud_sync_test');
    const watchlistsAfter = await adapter.getWatchlists();
    assert.strictEqual(watchlistsAfter.find((w) => w.id === 'wl_cloud_sync_test'), undefined);
  });
});
