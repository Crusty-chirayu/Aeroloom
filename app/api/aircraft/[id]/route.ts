import { NextRequest, NextResponse } from 'next/server';
import { getDefaultFlightProvider } from '@/lib/providers/chainedFlightProvider';
import { getCacheService, globalCoalescer } from '@/lib/cache';
import type { AircraftState } from '@/lib/providers/types';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
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

  // Check cache (TTL 6 seconds)
  const cached = await cache.get<AircraftState>(cacheKey);
  if (cached) {
    return NextResponse.json(
      {
        success: true,
        aircraft: cached,
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
