import { NextResponse } from 'next/server';
import { getCacheService } from '@/lib/cache';
import { getDefaultFlightProvider } from '@/lib/providers/chainedFlightProvider';

const START_TIME = Date.now();

export async function GET() {
  const now = Date.now();
  const uptimeSeconds = Math.floor((now - START_TIME) / 1000);
  const cache = getCacheService();

  // Test provider status
  const provider = getDefaultFlightProvider();
  const providerName = provider.name || 'ChainedFlightProvider';

  let telemetryStatus = 'operational';
  try {
    // Light sanity query
    await provider.getAircraftByCallsign('BAW1');
  } catch {
    telemetryStatus = 'degraded';
  }

  const payload = {
    status: 'operational',
    service: 'Aeroloom Aviation Repository API',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds,
    timestamp: now,
    telemetry: {
      provider: providerName,
      status: telemetryStatus,
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

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Service-Status': 'healthy',
    },
  });
}
