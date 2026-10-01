import { NextRequest, NextResponse } from 'next/server';
import { getCacheService, globalCoalescer, globalRateLimiter } from '@/lib/cache';

export interface RadarFrame {
  time: number;
  path: string;
  timeUtc: string;
  timeLocal: string;
}

export interface RadarApiResponse {
  success: boolean;
  host: string;
  generated: number;
  frames: RadarFrame[];
  colorScheme: number;
  colorSchemeName: string;
  tileSize: number;
  maxNativeZoom: number;
  tileUrlTemplate: string;
  coverageUrlTemplate: string;
  cached?: boolean;
  degraded?: boolean;
  error?: string;
}

const RAINVIEWER_INDEX_URL = 'https://api.rainviewer.com/public/weather-maps.json';
const CACHE_KEY = 'radar:frames:index';
const CACHE_TTL_SECONDS = 300; // 5 minutes

export async function GET(request: NextRequest) {
  // 1. Rate Limiting Shield (120 req/min)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const rateLimit = globalRateLimiter.check(ip, 120, 60000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please wait a moment before querying radar telemetry again.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimit.resetMs / 1000).toString(),
        },
      }
    );
  }

  const cache = getCacheService();

  // 2. Check Cache
  const cached = await cache.get<RadarApiResponse>(CACHE_KEY);
  if (cached && typeof cached === 'object') {
    return NextResponse.json(
      { ...(cached as RadarApiResponse), cached: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
          'X-Data-Source': 'aeroloom-cache',
        },
      }
    );
  }

  // 3. Fetch Upstream with Coalescing
  try {
    const data = await globalCoalescer.execute<RadarApiResponse>(CACHE_KEY, async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(RAINVIEWER_INDEX_URL, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Aeroloom-Atmospheric-Observatory/2.0 (weather@aeroloom.internal)',
          },
        });

        if (!response.ok) {
          throw new Error(`RainViewer upstream returned HTTP ${response.status}`);
        }

        const raw = await response.json();
        const host = raw.host || 'https://tilecache.rainviewer.com';
        const past = Array.isArray(raw.radar?.past) ? raw.radar.past : [];

        const frames: RadarFrame[] = past.map((f: { time: number; path: string }) => {
          const d = new Date(f.time * 1000);
          return {
            time: f.time,
            path: f.path,
            timeUtc: d.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'UTC',
            }),
            timeLocal: d.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
          };
        });

        // Use Color Scheme 2 (Universal Blue) or 4 (TWC) for clean contrast on #F6F4EE
        const formatted: RadarApiResponse = {
          success: true,
          host,
          generated: raw.generated || Math.floor(Date.now() / 1000),
          frames,
          colorScheme: 2, // Universal Blue
          colorSchemeName: 'Universal Blue (High Contrast)',
          tileSize: 256,
          maxNativeZoom: 7,
          tileUrlTemplate: `${host}{path}/256/{z}/{x}/{y}/2/1_1.png`,
          coverageUrlTemplate: `${host}/v2/coverage/0/256/{z}/{x}/{y}/0/0_0.png`,
        };

        // Cache for 5 minutes
        await cache.set(CACHE_KEY, formatted, CACHE_TTL_SECONDS);
        return formatted;
      } finally {
        clearTimeout(timeoutId);
      }
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        'X-Data-Source': 'upstream-rainviewer',
      },
    });
  } catch (err: unknown) {
    // If upstream fails, check if we have a stale cache
    if (cached && typeof cached === 'object') {
      return NextResponse.json(
        { ...(cached as RadarApiResponse), degraded: true },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30',
            'X-Data-Source': 'stale-cache-degraded',
          },
        }
      );
    }

    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    return NextResponse.json(
      {
        success: false,
        error: 'Radar temporarily unavailable. Convective radar frames could not be retrieved from provider.',
        details: message,
      },
      {
        status: 502,
        headers: {
          'Retry-After': '30',
        },
      }
    );
  }
}
