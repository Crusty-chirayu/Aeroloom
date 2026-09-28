import { NextRequest, NextResponse } from 'next/server';
import {
  getLiveAircraftPositions,
  fetchAirplanesLivePositions,
  fetchAdsbOpenPositions,
  DEFAULT_QUERY_LOCATION,
} from '@/lib/providers/positions/airplanesLive';
import type { ProviderResponse } from '@/lib/providers/positions/types';

// Rate limiting and server-side cache (minimum 5s cache to respect public API rate limits)
let cachedResponse: ProviderResponse | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 6000; // 6 seconds

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get('provider'); // 'airplanes.live' | 'adsb-open' | 'auto'
  const lat = parseFloat(searchParams.get('lat') || '') || DEFAULT_QUERY_LOCATION.lat;
  const lon = parseFloat(searchParams.get('lon') || '') || DEFAULT_QUERY_LOCATION.lon;
  const radiusNm = parseFloat(searchParams.get('radius') || '') || DEFAULT_QUERY_LOCATION.radiusNm;

  const now = Date.now();

  // If cache is fresh and query parameters match default, return cached response
  if (!providerParam && cachedResponse && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json(
      {
        ...cachedResponse,
        cached: true,
        cacheAgeMs: now - lastFetchTime,
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

  if (result.success) {
    cachedResponse = result;
    lastFetchTime = now;
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
    },
  });
}
