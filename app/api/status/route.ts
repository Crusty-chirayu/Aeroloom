import { NextResponse } from 'next/server';
import { getCacheService } from '@/lib/cache';
import {
  getServerStartTime,
  getAllProviderHealth,
  recordProviderSuccess,
  recordProviderFailure,
} from '@/lib/providers/healthTracker';
import { AdsbFiProvider } from '@/lib/providers/adsbFiProvider';
import { AdsbLolProvider } from '@/lib/providers/adsbLolProvider';
import { AirplanesLiveProvider } from '@/lib/providers/airplanesLiveProvider';
import { OpenSkyProvider } from '@/lib/providers/openSkyProvider';

let lastProbeTime = 0;
const PROBE_CACHE_MS = 30_000;

async function probeProvidersIfStale() {
  const now = Date.now();
  if (now - lastProbeTime < PROBE_CACHE_MS) {
    return;
  }
  lastProbeTime = now;

  const providers = [
    new AdsbFiProvider(3000),
    new AdsbLolProvider(3000),
    new AirplanesLiveProvider(3000),
    new OpenSkyProvider(3000),
  ];

  await Promise.allSettled(
    providers.map(async (p) => {
      try {
        await p.getAircraftByCallsign('SWA1');
        recordProviderSuccess(p.name, 200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Probe failure';
        recordProviderFailure(p.name, msg, null);
      }
    })
  );
}

export async function GET() {
  await probeProvidersIfStale();

  const now = Date.now();
  const uptimeSeconds = Math.max(1, Math.floor((now - getServerStartTime()) / 1000));
  const cache = getCacheService();

  const healthList = getAllProviderHealth();
  const providerMap: Record<string, {
    status: 'operational' | 'degraded' | 'open';
    circuitState: string;
    lastHttpStatus: number | null;
    lastSuccessTime: number | null;
    lastError: string | null;
  }> = {};

  let operationalCount = 0;
  let totalProviders = 0;

  for (const h of healthList) {
    totalProviders++;
    const isOk = h.circuitState === 'closed';
    if (isOk) operationalCount++;

    providerMap[h.name] = {
      status: isOk ? 'operational' : h.circuitState === 'half-open' ? 'degraded' : 'open',
      circuitState: h.circuitState,
      lastHttpStatus: h.lastHttpStatus,
      lastSuccessTime: h.lastSuccessTime,
      lastError: h.lastError,
    };
  }

  let overallStatus: 'operational' | 'degraded' | 'down' = 'operational';
  if (operationalCount === 0 && totalProviders > 0) {
    overallStatus = 'down';
  } else if (operationalCount < totalProviders) {
    overallStatus = 'degraded';
  }

  const payload = {
    status: overallStatus,
    service: 'Aeroloom Aviation Repository API',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds,
    timestamp: new Date(now).toISOString(),
    providers: {
      primaryAdsb: providerMap['adsb.fi']?.status || 'operational',
      failoverAdsb: providerMap['adsb.lol']?.status || 'operational',
      airplanesLive: providerMap['airplanes.live']?.status || 'open',
      openSky: providerMap['opensky-network']?.status || 'operational',
      weather: 'operational',
      radar: 'operational',
      details: providerMap,
    },
    cache: {
      type: cache.constructor.name || 'MemoryCacheService',
      status: 'active',
    },
    rateLimiting: {
      status: 'active',
      windowSeconds: 60,
      limitPerMinute: 120,
    },
  };

  const httpCode = overallStatus === 'down' ? 503 : 200;

  return NextResponse.json(payload, {
    status: httpCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Service-Status': overallStatus,
    },
  });
}
