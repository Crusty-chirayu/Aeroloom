import { CIRCUIT_BREAKER_COOLDOWN_MS } from './config.ts';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface ProviderHealth {
  name: string;
  circuitState: CircuitState;
  lastAttemptTime: number | null;
  lastSuccessTime: number | null;
  lastHttpStatus: number | null;
  lastError: string | null;
  consecutiveFailures: number;
  circuitOpenUntil: number | null;
}

declare global {
  var _aeroloomProviderHealth: Map<string, ProviderHealth> | undefined;
  var _aeroloomStartTime: number | undefined;
}

if (!globalThis._aeroloomStartTime) {
  globalThis._aeroloomStartTime = Date.now();
}

export function getServerStartTime(): number {
  return globalThis._aeroloomStartTime || Date.now();
}

const healthMap: Map<string, ProviderHealth> =
  globalThis._aeroloomProviderHealth ??
  (globalThis._aeroloomProviderHealth = new Map<string, ProviderHealth>());

function getOrCreateHealth(name: string): ProviderHealth {
  let health = healthMap.get(name);
  if (!health) {
    health = {
      name,
      circuitState: 'closed',
      lastAttemptTime: null,
      lastSuccessTime: null,
      lastHttpStatus: null,
      lastError: null,
      consecutiveFailures: 0,
      circuitOpenUntil: null,
    };
    healthMap.set(name, health);
  }
  return health;
}

export function shouldSkipProvider(name: string): boolean {
  const health = getOrCreateHealth(name);
  const now = Date.now();

  if (health.circuitState === 'open') {
    if (health.circuitOpenUntil && now < health.circuitOpenUntil) {
      return true; // Circuit is still open; skip immediately
    }
    // Cooldown elapsed, allow one probe in half-open state
    health.circuitState = 'half-open';
    return false;
  }

  return false;
}

export function recordProviderSuccess(name: string, httpStatus: number = 200): void {
  const health = getOrCreateHealth(name);
  const now = Date.now();
  health.circuitState = 'closed';
  health.lastAttemptTime = now;
  health.lastSuccessTime = now;
  health.lastHttpStatus = httpStatus;
  health.lastError = null;
  health.consecutiveFailures = 0;
  health.circuitOpenUntil = null;
}

export function recordProviderFailure(
  name: string,
  errorMsg: string,
  httpStatus: number | null = null
): void {
  const health = getOrCreateHealth(name);
  const now = Date.now();
  health.lastAttemptTime = now;
  health.lastHttpStatus = httpStatus;
  health.lastError = errorMsg;
  health.consecutiveFailures += 1;

  // Open circuit breaker after 3 consecutive failures, 403 Forbidden, or 429 Too Many Requests
  if (health.consecutiveFailures >= 3 || httpStatus === 403 || httpStatus === 429) {
    health.circuitState = 'open';
    health.circuitOpenUntil = now + CIRCUIT_BREAKER_COOLDOWN_MS;
  }
}

export function getProviderHealth(name: string): ProviderHealth {
  return { ...getOrCreateHealth(name) };
}

export function getAllProviderHealth(): ProviderHealth[] {
  return Array.from(healthMap.values()).map((h) => ({ ...h }));
}

export function resetProviderHealthForTest(): void {
  healthMap.clear();
}
