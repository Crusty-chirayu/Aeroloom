/**
 * Centralized telemetry provider configuration and credentials.
 */

export const AEROLOOM_USER_AGENT =
  process.env.AEROLOOM_USER_AGENT ||
  'Aeroloom/1.0 (+https://github.com/Crusty-chirayu/Aeroloom; contact: chirayujaysawal7@gmail.com)';

export const PROVIDER_TIMEOUT_MS = 8000;
export const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000; // 60 seconds skip on failure

export interface ProviderCredentials {
  airplanesLiveApiKey?: string;
  openSkyClientId?: string;
  openSkyClientSecret?: string;
  openSkyUsername?: string;
  openSkyPassword?: string;
}

export function getProviderCredentials(): ProviderCredentials {
  return {
    airplanesLiveApiKey: process.env.AIRPLANES_LIVE_API_KEY,
    openSkyClientId: process.env.OPENSKY_CLIENT_ID,
    openSkyClientSecret: process.env.OPENSKY_CLIENT_SECRET,
    openSkyUsername: process.env.OPENSKY_USERNAME,
    openSkyPassword: process.env.OPENSKY_PASSWORD,
  };
}
