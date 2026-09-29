import { NextRequest, NextResponse } from 'next/server';
import {
  getLiveAircraftPositions,
  fetchAirplanesLivePositions,
  fetchAdsbOpenPositions,
  DEFAULT_QUERY_LOCATION,
} from '@/lib/providers/positions/airplanesLive';
import type { ProviderResponse } from '@/lib/providers/positions/types';
import { enrichAircraftPositions } from '@/lib/providers/enrichment';

// Rate limiting and server-side cache (minimum 6s cache to respect public API rate limits)
interface CacheEntry {
  response: ProviderResponse;
  timestamp: number;
}
const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 6000; // 6 seconds

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get('provider'); // 'airplanes.live' | 'adsb-open' | 'auto'
  const lat = parseFloat(searchParams.get('lat') || '') || DEFAULT_QUERY_LOCATION.lat;
  const lon = parseFloat(searchParams.get('lon') || '') || DEFAULT_QUERY_LOCATION.lon;
  const radiusNm = parseFloat(searchParams.get('radius') || '') || DEFAULT_QUERY_LOCATION.radiusNm;

  const cacheKey = `${providerParam || 'auto'}_${lat.toFixed(2)}_${lon.toFixed(2)}_${radiusNm.toFixed(0)}`;
  const now = Date.now();
  const cached = queryCache.get(cacheKey);

  // If cache is fresh, return cached response
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      {
        ...cached.response,
        cached: true,
        cacheAgeMs: now - cached.timestamp,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  }

  let result: ProviderResponse;

  if (providerParam === 'airplanes.live') {
    result = await fetchAirplanesLivePositions({ lat, lon, radiusNm });
  } else if (providerParam === 'adsb-open') {
    result = await fetchAdsbOpenPositions({ lat, lon, radiusNm });
  } else {
    result = await getLiveAircraftPositions({ lat, lon, radiusNm });
  }

  // Enrich aircraft with authentic metadata, operator details, and verified routes
  if (result.success && result.aircraft.length > 0) {
    result = {
      ...result,
      aircraft: enrichAircraftPositions(result.aircraft),
    };
  }

  if (result.success) {
    queryCache.set(cacheKey, { response: result, timestamp: now });
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
    },
  });
}
