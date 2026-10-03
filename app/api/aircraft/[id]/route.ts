import { NextRequest, NextResponse } from 'next/server';
import { getDefaultFlightProvider } from '@/lib/providers/chainedFlightProvider';
import { getCacheService, globalCoalescer, globalRateLimiter } from '@/lib/cache';
import type { AircraftState } from '@/lib/providers/types';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  // IP Rate Limiting (180 req / minute per client on this endpoint)
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateCheck = globalRateLimiter.check(`${clientIp}:aircraft`, 180, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded (180 requests/minute). Please slow down.',
        timestamp: Date.now(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateCheck.resetMs / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const { id } = await context.params;
  const cleanId = (id || '').trim().toUpperCase();

  if (!cleanId || cleanId.length > 12) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid aircraft identifier format',
        timestamp: Date.now(),
      },
      { status: 400 }
    );
  }

  const cacheKey = `aircraft_${cleanId.toLowerCase()}`;
  const cache = getCacheService();

  // Check cache (TTL 6 seconds for hit, 10 seconds for negative lookup)
  const cached = await cache.get<AircraftState | { notFound: boolean }>(cacheKey);
  if (cached) {
    if ('notFound' in cached && cached.notFound) {
      return NextResponse.json(
        {
          success: false,
          error: `Aircraft with callsign or hex '${cleanId}' is not currently tracked as airborne.`,
          airborne: false,
          id: cleanId,
          cached: true,
          timestamp: Date.now(),
        },
        {
          status: 404,
          headers: {
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=15',
            'X-Data-Source': 'aeroloom-cache-neg',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        aircraft: cached as AircraftState,
        cached: true,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=6, stale-while-revalidate=12',
          'X-Data-Source': 'aeroloom-cache',
        },
      }
    );
  }

  try {
    const aircraft = await globalCoalescer.execute<AircraftState | null>(cacheKey, async () => {
      const provider = getDefaultFlightProvider();
      return await provider.getAircraftByCallsign(cleanId);
    });

    if (!aircraft) {
      // Cache negative lookup for 10 seconds to protect upstream providers from polling storms
      await cache.set(cacheKey, { notFound: true }, 10);

      return NextResponse.json(
        {
          success: false,
          error: `Aircraft with callsign or hex '${cleanId}' is not currently tracked as airborne.`,
          airborne: false,
          id: cleanId,
          timestamp: Date.now(),
        },
        { status: 404 }
      );
    }

    // Cache valid aircraft for 6 seconds
    await cache.set(cacheKey, aircraft, 6);

    return NextResponse.json(
      {
        success: true,
        aircraft,
        cached: false,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=6, stale-while-revalidate=12',
          'X-Data-Source': aircraft.source || 'chained-failover',
        },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Telemetry lookup failed';
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
