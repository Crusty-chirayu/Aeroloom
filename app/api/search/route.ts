import { NextRequest, NextResponse } from 'next/server';
import { performOmniSearch } from '@/lib/search/searchEngine';
import { getCacheService, globalRateLimiter } from '@/lib/cache';
import type { SearchResults } from '@/lib/providers/types';

export async function GET(request: NextRequest) {
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
        flights: [],
        airports: [],
        airlines: [],
        total: 0,
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

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({
      success: true,
      query: '',
      flights: [],
      airports: [],
      airlines: [],
      total: 0,
      timestamp: Date.now(),
    });
  }

  const cacheKey = `search_${q.toLowerCase()}`;
  const cache = getCacheService();

  const cached = await cache.get<SearchResults>(cacheKey);
  if (cached) {
    return NextResponse.json({
      success: true,
      ...cached,
      cached: true,
      timestamp: Date.now(),
    });
  }

  try {
    const results = await performOmniSearch(q, 8);
    // Cache search results for 10 seconds
    await cache.set(cacheKey, results, 10);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Search processing error';
    return NextResponse.json(
      {
        success: false,
        query: q,
        flights: [],
        airports: [],
        airlines: [],
        total: 0,
        error: errorMsg,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
