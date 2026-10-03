import { NextRequest, NextResponse } from 'next/server';
import { getAirportByIcao, getAirportByIata, calculateDistanceNm } from '@/lib/airports/airportData';
import { getDefaultFlightProvider } from '@/lib/providers/chainedFlightProvider';
import { getCacheService, globalCoalescer, globalRateLimiter } from '@/lib/cache';
import type { AircraftState, Bounds } from '@/lib/providers/types';

interface RouteContext {
  params: Promise<{
    icao: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  // IP Rate Limiting (120 req / minute per client)
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateCheck = globalRateLimiter.check(clientIp, 120, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded (120 requests/minute). Please slow down.',
        aircraft: [],
        totalFound: 0,
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

  const { icao } = await context.params;
  const cleanCode = (icao || '').trim().toUpperCase();

  const airport = getAirportByIcao(cleanCode) || getAirportByIata(cleanCode);
  if (!airport) {
    return NextResponse.json(
      {
        success: false,
        error: `Airport "${cleanCode}" not found in database.`,
        aircraft: [],
        totalFound: 0,
        timestamp: Date.now(),
      },
      { status: 404 }
    );
  }

  const cacheKey = `traffic_${airport.icao}`;
  const cache = getCacheService();

  const cached = await cache.get<{ success: boolean; aircraft: AircraftState[]; totalFound: number }>(cacheKey);
  if (cached && cached.success) {
    return NextResponse.json(
      {
        ...cached,
        airport,
        cached: true,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
          'X-Data-Source': 'aeroloom-cache',
        },
      }
    );
  }

  try {
    const aircraft = await globalCoalescer.execute<AircraftState[]>(cacheKey, async () => {
      const radiusNm = 35;
      const latDelta = radiusNm / 60;
      const lonDelta = radiusNm / (60 * Math.max(0.1, Math.cos((airport.latitude * Math.PI) / 180)));

      const bounds: Bounds = {
        south: airport.latitude - latDelta,
        north: airport.latitude + latDelta,
        west: airport.longitude - lonDelta,
        east: airport.longitude + lonDelta,
        zoom: 10,
      };

      const provider = getDefaultFlightProvider();
      const list = await provider.getAircraftInBounds(bounds);

      // Add distance to each aircraft and sort nearest to airport
      return list
        .map((ac) => ({
          ...ac,
          distanceToAirportNm: calculateDistanceNm(airport.latitude, airport.longitude, ac.lat, ac.lon),
        }))
        .sort((a, b) => (a.distanceToAirportNm ?? 0) - (b.distanceToAirportNm ?? 0));
    });

    const payload = {
      success: true,
      airport,
      aircraft,
      totalFound: aircraft.length,
      radiusNm: 35,
      timestamp: Date.now(),
    };

    await cache.set(cacheKey, payload, 5);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        'X-Data-Source': 'upstream-adsb',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unable to query airport airspace';
    return NextResponse.json(
      {
        success: false,
        airport,
        aircraft: cached?.aircraft || [],
        totalFound: cached?.totalFound || 0,
        degraded: true,
        error: errorMsg,
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  }
}
