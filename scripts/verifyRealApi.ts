import fs from 'node:fs';
import path from 'node:path';

interface ApiCallRecord {
  callIndex: number;
  timestamp: string;
  provider: string;
  url: string;
  status: number;
  statusText: string;
  aircraftCount: number;
  sampleAircraft?: {
    id: string;
    callsign: string;
    altitude: number;
    speed: number;
    lat: number;
    lon: number;
  };
  rawNote?: string;
  responseTimeMs: number;
}

const USER_AGENT = 'Aeroloom-FlightTracker/0.1.0 (https://github.com/Crusty-chirayu/Aeroloom; chirayujayaswal7@gmail.com)';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('=====================================================');
  console.log('Aeroloom Phase 0: Real API Live Verification Runner');
  console.log('=====================================================\n');

  const airplanesLiveRecords: ApiCallRecord[] = [];
  const openAdsbRecords: ApiCallRecord[] = [];

  // Part 1: Test airplanes.live 10 times to document upstream state
  console.log('--- Probing airplanes.live (10 calls with 1.2s delay) ---');
  for (let i = 1; i <= 10; i++) {
    const start = performance.now();
    const url = 'https://api.airplanes.live/v2/point/37.7749/-122.4194/50';
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
      });
      const elapsed = Math.round(performance.now() - start);
      const text = await res.text();
      let note = text;
      try {
        const json = JSON.parse(text);
        note = json.error || text;
      } catch {}

      const record: ApiCallRecord = {
        callIndex: i,
        timestamp: new Date().toISOString(),
        provider: 'airplanes.live',
        url,
        status: res.status,
        statusText: res.statusText,
        aircraftCount: 0,
        rawNote: note,
        responseTimeMs: elapsed,
      };
      airplanesLiveRecords.push(record);
      console.log(`[airplanes.live #${i}] Status: ${res.status}, Elapsed: ${elapsed}ms, Note: ${note.slice(0, 75)}...`);
    } catch (err: unknown) {
      const errorObj = err as Error;
      const elapsed = Math.round(performance.now() - start);
      airplanesLiveRecords.push({
        callIndex: i,
        timestamp: new Date().toISOString(),
        provider: 'airplanes.live',
        url,
        status: 0,
        statusText: 'Network Error',
        aircraftCount: 0,
        rawNote: errorObj.message,
        responseTimeMs: elapsed,
      });
      console.log(`[airplanes.live #${i}] Error: ${errorObj.message}`);
    }
    await sleep(1200);
  }

  // Part 2: Test live open ADS-B (adsb.lol) 10 times with real aircraft data
  console.log('\n--- Probing Open ADS-B (adsb.lol) (10 calls with 1.5s delay) ---');
  for (let i = 1; i <= 10; i++) {
    const start = performance.now();
    const url = 'https://api.adsb.lol/v2/point/37.7749/-122.4194/50';
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
      });
      const elapsed = Math.round(performance.now() - start);
      const json = await res.json();
      const acList = Array.isArray(json.ac) ? json.ac : [];

      let sample = undefined;
      const validAc = acList.find((a: Record<string, unknown>) => typeof a.lat === 'number' && typeof a.lon === 'number' && a.flight);
      if (validAc) {
        sample = {
          id: String(validAc.hex),
          callsign: String(validAc.flight || validAc.hex).trim(),
          altitude: typeof validAc.alt_baro === 'number' ? validAc.alt_baro : 0,
          speed: typeof validAc.gs === 'number' ? validAc.gs : 0,
          lat: Number(validAc.lat),
          lon: Number(validAc.lon),
        };
      }

      const record: ApiCallRecord = {
        callIndex: i,
        timestamp: new Date().toISOString(),
        provider: 'adsb-open',
        url,
        status: res.status,
        statusText: res.statusText,
        aircraftCount: acList.length,
        sampleAircraft: sample,
        rawNote: `Total reported: ${json.total ?? acList.length}`,
        responseTimeMs: elapsed,
      };
      openAdsbRecords.push(record);
      console.log(
        `[adsb-open #${i}] Status: ${res.status}, Elapsed: ${elapsed}ms, Aircraft Count: ${acList.length}` +
          (sample ? `, Sample: ${sample.callsign} (${sample.id}) @ ${sample.altitude}ft` : '')
      );
    } catch (err: unknown) {
      const errorObj = err as Error;
      const elapsed = Math.round(performance.now() - start);
      openAdsbRecords.push({
        callIndex: i,
        timestamp: new Date().toISOString(),
        provider: 'adsb-open',
        url,
        status: 0,
        statusText: 'Network Error',
        aircraftCount: 0,
        rawNote: errorObj.message,
        responseTimeMs: elapsed,
      });
      console.log(`[adsb-open #${i}] Error: ${errorObj.message}`);
    }
    await sleep(1500);
  }

  // Part 3: Test Aeroloom Local Server Route (/api/aircraft/live)
  console.log('\n--- Probing Aeroloom Internal Route (http://localhost:3000/api/aircraft/live) ---');
  let internalRecord = null;
  try {
    const start = performance.now();
    const res = await fetch('http://localhost:3000/api/aircraft/live');
    const elapsed = Math.round(performance.now() - start);
    const json = await res.json();
    internalRecord = {
      status: res.status,
      success: json.success,
      count: json.aircraft?.length ?? 0,
      provider: json.provider,
      firstAircraft: json.aircraft?.[0],
      responseTimeMs: elapsed,
    };
    console.log(`[Local API Route] Status: ${res.status}, Success: ${json.success}, Aircraft Count: ${json.aircraft?.length}`);
    if (json.aircraft?.[0]) {
      console.log(`[Local API Sample] Callsign: ${json.aircraft[0].callsign}, Pos: [${json.aircraft[0].latitude}, ${json.aircraft[0].longitude}], Alt: ${json.aircraft[0].altitude}ft`);
    }
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.log(`[Local API Route] Error: ${errorObj.message}`);
  }

  // Save evidence to docs/evidence_api_calls.json
  const evidence = {
    testExecutedAt: new Date().toISOString(),
    airplanesLiveRecords,
    openAdsbRecords,
    internalRouteTest: internalRecord,
  };

  const evidencePath = path.resolve('docs', 'evidence_api_calls.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`\nEvidence saved to: ${evidencePath}`);
}

runVerification();
