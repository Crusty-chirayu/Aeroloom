import { NextRequest, NextResponse } from 'next/server';
import { performOmniSearch } from '@/lib/search/searchEngine';
import { getCacheService } from '@/lib/cache';
import type { SearchResults } from '@/lib/providers/types';

export async function GET(request: NextRequest) {
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
