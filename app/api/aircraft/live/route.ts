import { NextRequest, NextResponse } from 'next/server';
import {
  getLiveAircraftPositions,
  fetchAirplanesLivePositions,
  fetchAdsbOpenPositions,
  DEFAULT_QUERY_LOCATION,
} from '@/lib/providers/positions/airplanesLive';
import type { ProviderResponse } from '@/lib/providers/positions/types';
import { enrichAircraftPositions } from '@/lib/providers/enrichment';

import {
  validateSpatialQuery,
} from '@/lib/providers/positions/validation';

// Rate limiting and server-side cache with bounded size
interface CacheEntry {
  response: ProviderResponse;
  timestamp: number;
  isError?: boolean;
}

const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 6000; // 6 seconds positive cache
const ERROR_CACHE_TTL_MS = 3000; // 3 seconds negative cache for upstream failure circuit-breaking
const MAX_CACHE_ENTRIES = 120;

function pruneCache(now: number) {
  if (queryCache.size <= MAX_CACHE_ENTRIES) return;
  // Remove expired entries first
  for (const [key, entry] of queryCache.entries()) {
    const ttl = entry.isError ? ERROR_CACHE_TTL_MS : CACHE_TTL_MS;
    if (now - entry.timestamp > ttl) {
      queryCache.delete(key);
    }
  }
  // If still oversized, drop oldest entries
  if (queryCache.size > MAX_CACHE_ENTRIES) {
    const keysToDelete = Array.from(queryCache.keys()).slice(0, 30);
    for (const key of keysToDelete) {
      queryCache.delete(key);
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get('provider'); // 'airplanes.live' | 'adsb-open' | 'auto'

  const rawLat = searchParams.get('lat');
  const rawLon = searchParams.get('lon');
  const rawRadius = searchParams.get('radius');

  // Strict WGS84 and bounds validation via shared validator
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
        totalFound: 0,
        provider: 'aeroloom-validator',
      },
      { status: 400 }
    );
  }

  const { lat, lon, radiusNm } = validation;

  const cacheKey = `${providerParam || 'auto'}_${lat.toFixed(2)}_${lon.toFixed(2)}_${radiusNm.toFixed(0)}`;
  const now = Date.now();
  pruneCache(now);

  const cached = queryCache.get(cacheKey);

  // If positive cache is fresh, return cached response
  if (cached && !cached.isError && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      {
        ...cached.response,
        cached: true,
        cacheAgeMs: now - cached.timestamp,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
          'X-Data-Source': cached.response.provider || 'aeroloom-cache',
          'X-Aeroloom-Version': '0.1.0',
        },
      }
    );
  }

  // If negative cache is fresh, circuit-break upstream hammering
  if (cached && cached.isError && now - cached.timestamp < ERROR_CACHE_TTL_MS) {
    return NextResponse.json(
      {
        ...cached.response,
        cached: true,
        circuitBreakerActive: true,
        cacheAgeMs: now - cached.timestamp,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '3',
          'X-Aeroloom-CircuitBreaker': 'tripped',
        },
      }
    );
  }

  let result: ProviderResponse;

  try {
    if (providerParam === 'airplanes.live') {
      result = await fetchAirplanesLivePositions({ lat, lon, radiusNm });
    } else if (providerParam === 'adsb-open') {
      result = await fetchAdsbOpenPositions({ lat, lon, radiusNm });
    } else {
      result = await getLiveAircraftPositions({ lat, lon, radiusNm });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown upstream error';
    result = {
      success: false,
      aircraft: [],
      timestamp: now,
      totalFound: 0,
      provider: 'upstream-failed',
      error: errorMsg,
    };
  }

  // Enrich aircraft with authentic metadata, operator details, and verified routes
  if (result.success && result.aircraft.length > 0) {
    result = {
      ...result,
      aircraft: enrichAircraftPositions(result.aircraft),
    };
  }

  if (result.success) {
    queryCache.set(cacheKey, { response: result, timestamp: now, isError: false });
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        'X-Data-Source': result.provider || 'adsb-composite',
        'X-Aeroloom-Version': '0.1.0',
      },
    });
  } else {
    // Record negative cache entry to protect upstream
    queryCache.set(cacheKey, { response: result, timestamp: now, isError: true });
    return NextResponse.json(result, {
      status: 502,
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Source': result.provider || 'upstream-failed',
        'X-Aeroloom-Version': '0.1.0',
      },
    });
  }
}
