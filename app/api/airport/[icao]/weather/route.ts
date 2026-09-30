import { NextRequest, NextResponse } from 'next/server';
import { getCacheService, globalCoalescer } from '@/lib/cache';
import {
  normalizeAviationWeatherReport,
  parseRawMetarString,
  type AviationWeatherGovMetar,
} from '@/lib/weather/metarDecoder';
import type { WeatherReport } from '@/lib/providers/types';

interface RouteContext {
  params: Promise<{
    icao: string;
  }>;
}

const USER_AGENT = 'Aeroloom-FlightTracker/0.1.0 (weather@aeroloom.internal)';

export async function GET(_request: NextRequest, context: RouteContext) {
  const { icao } = await context.params;
  const cleanIcao = (icao || '').trim().toUpperCase();

  if (!cleanIcao || !/^[A-Z0-9]{3,4}$/.test(cleanIcao)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid airport ICAO code. Must be 3 or 4 alphanumeric characters (e.g. KJFK, EGLL).',
        timestamp: Date.now(),
      },
      { status: 400 }
    );
  }

  const cacheKey = `weather_${cleanIcao}`;
  const cache = getCacheService();

  const cached = await cache.get<WeatherReport>(cacheKey);
  if (cached) {
    return NextResponse.json(
      {
        success: true,
        weather: cached,
        cached: true,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Data-Source': 'aeroloom-cache',
        },
      }
    );
  }

  try {
    const report = await globalCoalescer.execute<WeatherReport>(cacheKey, async () => {
      // 1. Fetch structured JSON from aviationweather.gov
      const url = `https://aviationweather.gov/api/data/metar?ids=${cleanIcao}&format=json`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json, text/plain',
          'User-Agent': USER_AGENT,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`aviationweather.gov returned HTTP ${res.status}`);
      }

      const text = await res.text();
      let records: AviationWeatherGovMetar[] = [];

      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          records = parsed;
        } else if (parsed && typeof parsed === 'object') {
          records = [parsed];
        }
      } catch {
        // Fallback: If returned raw string rather than JSON
        if (text && text.trim().length > 0) {
          return parseRawMetarString(cleanIcao, text);
        }
      }

      if (records.length === 0 || !records[0]) {
        // Honest empty state when no report is on file
        return {
          icao: cleanIcao,
          rawMetar: `${cleanIcao} NO METAR AVAILABLE`,
          flightCategory: 'VFR',
          wind: { directionDeg: 0, speedKt: 0 },
          visibilitySm: 10,
          summary: 'No active METAR observation on file for this station.',
        };
      }

      return normalizeAviationWeatherReport(cleanIcao, records[0]);
    });

    // Cache weather report for 60 seconds
    await cache.set(cacheKey, report, 60);

    return NextResponse.json(
      {
        success: true,
        weather: report,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Data-Source': 'aviationweather.gov',
        },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Weather service unavailable';
    return NextResponse.json(
      {
        success: false,
        icao: cleanIcao,
        error: errorMsg,
        degraded: true,
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  }
}
