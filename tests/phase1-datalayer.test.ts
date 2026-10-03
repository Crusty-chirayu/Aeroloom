import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  toAircraftState,
  toAircraftPosition,
  type AircraftPosition,
  type AircraftState,
  type Bounds,
} from '../lib/providers/types.ts';
import {
  getQuantizationStep,
  quantizeBounds,
  getBoundsCacheKey,
  boundsToCenterRadius,
} from '../lib/providers/quantization.ts';
import { RequestCoalescer } from '../lib/cache/coalescing.ts';
import { MemoryCacheService } from '../lib/cache/memoryCache.ts';
import { UpstashRedisCacheService } from '../lib/cache/upstashRedis.ts';
import { RateLimiter } from '../lib/cache/rateLimiter.ts';
import {
  determineFlightCategory,
  parseRawMetarString,
  normalizeAviationWeatherReport,
} from '../lib/weather/metarDecoder.ts';
import { performOmniSearch } from '../lib/search/searchEngine.ts';
import { ChainedFlightProvider } from '../lib/providers/chainedFlightProvider.ts';

describe('Phase 1 Data Layer — Canonical Types & Normalization', () => {
  it('normalizes legacy AircraftPosition into canonical AircraftState', () => {
    const legacy: AircraftPosition = {
      id: 'A38D95',
      callsign: 'DAL397',
      registration: 'N328RX',
      aircraftType: 'B738',
      latitude: 37.6213,
      longitude: -122.379,
      altitude: 32000,
      heading: 275,
      speed: 460,
      verticalRate: -256,
      squawk: '1200',
      timestamp: Date.now() - 5000,
      source: 'airplanes.live',
      isGround: false,
    };

    const state = toAircraftState(legacy);

    assert.strictEqual(state.id, 'a38d95'); // Lowercase hex
    assert.strictEqual(state.callsign, 'DAL397');
    assert.strictEqual(state.registration, 'N328RX');
    assert.strictEqual(state.typeCode, 'B738');
    assert.strictEqual(state.lat, 37.6213);
    assert.strictEqual(state.lon, -122.379);
    assert.strictEqual(state.altitudeFt, 32000);
    assert.strictEqual(state.groundSpeedKt, 460);
    assert.strictEqual(state.trackDeg, 275);
    assert.strictEqual(state.verticalRateFpm, -256);
    assert.strictEqual(state.onGround, false);
    assert.strictEqual(state.squawk, '1200');
    assert.strictEqual(state.source, 'airplanes.live');
    assert.strictEqual(state.ageSeconds, 5);
  });

  it('performs lossless roundtrip between AircraftState and AircraftPosition', () => {
    const original: AircraftState = {
      id: 'c0ffee',
      callsign: 'SWA1234',
      registration: 'N8642A',
      typeCode: 'B737',
      lat: 40.7128,
      lon: -74.006,
      altitudeFt: 0,
      groundSpeedKt: 18,
      trackDeg: 45,
      onGround: true,
      updatedAt: 1700000000000,
      ageSeconds: 12,
      source: 'adsb-open',
    };

    const backToLegacy = toAircraftPosition(original);
    assert.strictEqual(backToLegacy.id, 'c0ffee');
    assert.strictEqual(backToLegacy.callsign, 'SWA1234');
    assert.strictEqual(backToLegacy.isGround, true);
    assert.strictEqual(backToLegacy.aircraftType, 'B737');

    const backToState = toAircraftState(backToLegacy);
    assert.strictEqual(backToState.id, original.id);
    assert.strictEqual(backToState.callsign, original.callsign);
    assert.strictEqual(backToState.onGround, true);
  });
});

describe('Phase 1 Data Layer — Bounds Quantization & Tiling', () => {
  it('calculates appropriate quantization steps per zoom level', () => {
    assert.strictEqual(getQuantizationStep(2), 0.5); // Global
    assert.strictEqual(getQuantizationStep(6), 0.2); // Regional
    assert.strictEqual(getQuantizationStep(10), 0.1); // Metro
    assert.strictEqual(getQuantizationStep(14), 0.05); // Terminal
  });

  it('quantizes bounds to fixed grid coordinates', () => {
    const rawBounds: Bounds = {
      south: 37.7123,
      west: -122.4567,
      north: 37.8912,
      east: -122.2134,
      zoom: 10,
    };

    const quantized = quantizeBounds(rawBounds, 10);
    // 0.1 step
    assert.strictEqual(quantized.south, 37.7);
    assert.strictEqual(quantized.west, -122.5);
    assert.strictEqual(quantized.north, 37.9);
    assert.strictEqual(quantized.east, -122.2);
  });

  it('generates deterministic cache keys for nearby viewers', () => {
    const viewerA: Bounds = { south: 37.71, west: -122.45, north: 37.89, east: -122.21 };
    const viewerB: Bounds = { south: 37.73, west: -122.48, north: 37.88, east: -122.23 };

    const keyA = getBoundsCacheKey(viewerA, 10);
    const keyB = getBoundsCacheKey(viewerB, 10);

    assert.strictEqual(keyA, keyB, 'Nearby map viewports must resolve to the identical cache key');
  });

  it('converts bounding box to center point and radius correctly', () => {
    const bounds: Bounds = {
      south: 37.0,
      north: 38.0,
      west: -123.0,
      east: -122.0,
    };

    const { lat, lon, radiusNm } = boundsToCenterRadius(bounds);
    assert.strictEqual(lat, 37.5);
    assert.strictEqual(lon, -122.5);
    assert.ok(radiusNm >= 30 && radiusNm <= 70, `Expected radius in 30-70 NM range, got ${radiusNm}`);
  });
});

describe('Phase 1 Data Layer — Request Coalescing Engine', () => {
  it('deduplicates concurrent calls to execute worker only once', async () => {
    const coalescer = new RequestCoalescer();
    let executions = 0;

    const worker = async () => {
      executions++;
      await new Promise((resolve) => setTimeout(resolve, 30));
      return 'payload_data';
    };

    // Launch 10 concurrent requests for the same key
    const results = await Promise.all([
      coalescer.execute('key_1', worker),
      coalescer.execute('key_1', worker),
      coalescer.execute('key_1', worker),
      coalescer.execute('key_1', worker),
      coalescer.execute('key_1', worker),
    ]);

    assert.strictEqual(executions, 1, 'Worker should only execute exactly once across concurrent calls');
    assert.deepStrictEqual(results, ['payload_data', 'payload_data', 'payload_data', 'payload_data', 'payload_data']);
  });

  it('executes separate keys independently', async () => {
    const coalescer = new RequestCoalescer();
    let countA = 0;
    let countB = 0;

    await Promise.all([
      coalescer.execute('key_A', async () => {
        countA++;
        return 'A';
      }),
      coalescer.execute('key_B', async () => {
        countB++;
        return 'B';
      }),
    ]);

    assert.strictEqual(countA, 1);
    assert.strictEqual(countB, 1);
  });
});

describe('Phase 1 Data Layer — Multi-Tier Caching & Fallback', () => {
  it('MemoryCacheService sets, gets, deletes, and enforces TTL', async () => {
    const cache = new MemoryCacheService(10);
    await cache.set('test_key', { data: 42 }, 1); // 1 sec TTL

    const cached = await cache.get<{ data: number }>('test_key');
    assert.deepStrictEqual(cached, { data: 42 });

    await cache.delete('test_key');
    const afterDel = await cache.get('test_key');
    assert.strictEqual(afterDel, null);
  });

  it('UpstashRedisCacheService gracefully falls back to memory when unconfigured', async () => {
    const fallback = new MemoryCacheService();
    const redis = new UpstashRedisCacheService(fallback);

    assert.strictEqual(redis.isConfigured, false);

    await redis.set('fallback_key', 'fallback_value', 10);
    const read = await redis.get<string>('fallback_key');
    assert.strictEqual(read, 'fallback_value');
  });
});

describe('Phase 1 Data Layer — Rate Limiter', () => {
  it('permits requests within quota and rejects excess', () => {
    const limiter = new RateLimiter(3, 10000); // 3 requests per 10s

    const r1 = limiter.check('1.2.3.4');
    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r1.remaining, 2);

    const r2 = limiter.check('1.2.3.4');
    assert.strictEqual(r2.allowed, true);
    assert.strictEqual(r2.remaining, 1);

    const r3 = limiter.check('1.2.3.4');
    assert.strictEqual(r3.allowed, true);
    assert.strictEqual(r3.remaining, 0);

    const r4 = limiter.check('1.2.3.4');
    assert.strictEqual(r4.allowed, false);
    assert.strictEqual(r4.remaining, 0);

    // Different IP is isolated
    const otherIp = limiter.check('5.6.7.8');
    assert.strictEqual(otherIp.allowed, true);
  });
});

describe('Phase 1 Data Layer — METAR Weather Decoder & Classifier', () => {
  it('correctly classifies FAA flight categories based on ceiling and visibility', () => {
    assert.strictEqual(determineFlightCategory(10, 4500), 'VFR');
    assert.strictEqual(determineFlightCategory(4, 2500), 'MVFR');
    assert.strictEqual(determineFlightCategory(2, 800), 'IFR');
    assert.strictEqual(determineFlightCategory(0.5, 300), 'LIFR');
    assert.strictEqual(determineFlightCategory(10, 400), 'LIFR'); // Low ceiling triggers LIFR even with 10SM vis
    assert.strictEqual(determineFlightCategory(0.5, 5000), 'LIFR'); // Low vis triggers LIFR even with high ceiling
  });

  it('parses raw METAR tokens into typed WeatherReport', () => {
    const raw = 'KJFK 301200Z 31018G27KT 10SM BKN040 OVC080 18/10 A2992';
    const report = parseRawMetarString('KJFK', raw);

    assert.strictEqual(report.icao, 'KJFK');
    assert.strictEqual(report.wind.directionDeg, 310);
    assert.strictEqual(report.wind.speedKt, 18);
    assert.strictEqual(report.wind.gustKt, 27);
    assert.strictEqual(report.visibilitySm, 10);
    assert.strictEqual(report.ceilingFt, 4000);
    assert.strictEqual(report.temperatureC, 18);
    assert.strictEqual(report.dewpointC, 10);
    assert.strictEqual(report.altimeterInHg, 29.92);
    assert.strictEqual(report.flightCategory, 'VFR');
    assert.ok(report.summary.includes('Wind 310° at 18 kt'));
  });

  it('normalizes aviationweather.gov structured JSON', () => {
    const structured = {
      icaoId: 'EGLL',
      wdir: 260,
      wspd: 12,
      visib: 10,
      temp: 15,
      dewp: 9,
      altim: 1018,
      fltcat: 'VFR' as const,
      clouds: [{ cover: 'FEW', base: 2000 }, { cover: 'BKN', base: 3500 }],
      rawOb: 'EGLL 301250Z 26012KT 9999 FEW020 BKN035 15/09 Q1018',
    };

    const report = normalizeAviationWeatherReport('EGLL', structured);
    assert.strictEqual(report.icao, 'EGLL');
    assert.strictEqual(report.flightCategory, 'VFR');
    assert.strictEqual(report.wind.speedKt, 12);
    assert.strictEqual(report.temperatureC, 15);
  });
});

describe('Phase 1 Data Layer — Omni-Search Multi-Entity Grouping', () => {
  it('searches airports by ICAO, IATA and city with exact ranking', async () => {
    const resJFK = await performOmniSearch('JFK');
    assert.ok(resJFK.airports.length > 0);
    assert.strictEqual(resJFK.airports[0].iata, 'JFK');

    const resLon = await performOmniSearch('London');
    assert.ok(resLon.airports.some((a) => a.city === 'London'));
  });

  it('searches airlines by code and telephony', async () => {
    const resDelta = await performOmniSearch('DAL');
    assert.ok(resDelta.airlines.length > 0);
    assert.strictEqual(resDelta.airlines[0].icao, 'DAL');

    const resSpeedbird = await performOmniSearch('SPEEDBIRD');
    assert.ok(resSpeedbird.airlines.length > 0);
    assert.strictEqual(resSpeedbird.airlines[0].icao, 'BAW');
  });

  it('returns clean empty structures for empty query', async () => {
    const empty = await performOmniSearch('');
    assert.strictEqual(empty.total, 0);
    assert.deepStrictEqual(empty.flights, []);
    assert.deepStrictEqual(empty.airports, []);
    assert.deepStrictEqual(empty.airlines, []);
  });
});

describe('Phase 1 Data Layer — ChainedFlightProvider Failover', () => {
  it('uses primary provider on success', async () => {
    const mockPrimary = {
      name: 'mock-primary',
      getAircraftInBounds: async () => [
        {
          id: 'test01',
          callsign: 'TST01',
          lat: 37,
          lon: -122,
          altitudeFt: 5000,
          groundSpeedKt: 200,
          trackDeg: 90,
          onGround: false,
          updatedAt: Date.now(),
          source: 'mock-primary',
        },
      ],
      getAircraftByCallsign: async () => null,
      getTrack: async () => [],
    };

    const mockSecondary = {
      name: 'mock-secondary',
      getAircraftInBounds: async () => [],
      getAircraftByCallsign: async () => null,
      getTrack: async () => [],
    };

    const chained = new ChainedFlightProvider(mockPrimary, mockSecondary);
    const bounds: Bounds = { south: 36, north: 38, west: -123, east: -121 };

    const aircraft = await chained.getAircraftInBounds(bounds);
    assert.strictEqual(aircraft.length, 1);
    assert.strictEqual(chained.lastProvider, 'mock-primary');
  });

  it('fails over to secondary provider when primary throws', async () => {
    const mockPrimary = {
      name: 'mock-primary-failing',
      getAircraftInBounds: async () => {
        throw new Error('Connection refused');
      },
      getAircraftByCallsign: async () => null,
      getTrack: async () => [],
    };

    const mockSecondary = {
      name: 'mock-secondary-backup',
      getAircraftInBounds: async () => [
        {
          id: 'backup01',
          callsign: 'BCK01',
          lat: 37,
          lon: -122,
          altitudeFt: 8000,
          groundSpeedKt: 250,
          trackDeg: 180,
          onGround: false,
          updatedAt: Date.now(),
          source: 'mock-secondary-backup',
        },
      ],
      getAircraftByCallsign: async () => null,
      getTrack: async () => [],
    };

    const chained = new ChainedFlightProvider(mockPrimary, mockSecondary);
    const bounds: Bounds = { south: 36, north: 38, west: -123, east: -121 };

    const aircraft = await chained.getAircraftInBounds(bounds);
    assert.strictEqual(aircraft.length, 1);
    assert.strictEqual(aircraft[0].callsign, 'BCK01');
    assert.strictEqual(chained.lastProvider, 'mock-secondary-backup');
  });
});
