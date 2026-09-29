'use client';

import { useState, useEffect } from 'react';
import type { AircraftPosition } from '@/lib/providers/positions/types';

export interface SavedFlight {
  id: string; // aircraft hex
  callsign?: string;
  aircraftType?: string;
  registration?: string;
  savedAt: number; // timestamp
  notes?: string;
}

export interface WatchlistEntry {
  id: string; // unique ID
  name: string;
  aircraftHexes: string[]; // array of hexes
  createdAt: number;
}

export interface AirspaceAlert {
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

const STORAGE_KEYS = {
  SAVED_FLIGHTS: 'aeroloom_saved_flights_v1',
  WATCHLISTS: 'aeroloom_watchlists_v1',
  ALERTS: 'aeroloom_alerts_v1',
};

// Default initial watchlist
const DEFAULT_WATCHLISTS: WatchlistEntry[] = [
  {
    id: 'wl_priority',
    name: 'Transatlantic & Heavy Corridor',
    aircraftHexes: ['a38d95', 'a1b2c3', 'c0ffee'],
    createdAt: Date.now() - 86400000,
  },
];

class UserStoreManager {
  private savedFlights: SavedFlight[] = [];
  private watchlists: WatchlistEntry[] = [];
  private alerts: AirspaceAlert[] = [];
  private listeners: Set<() => void> = new Set();
  private isLoaded = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.load();
    }
  }

  private load() {
    try {
      const savedJson = localStorage.getItem(STORAGE_KEYS.SAVED_FLIGHTS);
      this.savedFlights = savedJson ? JSON.parse(savedJson) : [];

      const wlJson = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
      this.watchlists = wlJson ? JSON.parse(wlJson) : DEFAULT_WATCHLISTS;

      const alertsJson = localStorage.getItem(STORAGE_KEYS.ALERTS);
      this.alerts = alertsJson ? JSON.parse(alertsJson) : [];
      this.isLoaded = true;
    } catch {
      this.savedFlights = [];
      this.watchlists = DEFAULT_WATCHLISTS;
      this.alerts = [];
      this.isLoaded = true;
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_FLIGHTS, JSON.stringify(this.savedFlights));
      localStorage.setItem(STORAGE_KEYS.WATCHLISTS, JSON.stringify(this.watchlists));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
    } catch {
      // storage quota or incognito mode exception
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // --- Saved Flights API ---
  public getSavedFlights(): SavedFlight[] {
    return [...this.savedFlights];
  }

  public isFlightSaved(hex: string): boolean {
    return this.savedFlights.some((f) => f.id.toLowerCase() === hex.toLowerCase());
  }

  public toggleSaveFlight(aircraft: AircraftPosition): boolean {
    const existingIdx = this.savedFlights.findIndex(
      (f) => f.id.toLowerCase() === aircraft.id.toLowerCase()
    );

    if (existingIdx >= 0) {
      this.savedFlights.splice(existingIdx, 1);
      this.persist();
      return false;
    } else {
      this.savedFlights.push({
        id: aircraft.id.toLowerCase(),
        callsign: aircraft.callsign,
        aircraftType: aircraft.aircraftType,
        registration: aircraft.registration,
        savedAt: Date.now(),
      });
      this.persist();
      return true;
    }
  }

  // --- Watchlists API ---
  public getWatchlists(): WatchlistEntry[] {
    return [...this.watchlists];
  }

  public createWatchlist(name: string): WatchlistEntry {
    const newWl: WatchlistEntry = {
      id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'New Watchlist',
      aircraftHexes: [],
      createdAt: Date.now(),
    };
    this.watchlists.push(newWl);
    this.persist();
    return newWl;
  }

  public removeWatchlist(id: string) {
    this.watchlists = this.watchlists.filter((w) => w.id !== id);
    this.persist();
  }

  public toggleAircraftInWatchlist(watchlistId: string, hex: string): boolean {
    const wl = this.watchlists.find((w) => w.id === watchlistId);
    if (!wl) return false;

    const lowerHex = hex.toLowerCase();
    const idx = wl.aircraftHexes.indexOf(lowerHex);
    if (idx >= 0) {
      wl.aircraftHexes.splice(idx, 1);
      this.persist();
      return false;
    } else {
      wl.aircraftHexes.push(lowerHex);
      this.persist();
      return true;
    }
  }

  // --- Alerting Engine ---
  public getAlerts(): AirspaceAlert[] {
    return [...this.alerts];
  }

  public addAlert(alert: Omit<AirspaceAlert, 'id' | 'timestamp' | 'read'>): AirspaceAlert | null {
    // Deduplication check: do not duplicate active alert for same aircraft & type within 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isDup = this.alerts.some(
      (a) =>
        a.aircraftId.toLowerCase() === alert.aircraftId.toLowerCase() &&
        a.type === alert.type &&
        a.timestamp > fiveMinutesAgo
    );

    if (isDup) return null;

    const newAlert: AirspaceAlert = {
      ...alert,
      id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      read: false,
    };

    this.alerts.unshift(newAlert);
    if (this.alerts.length > 50) {
      this.alerts.pop(); // keep last 50 alerts
    }
    this.persist();
    return newAlert;
  }

  public markAlertRead(id: string) {
    const match = this.alerts.find((a) => a.id === id);
    if (match) {
      match.read = true;
      this.persist();
    }
  }

  public clearAllAlerts() {
    this.alerts = [];
    this.persist();
  }
}

export const userStore = new UserStoreManager();

/**
 * React hook to reactively subscribe to user store changes.
 */
export function useUserStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return userStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  return {
    savedFlights: userStore.getSavedFlights(),
    watchlists: userStore.getWatchlists(),
    alerts: userStore.getAlerts(),
    unreadAlertsCount: userStore.getAlerts().filter((a) => !a.read).length,
    isFlightSaved: (hex: string) => userStore.isFlightSaved(hex),
    toggleSaveFlight: (ac: AircraftPosition) => userStore.toggleSaveFlight(ac),
    createWatchlist: (name: string) => userStore.createWatchlist(name),
    removeWatchlist: (id: string) => userStore.removeWatchlist(id),
    toggleAircraftInWatchlist: (wId: string, hex: string) =>
      userStore.toggleAircraftInWatchlist(wId, hex),
    addAlert: (alert: Omit<AirspaceAlert, 'id' | 'timestamp' | 'read'>) =>
      userStore.addAlert(alert),
    markAlertRead: (id: string) => userStore.markAlertRead(id),
    clearAllAlerts: () => userStore.clearAllAlerts(),
  };
}
