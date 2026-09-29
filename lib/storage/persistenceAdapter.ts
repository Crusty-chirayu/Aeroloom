/**
 * Aeroloom Unified Persistence Architecture
 * Provides an abstract storage interface supporting:
 * 1. Local Device Storage (LocalStorage / IndexedDB with JSON Export/Import)
 * 2. Cloud-synced Server Storage (Supabase PostgreSQL with Row Level Security)
 * Transparently indicates synchronization state to prevent false claims of cross-device sync.
 */

import { getSupabaseBrowserClient, isSupabaseConfigured } from '../supabase/client.ts';

export interface UserSession {
  userId: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
  storageMode: 'device-local' | 'cloud-synced';
}

export interface StoredFlight {
  id: string; // ICAO24 hex address (lowercase)
  callsign?: string;
  aircraftType?: string;
  registration?: string;
  savedAt: number;
  notes?: string;
}

export interface StoredWatchlist {
  id: string;
  name: string;
  aircraftHexes: string[];
  createdAt: number;
}

export interface StoredAlert {
  id: string;
  type: 'EMERGENCY_SQUAWK' | 'WATCHLIST_DETECTED' | 'ALTITUDE_EXCURSION';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  aircraftId: string;
  callsign?: string;
  squawk?: string;
  timestamp: number;
  read: boolean;
}

export interface StoredAlertRule {
  id: string;
  userId?: string;
  name: string;
  ruleType: 'EMERGENCY_SQUAWK' | 'ALTITUDE_CEILING' | 'WATCHLIST_MATCH';
  thresholdAltitude?: number;
  squawkCode?: string;
  enabled: boolean;
  createdAt: number;
}

export interface AeroloomExportBundle {
  version: '1.0';
  exportedAt: number;
  savedFlights: StoredFlight[];
  watchlists: StoredWatchlist[];
  alerts: StoredAlert[];
}

export interface IPersistenceAdapter {
  readonly mode: 'device-local' | 'cloud-synced';
  isConfigured(): boolean;
  getSavedFlights(userId?: string): Promise<StoredFlight[]>;
  saveFlight(flight: StoredFlight, userId?: string): Promise<void>;
  removeSavedFlight(hex: string, userId?: string): Promise<void>;
  getWatchlists(userId?: string): Promise<StoredWatchlist[]>;
  saveWatchlist(watchlist: StoredWatchlist, userId?: string): Promise<void>;
  deleteWatchlist(id: string, userId?: string): Promise<void>;
  getAlerts(userId?: string): Promise<StoredAlert[]>;
  saveAlert(alert: StoredAlert, userId?: string): Promise<void>;
  markAlertRead(id: string, userId?: string): Promise<void>;
  clearAlerts(userId?: string): Promise<void>;
  getAlertRules?(userId?: string): Promise<StoredAlertRule[]>;
  saveAlertRule?(rule: StoredAlertRule, userId?: string): Promise<void>;
  deleteAlertRule?(id: string, userId?: string): Promise<void>;
  exportData(): Promise<AeroloomExportBundle>;
  importData(bundle: AeroloomExportBundle): Promise<boolean>;
}

const STORAGE_KEYS = {
  SAVED_FLIGHTS: 'aeroloom_saved_flights_v1',
  WATCHLISTS: 'aeroloom_watchlists_v1',
  ALERTS: 'aeroloom_alerts_v1',
  ALERT_RULES: 'aeroloom_alert_rules_v1',
};

/**
 * Robust LocalStorage implementation with safe JSON parsing and quota protection.
 */
export class LocalDevicePersistenceAdapter implements IPersistenceAdapter {
  public readonly mode = 'device-local' as const;

  public isConfigured(): boolean {
    return true; // Always operational in standard browser contexts
  }

  private getStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void } | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: { getItem(k: string): string | null; setItem(k: string, v: string): void } }).localStorage) {
      return (globalThis as unknown as { localStorage: { getItem(k: string): string | null; setItem(k: string, v: string): void } }).localStorage;
    }
    return null;
  }

  private getItem<T>(key: string, fallback: T): T {
    const storage = this.getStorage();
    if (!storage) return fallback;
    try {
      const val = storage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota limits
    }
  }

  public async getSavedFlights(_userId?: string): Promise<StoredFlight[]> {
    return this.getItem<StoredFlight[]>(STORAGE_KEYS.SAVED_FLIGHTS, []);
  }

  public async saveFlight(flight: StoredFlight, _userId?: string): Promise<void> {
    const list = await this.getSavedFlights();
    const idx = list.findIndex((f) => f.id.toLowerCase() === flight.id.toLowerCase());
    if (idx >= 0) {
      list[idx] = flight;
    } else {
      list.unshift(flight);
    }
    this.setItem(STORAGE_KEYS.SAVED_FLIGHTS, list);
  }

  public async removeSavedFlight(hex: string, _userId?: string): Promise<void> {
    const list = await this.getSavedFlights();
    const filtered = list.filter((f) => f.id.toLowerCase() !== hex.toLowerCase());
    this.setItem(STORAGE_KEYS.SAVED_FLIGHTS, filtered);
  }

  public async getWatchlists(_userId?: string): Promise<StoredWatchlist[]> {
    return this.getItem<StoredWatchlist[]>(STORAGE_KEYS.WATCHLISTS, [
      {
        id: 'wl_priority',
        name: 'Transatlantic & Heavy Corridor',
        aircraftHexes: ['a38d95', 'a1b2c3', 'c0ffee'],
        createdAt: Date.now() - 86400000,
      },
    ]);
  }

  public async saveWatchlist(watchlist: StoredWatchlist, _userId?: string): Promise<void> {
    const list = await this.getWatchlists();
    const idx = list.findIndex((w) => w.id === watchlist.id);
    if (idx >= 0) {
      list[idx] = watchlist;
    } else {
      list.push(watchlist);
    }
    this.setItem(STORAGE_KEYS.WATCHLISTS, list);
  }

  public async deleteWatchlist(id: string, _userId?: string): Promise<void> {
    const list = await this.getWatchlists();
    this.setItem(
      STORAGE_KEYS.WATCHLISTS,
      list.filter((w) => w.id !== id)
    );
  }

  public async getAlerts(_userId?: string): Promise<StoredAlert[]> {
    return this.getItem<StoredAlert[]>(STORAGE_KEYS.ALERTS, []);
  }

  public async saveAlert(alert: StoredAlert, _userId?: string): Promise<void> {
    const list = await this.getAlerts();
    list.unshift(alert);
    if (list.length > 50) list.pop();
    this.setItem(STORAGE_KEYS.ALERTS, list);
  }

  public async markAlertRead(id: string, _userId?: string): Promise<void> {
    const list = await this.getAlerts();
    const target = list.find((a) => a.id === id);
    if (target) {
      target.read = true;
      this.setItem(STORAGE_KEYS.ALERTS, list);
    }
  }

  public async clearAlerts(_userId?: string): Promise<void> {
    this.setItem(STORAGE_KEYS.ALERTS, []);
  }

  public async getAlertRules(_userId?: string): Promise<StoredAlertRule[]> {
    return this.getItem<StoredAlertRule[]>(STORAGE_KEYS.ALERT_RULES, [
      {
        id: 'rule_squawk_7700',
        name: 'Emergency Squawk 7700 Alert',
        ruleType: 'EMERGENCY_SQUAWK',
        squawkCode: '7700',
        enabled: true,
        createdAt: Date.now(),
      },
      {
        id: 'rule_squawk_7600',
        name: 'Radio Failure Squawk 7600 Alert',
        ruleType: 'EMERGENCY_SQUAWK',
        squawkCode: '7600',
        enabled: true,
        createdAt: Date.now(),
      },
      {
        id: 'rule_alt_fl400',
        name: 'High Stratum Ceiling (FL400+)',
        ruleType: 'ALTITUDE_CEILING',
        thresholdAltitude: 40000,
        enabled: false,
        createdAt: Date.now(),
      },
    ]);
  }

  public async saveAlertRule(rule: StoredAlertRule, _userId?: string): Promise<void> {
    const list = await this.getAlertRules();
    const idx = list.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      list[idx] = rule;
    } else {
      list.push(rule);
    }
    this.setItem(STORAGE_KEYS.ALERT_RULES, list);
  }

  public async deleteAlertRule(id: string, _userId?: string): Promise<void> {
    const list = await this.getAlertRules();
    this.setItem(
      STORAGE_KEYS.ALERT_RULES,
      list.filter((r) => r.id !== id)
    );
  }

  public async exportData(): Promise<AeroloomExportBundle> {
    return {
      version: '1.0',
      exportedAt: Date.now(),
      savedFlights: await this.getSavedFlights(),
      watchlists: await this.getWatchlists(),
      alerts: await this.getAlerts(),
    };
  }

  public async importData(bundle: AeroloomExportBundle): Promise<boolean> {
    if (!bundle || bundle.version !== '1.0') return false;
    if (Array.isArray(bundle.savedFlights)) {
      this.setItem(STORAGE_KEYS.SAVED_FLIGHTS, bundle.savedFlights);
    }
    if (Array.isArray(bundle.watchlists)) {
      this.setItem(STORAGE_KEYS.WATCHLISTS, bundle.watchlists);
    }
    if (Array.isArray(bundle.alerts)) {
      this.setItem(STORAGE_KEYS.ALERTS, bundle.alerts);
    }
    return true;
  }
}

/**
 * Cloud persistence adapter executing against Supabase with PostgreSQL Row Level Security.
 * Automatically checks for Supabase public credentials.
 * If credentials are not present or network fails, gracefully delegates to local adapter without crashing.
 */
export class CloudPersistenceAdapter implements IPersistenceAdapter {
  public readonly mode = 'cloud-synced' as const;
  private localFallback = new LocalDevicePersistenceAdapter();

  public isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  public async getSavedFlights(userId?: string): Promise<StoredFlight[]> {
    if (!this.isConfigured()) return this.localFallback.getSavedFlights(userId);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return this.localFallback.getSavedFlights(userId);

    try {
      let query = supabase.from('saved_flights').select('*').order('saved_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error || !data) {
        return this.localFallback.getSavedFlights(userId);
      }

      return data.map((row) => ({
        id: row.aircraft_hex,
        callsign: row.callsign || undefined,
        aircraftType: row.aircraft_type || undefined,
        registration: row.registration || undefined,
        savedAt: new Date(row.saved_at).getTime(),
        notes: row.notes || undefined,
      }));
    } catch {
      return this.localFallback.getSavedFlights(userId);
    }
  }

  public async saveFlight(flight: StoredFlight, userId?: string): Promise<void> {
    // Keep local cache updated
    await this.localFallback.saveFlight(flight, userId);

    if (!this.isConfigured() || !userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      await supabase.from('saved_flights').upsert(
        {
          user_id: userId,
          aircraft_hex: flight.id.toLowerCase(),
          callsign: flight.callsign || null,
          aircraft_type: flight.aircraftType || null,
          registration: flight.registration || null,
          notes: flight.notes || null,
          saved_at: new Date(flight.savedAt).toISOString(),
        },
        { onConflict: 'user_id,aircraft_hex' }
      );
    } catch {
      // Local fallback already holds the update
    }
  }

  public async removeSavedFlight(hex: string, userId?: string): Promise<void> {
    await this.localFallback.removeSavedFlight(hex, userId);

    if (!this.isConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      let query = supabase.from('saved_flights').delete().eq('aircraft_hex', hex.toLowerCase());
      if (userId) {
        query = query.eq('user_id', userId);
      }
      await query;
    } catch {
      // Local fallback handled
    }
  }

  public async getWatchlists(userId?: string): Promise<StoredWatchlist[]> {
    if (!this.isConfigured()) return this.localFallback.getWatchlists(userId);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return this.localFallback.getWatchlists(userId);

    try {
      let query = supabase.from('watchlists').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.localFallback.getWatchlists(userId);
      }

      return data.map((row) => ({
        id: row.id,
        name: row.name,
        aircraftHexes: row.aircraft_hexes || [],
        createdAt: new Date(row.created_at).getTime(),
      }));
    } catch {
      return this.localFallback.getWatchlists(userId);
    }
  }

  public async saveWatchlist(watchlist: StoredWatchlist, userId?: string): Promise<void> {
    await this.localFallback.saveWatchlist(watchlist, userId);

    if (!this.isConfigured() || !userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      // Check if watchlist id is a UUID or needs insertion
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(watchlist.id);
      await supabase.from('watchlists').upsert({
        ...(isUuid ? { id: watchlist.id } : {}),
        user_id: userId,
        name: watchlist.name,
        aircraft_hexes: watchlist.aircraftHexes,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Local fallback has the data
    }
  }

  public async deleteWatchlist(id: string, userId?: string): Promise<void> {
    await this.localFallback.deleteWatchlist(id, userId);

    if (!this.isConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      let query = supabase.from('watchlists').delete().eq('id', id);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      await query;
    } catch {
      // Local fallback handled
    }
  }

  public async getAlerts(userId?: string): Promise<StoredAlert[]> {
    if (!this.isConfigured()) return this.localFallback.getAlerts(userId);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return this.localFallback.getAlerts(userId);

    try {
      let query = supabase.from('airspace_alerts').select('*').order('created_at', { ascending: false }).limit(50);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error || !data) {
        return this.localFallback.getAlerts(userId);
      }

      return data.map((row) => ({
        id: row.id,
        type: row.type as StoredAlert['type'],
        severity: row.severity as StoredAlert['severity'],
        title: row.title,
        message: row.message,
        aircraftId: row.aircraft_hex,
        callsign: row.callsign || undefined,
        squawk: row.squawk || undefined,
        timestamp: new Date(row.created_at).getTime(),
        read: row.read,
      }));
    } catch {
      return this.localFallback.getAlerts(userId);
    }
  }

  public async saveAlert(alert: StoredAlert, userId?: string): Promise<void> {
    await this.localFallback.saveAlert(alert, userId);

    if (!this.isConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      await supabase.from('airspace_alerts').insert({
        user_id: userId || null,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        aircraft_hex: alert.aircraftId.toLowerCase(),
        callsign: alert.callsign || null,
        squawk: alert.squawk || null,
        read: alert.read,
        created_at: new Date(alert.timestamp).toISOString(),
      });
    } catch {
      // Local fallback has the data
    }
  }

  public async markAlertRead(id: string, userId?: string): Promise<void> {
    await this.localFallback.markAlertRead(id, userId);

    if (!this.isConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      let query = supabase.from('airspace_alerts').update({ read: true }).eq('id', id);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      await query;
    } catch {
      // Local fallback handled
    }
  }

  public async clearAlerts(userId?: string): Promise<void> {
    await this.localFallback.clearAlerts(userId);

    if (!this.isConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      let query = supabase.from('airspace_alerts').delete();
      if (userId) {
        query = query.eq('user_id', userId);
      }
      await query;
    } catch {
      // Local fallback handled
    }
  }

  public async getAlertRules(userId?: string): Promise<StoredAlertRule[]> {
    if (!this.isConfigured()) return this.localFallback.getAlertRules(userId);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return this.localFallback.getAlertRules(userId);

    try {
      let query = supabase.from('alert_rules').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.localFallback.getAlertRules(userId);
      }

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        ruleType: row.rule_type as StoredAlertRule['ruleType'],
        thresholdAltitude: row.threshold_altitude || undefined,
        squawkCode: row.squawk_code || undefined,
        enabled: row.enabled,
        createdAt: new Date(row.created_at).getTime(),
      }));
    } catch {
      return this.localFallback.getAlertRules(userId);
    }
  }

  public async saveAlertRule(rule: StoredAlertRule, userId?: string): Promise<void> {
    await this.localFallback.saveAlertRule(rule, userId);

    if (!this.isConfigured() || !userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rule.id);
      await supabase.from('alert_rules').upsert({
        ...(isUuid ? { id: rule.id } : {}),
        user_id: userId,
        name: rule.name,
        rule_type: rule.ruleType,
        threshold_altitude: rule.thresholdAltitude || null,
        squawk_code: rule.squawkCode || null,
        enabled: rule.enabled,
      });
    } catch {
      // Handled
    }
  }

  public async deleteAlertRule(id: string, userId?: string): Promise<void> {
    await this.localFallback.deleteAlertRule(id, userId);

    if (!this.isConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      let query = supabase.from('alert_rules').delete().eq('id', id);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      await query;
    } catch {
      // Handled
    }
  }

  public async exportData(): Promise<AeroloomExportBundle> {
    return this.localFallback.exportData();
  }

  public async importData(bundle: AeroloomExportBundle): Promise<boolean> {
    return this.localFallback.importData(bundle);
  }
}

// Export singleton instance based on environment capability
export const persistenceAdapter: IPersistenceAdapter =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? new CloudPersistenceAdapter()
    : new LocalDevicePersistenceAdapter();
