import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  LocalDevicePersistenceAdapter,
  CloudPersistenceAdapter,
  type StoredFlight,
  type StoredWatchlist,
  type StoredAlertRule,
  type StoredAlert,
  type AeroloomExportBundle,
} from '../lib/storage/persistenceAdapter.ts';

// In-memory mock localStorage for isolated adapter tests
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

function parseEnv(): { url?: string; anonKey?: string; serviceRole?: string } {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, 'utf-8');
  let url: string | undefined;
  let anonKey: string | undefined;
  let serviceRole: string | undefined;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') url = val;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') anonKey = val;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceRole = val;
    }
  }
  return { url, anonKey, serviceRole };
}

describe('Hosted Supabase & Multi-Tier Persistence Acceptance Suite', () => {
  const env = parseEnv();
  const hasHostedCredentials = !!(env.url && env.anonKey);
  let liveClient: SupabaseClient | null = null;

  beforeEach(() => {
    (globalThis as unknown as { localStorage: MockLocalStorage }).localStorage = new MockLocalStorage();
  });

  if (hasHostedCredentials) {
    liveClient = createClient(env.url!, env.anonKey!);
  }

  test('Security & Secret Isolation: Zero service-role or secret leaks', () => {
    // 1. Service role key must NEVER have NEXT_PUBLIC_ prefix
    assert.strictEqual(
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
      undefined,
      'Service role key must never be exposed as NEXT_PUBLIC_'
    );

    // 2. Anon key must be present and not empty
    assert.ok(env.anonKey && env.anonKey.length > 20, 'Anon key is configured');

    // 3. Supabase URL must be HTTPS
    assert.ok(env.url && env.url.startsWith('https://'), 'Supabase URL must use TLS/HTTPS');
  });

  test('Hosted Schema Verification: Core tables exist in Supabase PostgREST schema cache', async (t) => {
    if (!liveClient) {
      t.skip('Skipped: Supabase credentials not found in .env.local');
      return;
    }

    const tables = ['profiles', 'saved_flights', 'watchlists', 'alert_rules', 'airspace_alerts'];
    for (const table of tables) {
      const { status, error } = await liveClient.from(table).select('*').limit(1);
      assert.strictEqual(
        status,
        200,
        `Table "${table}" must be accessible and return HTTP 200`
      );
      assert.strictEqual(
        error,
        null,
        `Table "${table}" should have no schema cache or relation errors`
      );
    }
  });

  test('PostgreSQL Row Level Security: Unauthenticated write attempts are strictly rejected', async (t) => {
    if (!liveClient) {
      t.skip('Skipped: Supabase credentials not found in .env.local');
      return;
    }

    // Attempting unauthenticated insert on profiles
    const profileRes = await liveClient.from('profiles').insert({
      id: '00000000-0000-0000-0000-000000000000',
      email: 'unauth@test.internal',
    });
    assert.strictEqual(profileRes.status, 401);
    assert.strictEqual(profileRes.error?.code, '42501', 'Must return Postgres 42501 RLS policy violation');

    // Attempting unauthenticated insert on saved_flights
    const flightsRes = await liveClient.from('saved_flights').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      aircraft_hex: 'a1b2c3',
    });
    assert.strictEqual(flightsRes.status, 401);
    assert.strictEqual(flightsRes.error?.code, '42501', 'Must return Postgres 42501 RLS policy violation');

    // Attempting unauthenticated insert on watchlists
    const watchlistsRes = await liveClient.from('watchlists').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'Illegal Watchlist',
    });
    assert.strictEqual(watchlistsRes.status, 401);
    assert.strictEqual(watchlistsRes.error?.code, '42501', 'Must return Postgres 42501 RLS policy violation');

    // Attempting unauthenticated insert on alert_rules
    const rulesRes = await liveClient.from('alert_rules').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'Illegal Rule',
      rule_type: 'EMERGENCY_SQUAWK',
    });
    assert.strictEqual(rulesRes.status, 401);
    assert.strictEqual(rulesRes.error?.code, '42501', 'Must return Postgres 42501 RLS policy violation');
  });

  test('CloudPersistenceAdapter: Seamless unauthenticated fallback to local storage', async () => {
    const adapter = new CloudPersistenceAdapter();
    assert.strictEqual(adapter.mode, 'cloud-synced');

    // Flight storage without authenticated user_id falls back safely
    const testFlight: StoredFlight = {
      id: 'abc123',
      callsign: 'UAL901',
      aircraftType: 'B77W',
      registration: 'N78001',
      savedAt: Date.now(),
      notes: 'San Francisco to Tokyo Narita',
    };

    await adapter.saveFlight(testFlight);
    const flights = await adapter.getSavedFlights();
    assert.strictEqual(flights.length, 1);
    assert.strictEqual(flights[0].id, 'abc123');
    assert.strictEqual(flights[0].callsign, 'UAL901');

    await adapter.removeSavedFlight('abc123');
    const flightsAfter = await adapter.getSavedFlights();
    assert.strictEqual(flightsAfter.length, 0);
  });

  test('Watchlist & Alert Rule Multi-Tier Persistence with fallback', async () => {
    const adapter = new CloudPersistenceAdapter();

    const newWl: StoredWatchlist = {
      id: 'wl_transpacific_777',
      name: 'Transpacific Boeing 777 Fleet',
      aircraftHexes: ['a12345', 'b67890'],
      createdAt: Date.now(),
    };

    await adapter.saveWatchlist(newWl);
    const watchlists = await adapter.getWatchlists();
    const foundWl = watchlists.find((w) => w.id === 'wl_transpacific_777');
    assert.ok(foundWl);
    assert.strictEqual(foundWl.aircraftHexes.length, 2);

    await adapter.deleteWatchlist('wl_transpacific_777');
    const watchlistsAfter = await adapter.getWatchlists();
    assert.strictEqual(watchlistsAfter.find((w) => w.id === 'wl_transpacific_777'), undefined);

    // Alert Rule lifecycle
    const newRule: StoredAlertRule = {
      id: 'rule_stratosphere_ceiling',
      name: 'High Altitude Stratosphere Excursion (FL450+)',
      ruleType: 'ALTITUDE_CEILING',
      thresholdAltitude: 45000,
      enabled: true,
      createdAt: Date.now(),
    };

    await adapter.saveAlertRule(newRule);
    const rules = await adapter.getAlertRules();
    const foundRule = rules.find((r) => r.id === 'rule_stratosphere_ceiling');
    assert.ok(foundRule);
    assert.strictEqual(foundRule.thresholdAltitude, 45000);

    await adapter.deleteAlertRule('rule_stratosphere_ceiling');
    const rulesAfter = await adapter.getAlertRules();
    assert.strictEqual(rulesAfter.find((r) => r.id === 'rule_stratosphere_ceiling'), undefined);
  });

  test('Airspace Alert Event Log persistence, read-marking, and clearing', async () => {
    const adapter = new CloudPersistenceAdapter();

    const alert: StoredAlert = {
      id: 'alert_squawk_7700_hex123',
      type: 'EMERGENCY_SQUAWK',
      severity: 'critical',
      title: '7700 General Emergency Declared',
      message: 'Aircraft A1B2C3 transmitting emergency squawk 7700',
      aircraftId: 'a1b2c3',
      callsign: 'EMERG1',
      squawk: '7700',
      timestamp: Date.now(),
      read: false,
    };

    await adapter.saveAlert(alert);
    const alerts = await adapter.getAlerts();
    assert.ok(alerts.length >= 1);
    const saved = alerts.find((a) => a.id === 'alert_squawk_7700_hex123');
    assert.ok(saved);
    assert.strictEqual(saved.read, false);

    // Mark as read
    await adapter.markAlertRead('alert_squawk_7700_hex123');
    const alertsRead = await adapter.getAlerts();
    const readAlert = alertsRead.find((a) => a.id === 'alert_squawk_7700_hex123');
    assert.ok(readAlert);
    assert.strictEqual(readAlert.read, true);

    // Clear alerts
    await adapter.clearAlerts();
    const emptyAlerts = await adapter.getAlerts();
    assert.strictEqual(emptyAlerts.length, 0);
  });

  test('Export and Import Bundle verification with integrity validation', async () => {
    const adapter = new LocalDevicePersistenceAdapter();

    // Seed test data
    await adapter.saveFlight({
      id: 'feed01',
      callsign: 'TEST01',
      savedAt: Date.now(),
    });

    const exportBundle = await adapter.exportData();
    assert.strictEqual(exportBundle.version, '1.0');
    assert.ok(Array.isArray(exportBundle.savedFlights));
    assert.ok(exportBundle.savedFlights.some((f) => f.id === 'feed01'));

    // Corrupted bundle should be rejected
    const corruptBundle = { version: '2.0', foo: 'bar' } as unknown as AeroloomExportBundle;
    const importCorruptResult = await adapter.importData(corruptBundle);
    assert.strictEqual(importCorruptResult, false);

    // Valid bundle should import cleanly
    const freshAdapter = new LocalDevicePersistenceAdapter();
    const importValidResult = await freshAdapter.importData(exportBundle);
    assert.strictEqual(importValidResult, true);
    const importedFlights = await freshAdapter.getSavedFlights();
    assert.ok(importedFlights.some((f) => f.id === 'feed01'));
  });

  test('Hosted Auth Lifecycle & Cross-User Data Isolation: Full registration, login, profile trigger, and RLS', async (t) => {
    if (!liveClient || !env.url || !env.anonKey) {
      t.skip('Skipped: Supabase credentials not found in .env.local');
      return;
    }

    const testClient = createClient(env.url, env.anonKey, {
      auth: { persistSession: false },
    });

    const timestamp = Date.now();
    const testEmail = `operator_acc_${timestamp}@internal.aeroloom.dev`;
    const testPassword = `AeroLoom_${timestamp}!Secure`;

    // 1. Test Registration
    const { data: signUpData, error: signUpError } = await testClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { display_name: `Operator-Acc-${timestamp.toString().slice(-4)}` },
      },
    });

    assert.strictEqual(signUpError, null, `SignUp should succeed: ${signUpError?.message}`);
    assert.ok(signUpData.user?.id, 'User ID should be issued');
    assert.ok(signUpData.session, 'Immediate active session should exist with email confirmation disabled');

    const userId = signUpData.user.id;

    // 2. Test Sign Out
    const { error: signOutError } = await testClient.auth.signOut();
    assert.strictEqual(signOutError, null);

    // 3. Test Sign In
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    assert.strictEqual(signInError, null);
    assert.ok(signInData.session?.access_token, 'Access token should be issued on sign in');

    // 4. Authenticated client
    const authClient = createClient(env.url, env.anonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`,
        },
      },
    });

    // 5. Test Profile Auto-Creation Trigger
    const { data: profile, error: profileErr } = await authClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    assert.strictEqual(profileErr, null, 'Profile should have been created by trigger');
    assert.strictEqual(profile.id, userId);

    // 6. Authenticated Write & Read on saved_flights
    const testHex = 'e01234';
    const { error: flightInsertErr } = await authClient.from('saved_flights').insert({
      user_id: userId,
      aircraft_hex: testHex,
      callsign: 'TEST99',
    });
    assert.strictEqual(flightInsertErr, null, 'Authenticated insert should succeed');

    const { data: readFlights, error: flightReadErr } = await authClient
      .from('saved_flights')
      .select('*')
      .eq('user_id', userId);
    assert.strictEqual(flightReadErr, null);
    assert.ok(readFlights && readFlights.length >= 1);
    assert.strictEqual(readFlights[0].aircraft_hex, testHex);

    // 7. Cross-User Data Isolation: Attempt to write under another user's ID
    const fakeUserId = '99999999-9999-9999-9999-999999999999';
    const { error: crossInsertErr } = await authClient.from('saved_flights').insert({
      user_id: fakeUserId,
      aircraft_hex: 'f99999',
    });
    assert.ok(crossInsertErr, 'Cross-user write must be rejected by RLS');
    assert.strictEqual(crossInsertErr.code, '42501', 'Must be Postgres RLS violation code 42501');

    // 8. Negative Test: Bad Password
    const { error: badAuthErr } = await testClient.auth.signInWithPassword({
      email: testEmail,
      password: 'IncorrectPassword999!',
    });
    assert.ok(badAuthErr, 'Invalid password should error');
    assert.strictEqual(badAuthErr.status, 400);

    // 9. Clean up test records
    await authClient.from('saved_flights').delete().eq('user_id', userId);
  });
});

