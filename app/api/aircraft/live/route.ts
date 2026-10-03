import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_QUERY_LOCATION } from '@/lib/providers/positions/airplanesLive';
import { validateSpatialQuery } from '@/lib/providers/positions/validation';
import { getCacheService, globalCoalescer, globalRateLimiter } from '@/lib/cache';
import { getDefaultFlightProvider } from '@/lib/providers/chainedFlightProvider';
import { AirplanesLiveProvider } from '@/lib/providers/airplanesLiveProvider';
import { AdsbLolProvider } from '@/lib/providers/adsbLolProvider';
import { AdsbFiProvider } from '@/lib/providers/adsbFiProvider';
import { OpenSkyProvider } from '@/lib/providers/openSkyProvider';
import { SampleTrafficProvider } from '@/lib/providers/sampleTrafficProvider';
import type { Bounds, AircraftState, FlightProvider } from '@/lib/providers/types';
import { quantizeBounds, getBoundsCacheKey } from '@/lib/providers/quantization';
import { toAircraftPosition } from '@/lib/providers/types';

const POSITIVE_CACHE_TTL_SEC = 5; // 5 seconds TTL
const NEGATIVE_CACHE_TTL_SEC = 3;

interface CachedPayload {
  success: boolean;
  aircraft: (ReturnType<typeof toAircraftPosition> & { lat: number; lon: number })[];
  states: AircraftState[];
  totalFound: number;
  timestamp: number;
  provider: string;
  isSampleData?: boolean;
  cached?: boolean;
  degraded?: boolean;
  error?: string;
  warning?: string;
}

export async function GET(request: NextRequest) {
  // 1. IP Rate Limiting (240 req / minute per client on live map feed)
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateCheck = globalRateLimiter.check(`${clientIp}:live`, 240, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded (240 requests/minute). Please slow down.',
        timestamp: Date.now(),
        aircraft: [],
        states: [],
        totalFound: 0,
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

  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get('provider');
  const boundsParam = searchParams.get('bounds');
  const zoomParam = searchParams.get('zoom');
  const zoom = zoomParam ? parseFloat(zoomParam) : 10;

  let bounds: Bounds;

  if (boundsParam) {
    const parts = boundsParam.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      bounds = {
        south: Math.max(-90, parts[0]),
        west: Math.max(-180, parts[1]),
        north: Math.min(90, parts[2]),
        east: Math.min(180, parts[3]),
        zoom,
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bounds parameter. Format must be south,west,north,east in decimal degrees.',
          timestamp: Date.now(),
          aircraft: [],
          states: [],
          totalFound: 0,
        },
        { status: 400 }
      );
    }
  } else {
    // Legacy lat/lon/radius support
    const rawLat = searchParams.get('lat');
    const rawLon = searchParams.get('lon');
    const rawRadius = searchParams.get('radius');

    const validation = validateSpatialQuery(
      rawLat,
      rawLon,
      rawRadius,
      DEFAULT_QUERY_LOCATION.lat,
      DEFAULT_QUERY_LOCATION.lon,
      DEFAULT_QUERY_LOCATION.radiusNm
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          timestamp: Date.now(),
          aircraft: [],
          states: [],
          totalFound: 0,
          provider: 'aeroloom-validator',
        },
        { status: 400 }
      );
    }

    const { lat, lon, radiusNm } = validation;
    const latDelta = radiusNm / 60;
    const lonDelta = radiusNm / (60 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));

    bounds = {
      south: Math.max(-90, lat - latDelta),
      north: Math.min(90, lat + latDelta),
      west: Math.max(-180, lon - lonDelta),
      east: Math.min(180, lon + lonDelta),
      zoom,
    };
  }

  // Explicit sample/demo mode requested
  const isExplicitSampleRequested =
    providerParam === 'sample' ||
    providerParam === 'demo' ||
    searchParams.get('sample') === '1' ||
    searchParams.get('sample') === 'true';

  if (isExplicitSampleRequested) {
    const sampleProvider = new SampleTrafficProvider();
    const states = await sampleProvider.getAircraftInBounds(bounds);
    const reqTime = Date.now();
    const legacyAircraft = states.map((s) => ({
      ...toAircraftPosition(s),
      lat: s.lat,
      lon: s.lon,
    }));

    return NextResponse.json({
      success: true,
      states,
      aircraft: legacyAircraft,
      totalFound: states.length,
      timestamp: reqTime,
      provider: 'sample-dev-traffic',
      isSampleData: true,
    });
  }

  // 2. Quantize bounds for shared cache keys among nearby users
  const quantized = quantizeBounds(bounds, zoom);
  const cacheKey = `live_${providerParam || 'auto'}_${getBoundsCacheKey(quantized, zoom)}`;
  const cache = getCacheService();
  const now = Date.now();

  // 3. Check Cache
  const cachedData = await cache.get<CachedPayload>(cacheKey);
  if (cachedData && cachedData.success) {
    return NextResponse.json(
      {
        ...cachedData,
        cached: true,
        cacheAgeMs: now - cachedData.timestamp,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
          'X-Data-Source': cachedData.provider || 'aeroloom-cache',
          'X-RateLimit-Remaining': rateCheck.remaining.toString(),
        },
      }
    );
  }

  // 4. Request Coalescing
  try {
    const payload = await globalCoalescer.execute<CachedPayload>(cacheKey, async () => {
      let provider: FlightProvider;
      if (providerParam === 'airplanes.live') {
        provider = new AirplanesLiveProvider();
      } else if (providerParam === 'adsb.fi') {
        provider = new AdsbFiProvider();
      } else if (providerParam === 'adsb-open' || providerParam === 'adsb.lol') {
        provider = new AdsbLolProvider();
      } else if (providerParam === 'opensky' || providerParam === 'opensky-network') {
        provider = new OpenSkyProvider();
      } else {
        provider = getDefaultFlightProvider();
      }

      const states = await provider.getAircraftInBounds(quantized);
      const reqTime = Date.now();

      // Compute ageSeconds for each aircraft
      const enrichedStates = states.map((s) => ({
        ...s,
        ageSeconds: Math.max(0, Math.round((reqTime - s.updatedAt) / 1000)),
      }));

      // Backward compatible aircraft list with both lat/lon and latitude/longitude
      const legacyAircraft = enrichedStates.map((s) => ({
        ...toAircraftPosition(s),
        lat: s.lat,
        lon: s.lon,
      }));

      const result: CachedPayload = {
        success: true,
        states: enrichedStates,
        aircraft: legacyAircraft,
        totalFound: enrichedStates.length,
        timestamp: reqTime,
        provider: provider.name,
        isSampleData: false,
      };

      await cache.set(cacheKey, result, POSITIVE_CACHE_TTL_SEC);
      return result;
    });

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        'X-Data-Source': payload.provider,
        'X-RateLimit-Remaining': rateCheck.remaining.toString(),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Upstream provider failure';

    // 5. Stale cached fallback: if we have any stale cached data for this key, return it with degraded: true
    if (cachedData) {
      return NextResponse.json(
        {
          ...cachedData,
          cached: true,
          degraded: true,
          warning: 'Live feed delayed; serving last-known cached airspace snapshot',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'X-Aeroloom-Degraded': 'true',
          },
        }
      );
    }

    // 6. Safe emergency synthetic fallback: if all upstream feeds fail and no cache is available, provide simulated traffic with degraded flag
    try {
      const sampleProvider = new SampleTrafficProvider();
      const states = await sampleProvider.getAircraftInBounds(bounds);
      const reqTime = Date.now();
      const legacyAircraft = states.map((s) => ({
        ...toAircraftPosition(s),
        lat: s.lat,
        lon: s.lon,
      }));

      const emergencyPayload: CachedPayload = {
        success: true,
        states,
        aircraft: legacyAircraft,
        totalFound: states.length,
        timestamp: reqTime,
        provider: 'sample-emergency-fallback',
        isSampleData: true,
        degraded: true,
        warning: 'Live telemetry delayed; displaying estimated airspace sector traffic',
      };

      await cache.set(cacheKey, emergencyPayload, POSITIVE_CACHE_TTL_SEC);

      return NextResponse.json(emergencyPayload, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'X-Aeroloom-Degraded': 'true',
        },
      });
    } catch {
      // Fall through to 502 error payload if sample generation also fails
    }

    // Negative cache to protect upstream
    const failedPayload: CachedPayload = {
      success: false,
      aircraft: [],
      states: [],
      totalFound: 0,
      timestamp: now,
      provider: 'upstream-failed',
      error: errorMsg,
      degraded: true,
    };
    await cache.set(cacheKey, failedPayload, NEGATIVE_CACHE_TTL_SEC);

    return NextResponse.json(failedPayload, {
      status: 502,
      headers: {
        'Cache-Control': 'no-store',
        'X-Aeroloom-Degraded': 'true',
      },
    });
  }
}
