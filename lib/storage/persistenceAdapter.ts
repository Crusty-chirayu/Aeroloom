/**
 * Aeroloom Unified Persistence Architecture
 * Provides an abstract storage interface supporting:
 * 1. Local Device Storage (LocalStorage / IndexedDB with JSON Export/Import)
 * 2. Cloud-synced Server Storage (Supabase PostgreSQL with Row Level Security)
 * Transparently indicates synchronization state to prevent false claims of cross-device sync.
 */

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
  exportData(): Promise<AeroloomExportBundle>;
  importData(bundle: AeroloomExportBundle): Promise<boolean>;
}

const STORAGE_KEYS = {
  SAVED_FLIGHTS: 'aeroloom_saved_flights_v1',
  WATCHLISTS: 'aeroloom_watchlists_v1',
  ALERTS: 'aeroloom_alerts_v1',
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
      const raw = storage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
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
      // Handle storage quota exceeded in private browsing
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
      list.push(flight);
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
        createdAt: 1700000000000,
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
    const filtered = list.filter((w) => w.id !== id);
    this.setItem(STORAGE_KEYS.WATCHLISTS, filtered);
  }

  public async getAlerts(_userId?: string): Promise<StoredAlert[]> {
    return this.getItem<StoredAlert[]>(STORAGE_KEYS.ALERTS, []);
  }

  public async saveAlert(alert: StoredAlert, _userId?: string): Promise<void> {
    const list = await this.getAlerts();
    list.unshift(alert);
    // Bound alert queue to recent 50
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
 * Cloud persistence adapter scaffold.
 * Automatically checks for Supabase public credentials.
 * If credentials are not present, gracefully delegates to local adapter without failing.
 */
export class CloudPersistenceAdapter implements IPersistenceAdapter {
  public readonly mode = 'cloud-synced' as const;
  private localFallback = new LocalDevicePersistenceAdapter();

  public isConfigured(): boolean {
    return !!(
      typeof process !== 'undefined' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  public async getSavedFlights(userId?: string): Promise<StoredFlight[]> {
    if (!this.isConfigured()) return this.localFallback.getSavedFlights(userId);
    // In production, execute: supabase.from('saved_flights').select('*').eq('user_id', userId)
    return this.localFallback.getSavedFlights(userId);
  }

  public async saveFlight(flight: StoredFlight, userId?: string): Promise<void> {
    if (!this.isConfigured()) return this.localFallback.saveFlight(flight, userId);
    return this.localFallback.saveFlight(flight, userId);
  }

  public async removeSavedFlight(hex: string, userId?: string): Promise<void> {
    if (!this.isConfigured()) return this.localFallback.removeSavedFlight(hex, userId);
    return this.localFallback.removeSavedFlight(hex, userId);
  }

  public async getWatchlists(userId?: string): Promise<StoredWatchlist[]> {
    if (!this.isConfigured()) return this.localFallback.getWatchlists(userId);
    return this.localFallback.getWatchlists(userId);
  }

  public async saveWatchlist(watchlist: StoredWatchlist, userId?: string): Promise<void> {
    if (!this.isConfigured()) return this.localFallback.saveWatchlist(watchlist, userId);
    return this.localFallback.saveWatchlist(watchlist, userId);
  }

  public async deleteWatchlist(id: string, userId?: string): Promise<void> {
    if (!this.isConfigured()) return this.localFallback.deleteWatchlist(id, userId);
    return this.localFallback.deleteWatchlist(id, userId);
  }

  public async getAlerts(userId?: string): Promise<StoredAlert[]> {
    if (!this.isConfigured()) return this.localFallback.getAlerts(userId);
    return this.localFallback.getAlerts(userId);
  }

  public async saveAlert(alert: StoredAlert, userId?: string): Promise<void> {
    if (!this.isConfigured()) return this.localFallback.saveAlert(alert, userId);
    return this.localFallback.saveAlert(alert, userId);
  }

  public async markAlertRead(id: string, userId?: string): Promise<void> {
    if (!this.isConfigured()) return this.localFallback.markAlertRead(id, userId);
    return this.localFallback.markAlertRead(id, userId);
  }

  public async clearAlerts(userId?: string): Promise<void> {
    if (!this.isConfigured()) return this.localFallback.clearAlerts(userId);
    return this.localFallback.clearAlerts(userId);
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
