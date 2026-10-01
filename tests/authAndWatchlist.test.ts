import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateBundle } from '../lib/storage/bundleValidator.ts';
import { LocalDevicePersistenceAdapter, type AeroloomExportBundle } from '../lib/storage/persistenceAdapter.ts';

// Mock localStorage for Node test runner
const storageMap = new Map<string, string>();
(globalThis as unknown as { localStorage: { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; clear: () => void } }).localStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, v),
  clear: () => storageMap.clear(),
};

describe('Part E: Auth, Watchlist Sync & Bundle Import/Export Acceptance Suite', () => {
  describe('1. Watchlist Bundle Validator (validateBundle)', () => {
    it('rejects non-object or null data', () => {
      assert.strictEqual(validateBundle(null).valid, false);
      assert.strictEqual(validateBundle('string').valid, false);
      assert.strictEqual(validateBundle(123).valid, false);
    });

    it('rejects unsupported versions', () => {
      const res = validateBundle({ version: '2.0', watchlists: [] });
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('Unsupported bundle version'));
    });

    it('rejects bundles missing both watchlists and savedFlights', () => {
      const res = validateBundle({ version: '1.0' });
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('must contain at least'));
    });

    it('accepts valid version 1.0 bundle with watchlists', () => {
      const bundle: AeroloomExportBundle = {
        version: '1.0',
        exportedAt: Date.now(),
        savedFlights: [{ id: '400a01', callsign: 'BAW123', savedAt: Date.now() }],
        watchlists: [
          {
            id: 'wl_test',
            name: 'Transatlantic Heavies',
            aircraftHexes: ['400a01', 'a00001'],
            createdAt: Date.now(),
          },
        ],
        alerts: [],
      };

      const res = validateBundle(bundle);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.bundle?.watchlists.length, 1);
      assert.strictEqual(res.bundle?.savedFlights.length, 1);
    });
  });

  describe('2. LocalDevicePersistenceAdapter Export and Import Lifecycle', () => {
    it('exports valid AeroloomExportBundle schema', async () => {
      const adapter = new LocalDevicePersistenceAdapter();
      await adapter.saveFlight({ id: '400a02', callsign: 'VIR456', savedAt: Date.now() });
      await adapter.saveWatchlist({
        id: 'wl_lifecycle',
        name: 'Heathrow Inbound',
        aircraftHexes: ['400a02'],
        createdAt: Date.now(),
      });

      const exportBundle = await adapter.exportData();
      assert.strictEqual(exportBundle.version, '1.0');
      assert.ok(Array.isArray(exportBundle.savedFlights));
      assert.ok(Array.isArray(exportBundle.watchlists));
      assert.ok(exportBundle.watchlists.some((w) => w.id === 'wl_lifecycle'));
    });

    it('imports bundle data and overwrites cleanly', async () => {
      const adapter = new LocalDevicePersistenceAdapter();
      const testBundle: AeroloomExportBundle = {
        version: '1.0',
        exportedAt: Date.now(),
        savedFlights: [{ id: '400a99', callsign: 'KLM789', savedAt: Date.now() }],
        watchlists: [
          {
            id: 'wl_imported',
            name: 'European Narrowbodies',
            aircraftHexes: ['400a99'],
            createdAt: Date.now(),
          },
        ],
        alerts: [],
      };

      const success = await adapter.importData(testBundle);
      assert.strictEqual(success, true);

      const watchlists = await adapter.getWatchlists();
      assert.ok(watchlists.some((w) => w.id === 'wl_imported'));
    });
  });
});
