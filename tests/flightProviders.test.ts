import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AdsbFiProvider } from '../lib/providers/adsbFiProvider.ts';
import { AdsbLolProvider } from '../lib/providers/adsbLolProvider.ts';
import { AirplanesLiveProvider } from '../lib/providers/airplanesLiveProvider.ts';
import { OpenSkyProvider } from '../lib/providers/openSkyProvider.ts';
import { ChainedFlightProvider } from '../lib/providers/chainedFlightProvider.ts';
import { SampleTrafficProvider } from '../lib/providers/sampleTrafficProvider.ts';
import {
  resetProviderHealthForTest,
  recordProviderFailure,
  shouldSkipProvider,
  getProviderHealth,
} from '../lib/providers/healthTracker.ts';
import type { Bounds, FlightProvider } from '../lib/providers/types.ts';

// Recorded fixtures
const ADS_B_FI_SUCCESS_FIXTURE = {
  now: 1790856566.001,
  aircraft: [
    {
      hex: 'a1435d',
      type: 'adsb_icao',
      flight: 'SWA1864 ',
      r: 'N1802U',
      t: 'B38M',
      alt_baro: 13600,
      alt_geom: 14275,
      gs: 370.0,
      track: 60.18,
      lat: 37.3042,
      lon: -122.6643,
      squawk: '3735',
    },
  ],
};

const ADS_B_LOL_SUCCESS_FIXTURE = {
  now: 1790856566.0,
  ac: [
    {
      hex: 'a23456',
      flight: 'UAL101  ',
      r: 'N12345',
      t: 'A320',
      alt_baro: 25000,
      gs: 420.0,
      track: 180.0,
      lat: 37.5,
      lon: -122.2,
      squawk: '1200',
    },
  ],
};

const AIRPLANES_LIVE_SUCCESS_FIXTURE = {
  now: 1790856566.0,
  ac: [
    {
      hex: 'a34567',
      flight: 'DAL450  ',
      r: 'N999DL',
      t: 'B738',
      alt_baro: 31000,
      gs: 460.0,
      track: 270.0,
      lat: 37.6,
      lon: -122.3,
      squawk: '5421',
    },
  ],
};

const AIRPLANES_LIVE_CONTACT_ERROR_FIXTURE = {
  error:
    'Please contact us at contact@airplanes.live. Your email MUST include any links, a description of the project, and any information you deem appropriate.',
};

const OPENSKY_SUCCESS_FIXTURE = {
  time: 1790856556,
  states: [
    [
      'ac245c',
      'SWA4501 ',
      'United States',
      1790856554,
      1790856554,
      -122.2145,
      37.7116,
      1000, // baro altitude in meters (~3281 ft)
      false,
      150, // velocity in m/s (~291 kts)
      306.56,
      0,
      null,
      1050,
      '1234',
      false,
      0,
    ],
  ],
};

const TEST_BOUNDS: Bounds = {
  south: 37.0,
  north: 38.0,
  west: -123.0,
  east: -122.0,
  zoom: 10,
};

describe('Telemetry Providers & Failover Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetProviderHealthForTest();
  });

  it('normalizes adsb.fi success response with aircraft array and valid /lat/ and /lon/ URL', async () => {
    let capturedUrl = '';
    globalThis.fetch = (async (url: string | URL) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify(ADS_B_FI_SUCCESS_FIXTURE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const provider = new AdsbFiProvider();
      const aircraft = await provider.getAircraftInBounds(TEST_BOUNDS);
      assert.ok(
        capturedUrl.includes('/lat/') && capturedUrl.includes('/lon/') && capturedUrl.includes('/dist/'),
        `adsb.fi URL must contain /lat/ and /lon/ structure, got: ${capturedUrl}`
      );
      assert.strictEqual(aircraft.length, 1);
      assert.strictEqual(aircraft[0].id, 'a1435d');
      assert.strictEqual(aircraft[0].callsign, 'SWA1864');
      assert.strictEqual(aircraft[0].typeCode, 'B38M');
      assert.strictEqual(aircraft[0].altitudeFt, 13600);
      assert.strictEqual(aircraft[0].groundSpeedKt, 370);
      assert.strictEqual(getProviderHealth('adsb.fi').circuitState, 'closed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizes adsb.lol success response with ac array', async () => {
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify(ADS_B_LOL_SUCCESS_FIXTURE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const provider = new AdsbLolProvider();
      const aircraft = await provider.getAircraftInBounds(TEST_BOUNDS);
      assert.strictEqual(aircraft.length, 1);
      assert.strictEqual(aircraft[0].id, 'a23456');
      assert.strictEqual(aircraft[0].callsign, 'UAL101');
      assert.strictEqual(getProviderHealth('adsb.lol').circuitState, 'closed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizes airplanes.live success response when authorized', async () => {
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify(AIRPLANES_LIVE_SUCCESS_FIXTURE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const provider = new AirplanesLiveProvider();
      const aircraft = await provider.getAircraftInBounds(TEST_BOUNDS);
      assert.strictEqual(aircraft.length, 1);
      assert.strictEqual(aircraft[0].id, 'a34567');
      assert.strictEqual(aircraft[0].callsign, 'DAL450');
      assert.strictEqual(getProviderHealth('airplanes.live').circuitState, 'closed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizes OpenSky Network state vector array correctly', async () => {
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify(OPENSKY_SUCCESS_FIXTURE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const provider = new OpenSkyProvider();
      const aircraft = await provider.getAircraftInBounds(TEST_BOUNDS);
      assert.strictEqual(aircraft.length, 1);
      assert.strictEqual(aircraft[0].id, 'ac245c');
      assert.strictEqual(aircraft[0].callsign, 'SWA4501');
      assert.strictEqual(aircraft[0].altitudeFt, 3281); // 1000m * 3.28084
      assert.strictEqual(aircraft[0].groundSpeedKt, 292); // 150m/s * 1.94384
      assert.strictEqual(getProviderHealth('opensky-network').circuitState, 'closed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('detects airplanes.live 403 contact-required error, throws and opens circuit breaker', async () => {
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify(AIRPLANES_LIVE_CONTACT_ERROR_FIXTURE), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const provider = new AirplanesLiveProvider();
      await assert.rejects(
        async () => {
          await provider.getAircraftInBounds(TEST_BOUNDS);
        },
        /contact@airplanes\.live/
      );

      const health = getProviderHealth('airplanes.live');
      assert.strictEqual(health.circuitState, 'open');
      assert.strictEqual(shouldSkipProvider('airplanes.live'), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('ChainedFlightProvider automatically skips tripped circuit and fails over to healthy provider', async () => {
    // Simulate airplanes.live failing / circuit open
    recordProviderFailure('mock-failing', 'HTTP 403 Forbidden', 403);
    assert.strictEqual(shouldSkipProvider('mock-failing'), true);

    let failingCalled = false;
    let fallbackCalled = false;

    const mockFailing: FlightProvider = {
      name: 'mock-failing',
      getAircraftInBounds: async () => {
        failingCalled = true;
        throw new Error('Should have been skipped by circuit breaker');
      },
      getAircraftByCallsign: async () => null,
      getTrack: async () => [],
    };

    const mockHealthy: FlightProvider = {
      name: 'mock-healthy',
      getAircraftInBounds: async () => {
        fallbackCalled = true;
        return [
          {
            id: 'h1',
            callsign: 'HLT01',
            lat: 37.5,
            lon: -122.5,
            altitudeFt: 10000,
            groundSpeedKt: 300,
            trackDeg: 0,
            onGround: false,
            updatedAt: Date.now(),
            source: 'mock-healthy',
          },
        ];
      },
      getAircraftByCallsign: async () => null,
      getTrack: async () => [],
    };

    const chained = new ChainedFlightProvider([mockFailing, mockHealthy]);
    const results = await chained.getAircraftInBounds(TEST_BOUNDS);

    assert.strictEqual(failingCalled, false, 'Failing provider should have been skipped due to open circuit');
    assert.strictEqual(fallbackCalled, true, 'Healthy provider should have serviced the request');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(chained.lastProvider, 'mock-healthy');
  });

  it('SampleTrafficProvider generates ~60 plausible aircraft with valid coordinates and flight metadata', async () => {
    const sample = new SampleTrafficProvider();
    const data = await sample.getAircraftInBounds(TEST_BOUNDS);

    assert.strictEqual(data.length, 60);
    for (const ac of data) {
      assert.ok(ac.id && ac.id.length >= 6);
      assert.ok(ac.callsign && ac.callsign.length >= 4);
      assert.ok(ac.lat >= TEST_BOUNDS.south && ac.lat <= TEST_BOUNDS.north);
      assert.ok(ac.lon >= TEST_BOUNDS.west && ac.lon <= TEST_BOUNDS.east);
      assert.ok(typeof ac.altitudeFt === 'number');
      assert.ok(typeof ac.groundSpeedKt === 'number');
      assert.strictEqual(ac.source, 'fixture');
    }
  });
});
