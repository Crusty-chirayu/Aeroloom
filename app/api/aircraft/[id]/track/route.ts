import { NextRequest, NextResponse } from 'next/server';
import { getDefaultFlightProvider } from '@/lib/providers/chainedFlightProvider';
import { getCacheService, globalCoalescer, globalRateLimiter } from '@/lib/cache';
import type { TrackPoint } from '@/lib/providers/types';

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

  const rateCheck = globalRateLimiter.check(`${clientIp}:track`, 180, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded (180 requests/minute). Please slow down.',
        track: [],
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
  const hex = (id || '').trim().toLowerCase();

  if (!hex || !/^[0-9a-f]{1,6}$/i.test(hex)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid aircraft 24-bit hex identifier',
        track: [],
        timestamp: Date.now(),
      },
      { status: 400 }
    );
  }

  const cacheKey = `track_${hex}`;
  const cache = getCacheService();

  const cached = await cache.get<{ success: boolean; track: TrackPoint[]; timestamp: number }>(cacheKey);
  if (cached) {
    return NextResponse.json(
      {
        ...cached,
        cached: true,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
          'X-Data-Source': 'aeroloom-cache',
        },
      }
    );
  }

  try {
    const track = await globalCoalescer.execute<TrackPoint[]>(cacheKey, async () => {
      const provider = getDefaultFlightProvider();
      return await provider.getTrack(hex);
    });

    const payload = {
      success: true,
      id: hex,
      track,
      pointCount: track.length,
      hasHistoricalTrail: track.length > 0,
      timestamp: Date.now(),
    };

    // Cache track points for 15 seconds
    await cache.set(cacheKey, payload, 15);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
        'X-Data-Source': 'upstream-telemetry',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch flight track';
    return NextResponse.json(
      {
        success: false,
        id: hex,
        track: [],
        pointCount: 0,
        hasHistoricalTrail: false,
        degraded: true,
        error: errorMsg,
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  }
}
