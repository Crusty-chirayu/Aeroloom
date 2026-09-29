/**
 * Aeroloom Airspace Alert Evaluation Engine
 * Pure, deterministic evaluation of live ADS-B telemetry against user-configured alert rules.
 * Strictly adheres to truth in aviation telemetry: zero simulated or fabricated emergencies.
 */

import type { AircraftPosition } from '../providers/positions/types.ts';
import type { StoredAlertRule } from '../storage/persistenceAdapter.ts';
import type { WatchlistEntry } from '../storage/userStore.ts';

export interface EvaluatedAlert {
  type: 'EMERGENCY_SQUAWK' | 'WATCHLIST_DETECTED' | 'ALTITUDE_EXCURSION';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  aircraftId: string;
  callsign?: string;
  squawk?: string;
  timestamp: number;
}

export interface EvaluationOptions {
  /** Maximum allowable data age in seconds before suppressing alerts to prevent stale ghost triggers (default: 120) */
  maxStaleSeconds?: number;
  /** Current evaluation timestamp in ms (default: Date.now()) */
  currentTime?: number;
}

/**
 * Standard Aviation Emergency Squawk Codes
 */
export const EMERGENCY_SQUAWKS: Record<string, { severity: 'critical'; name: string }> = {
  '7700': { severity: 'critical', name: 'GENERAL EMERGENCY (7700)' },
  '7600': { severity: 'critical', name: 'RADIO FAILURE / LOST COMMS (7600)' },
  '7500': { severity: 'critical', name: 'UNLAWFUL INTERFERENCE / HIJACK (7500)' },
};

/**
 * Pure evaluation function: checks a batch of live aircraft against active rules and watchlists.
 */
export function evaluateAirspaceRules(
  aircraftList: AircraftPosition[],
  rules: StoredAlertRule[],
  watchlists: WatchlistEntry[] = [],
  options: EvaluationOptions = {}
): EvaluatedAlert[] {
  const currentTime = options.currentTime ?? Date.now();
  const maxStaleSeconds = options.maxStaleSeconds ?? 120;
  const triggered: EvaluatedAlert[] = [];

  // Filter only enabled rules
  const activeRules = rules.filter((r) => r.enabled);
  if (activeRules.length === 0 || aircraftList.length === 0) {
    return triggered;
  }

  // Pre-index watchlist hexes for fast O(1) matching
  const watchlistHexMap = new Map<string, string>(); // hex -> watchlistName
  for (const wl of watchlists) {
    for (const hex of wl.aircraftHexes) {
      watchlistHexMap.set(hex.toLowerCase(), wl.name);
    }
  }

  for (const ac of aircraftList) {
    if (!ac.id) continue;

    // Freshness guard: If timestamp is present and older than maxStaleSeconds, do not evaluate
    if (ac.timestamp && (currentTime - ac.timestamp) > maxStaleSeconds * 1000) {
      continue;
    }

    const hex = ac.id.toLowerCase();
    const squawk = ac.squawk?.trim();
    const altitude = ac.altitude;

    for (const rule of activeRules) {
      // 1. EMERGENCY SQUAWK EVALUATION
      if (rule.ruleType === 'EMERGENCY_SQUAWK' && squawk) {
        const targetSquawk = rule.squawkCode?.trim();
        // Match specific squawk code if specified, or any recognized emergency squawk
        if ((targetSquawk && squawk === targetSquawk) || (!targetSquawk && EMERGENCY_SQUAWKS[squawk])) {
          const emergencyInfo = EMERGENCY_SQUAWKS[squawk] || { severity: 'critical', name: `EMERGENCY SQUAWK (${squawk})` };
          triggered.push({
            type: 'EMERGENCY_SQUAWK',
            severity: emergencyInfo.severity,
            title: `${emergencyInfo.name}: ${ac.callsign || hex.toUpperCase()}`,
            message: `Aircraft transponder transmitting squawk ${squawk} at ${altitude !== undefined ? `${altitude.toLocaleString()} ft` : 'unreported altitude'}.`,
            aircraftId: hex,
            callsign: ac.callsign,
            squawk: squawk,
            timestamp: currentTime,
          });
        }
      }

      // 2. WATCHLIST DETECTION EVALUATION
      if (rule.ruleType === 'WATCHLIST_MATCH') {
        const matchedWatchlistName = watchlistHexMap.get(hex);
        if (matchedWatchlistName) {
          triggered.push({
            type: 'WATCHLIST_DETECTED',
            severity: 'warning',
            title: `WATCHLIST TARGET ACTIVE: ${ac.callsign || hex.toUpperCase()}`,
            message: `Monitored aircraft detected in airspace. Matching Watchlist: "${matchedWatchlistName}".`,
            aircraftId: hex,
            callsign: ac.callsign,
            squawk: squawk,
            timestamp: currentTime,
          });
        }
      }

      // 3. ALTITUDE CEILING EVALUATION
      if (rule.ruleType === 'ALTITUDE_CEILING' && rule.thresholdAltitude !== undefined && altitude !== undefined) {
        if (altitude >= rule.thresholdAltitude) {
          triggered.push({
            type: 'ALTITUDE_EXCURSION',
            severity: 'info',
            title: `ALTITUDE CEILING EXCEEDED: ${ac.callsign || hex.toUpperCase()}`,
            message: `Aircraft operating at ${altitude.toLocaleString()} ft (exceeding threshold of ${rule.thresholdAltitude.toLocaleString()} ft).`,
            aircraftId: hex,
            callsign: ac.callsign,
            squawk: squawk,
            timestamp: currentTime,
          });
        }
      }
    }
  }

  return triggered;
}
