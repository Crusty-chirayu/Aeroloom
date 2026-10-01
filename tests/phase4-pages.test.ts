import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  GLOBAL_AIRPORTS,
  getAirportByIata,
  getAirportByIcao,
  calculateDistanceNm,
} from '../lib/airports/airportData.ts';
import { getAircraftCategory } from '../lib/map/typeMapping.ts';
import { SILHOUETTES } from '../lib/map/silhouettes/paths.ts';
import { AIRLINE_CATALOG, getAirlineByCallsign } from '../lib/metadata/airlineCatalog.ts';
import { createAeroloomMapStyle } from '../lib/map/mapStyle.ts';
import {
  determineFlightCategory,
  parseRawMetarString,
} from '../lib/weather/metarDecoder.ts';

describe('Phase 4: Flight, Airport, Search & Data Pages Verification', () => {
  describe('1. Global Airport Database & Lookups', () => {
    it('contains comprehensive global hub airports with required fields', () => {
      assert.ok(GLOBAL_AIRPORTS.length >= 25, 'Expected at least 25 global airports');
      GLOBAL_AIRPORTS.forEach((apt) => {
        assert.ok(apt.iata, `Missing IATA for ${apt.name}`);
        assert.ok(apt.icao, `Missing ICAO for ${apt.name}`);
        assert.ok(typeof apt.latitude === 'number', `Invalid lat for ${apt.name}`);
        assert.ok(typeof apt.longitude === 'number', `Invalid lon for ${apt.name}`);
        assert.ok(apt.city, `Missing city for ${apt.name}`);
        assert.ok(apt.country, `Missing country for ${apt.name}`);
      });
    });

    it('successfully retrieves airports by IATA or ICAO code case-insensitively', () => {
      const jfkByIata = getAirportByIata('JFK');
      const jfkByIcao = getAirportByIcao('kjfk');
      assert.ok(jfkByIata, 'Expected JFK by IATA');
      assert.ok(jfkByIcao, 'Expected KJFK by ICAO');
      assert.strictEqual(jfkByIata?.icao, 'KJFK');
      assert.strictEqual(jfkByIcao?.iata, 'JFK');

      const blr = getAirportByIata('blr');
      assert.ok(blr, 'Expected BLR by IATA');
      assert.strictEqual(blr?.icao, 'VOBL');
      assert.strictEqual(blr?.city, 'Bengaluru');
    });

    it('computes accurate great-circle distance between coordinates in nautical miles', () => {
      // JFK (40.64, -73.78) to LHR (51.47, -0.46) is ~3000 NM
      const dist = calculateDistanceNm(40.64, -73.78, 51.47, -0.46);
      assert.ok(dist > 2900 && dist < 3150, `Distance ${dist} outside expected range ~3000 NM`);
    });
  });

  describe('2. Silhouette Artwork & Category Resolution for Flight Dossiers', () => {
    it('resolves diverse aircraft type codes to correct visual silhouettes with bodyPath', () => {
      const types = [
        { code: 'A320', expected: 'narrowbody' },
        { code: 'B789', expected: 'widebody_twin' },
        { code: 'A388', expected: 'quad' },
        { code: 'E175', expected: 'regional_jet' },
        { code: 'AT76', expected: 'turboprop' },
        { code: 'C172', expected: 'light_ga' },
        { code: 'H145', expected: 'helicopter' },
        { code: 'UNKNOWN_99', expected: 'unknown' },
      ];

      types.forEach(({ code, expected }) => {
        const cat = getAircraftCategory(code);
        assert.strictEqual(cat, expected, `Expected ${code} to map to ${expected}`);
        const sil = SILHOUETTES[cat];
        assert.ok(sil, `Missing silhouette definition for ${cat}`);
        assert.ok(sil.bodyPath && sil.bodyPath.length > 20, `Invalid bodyPath for ${cat}`);
      });
    });
  });

  describe('3. METAR Decoding & Weather Logic', () => {
    it('correctly categorizes VFR, MVFR, IFR, and LIFR flight categories', () => {
      // VFR: ceiling > 3000 and visibility > 5
      assert.strictEqual(determineFlightCategory(10, 5000), 'VFR');
      // MVFR: ceiling 1000-3000 or visibility 3-5
      assert.strictEqual(determineFlightCategory(6, 2500), 'MVFR');
      assert.strictEqual(determineFlightCategory(4, 4000), 'MVFR');
      // IFR: ceiling 500-1000 or visibility 1-3
      assert.strictEqual(determineFlightCategory(5, 800), 'IFR');
      assert.strictEqual(determineFlightCategory(2, 4000), 'IFR');
      // LIFR: ceiling < 500 or visibility < 1
      assert.strictEqual(determineFlightCategory(10, 300), 'LIFR');
      assert.strictEqual(determineFlightCategory(0.5, 4000), 'LIFR');
    });

    it('parses raw METAR strings into structured weather reports', () => {
      const raw = 'KJFK 301851Z 31015G25KT 10SM BKN045 OVC090 18/08 A3002 RMK AO2';
      const report = parseRawMetarString('KJFK', raw);

      assert.strictEqual(report.icao, 'KJFK');
      assert.strictEqual(report.flightCategory, 'VFR');
      assert.strictEqual(report.wind.directionDeg, 310);
      assert.strictEqual(report.wind.speedKt, 15);
      assert.strictEqual(report.wind.gustKt, 25);
      assert.strictEqual(report.visibilitySm, 10);
      assert.strictEqual(report.temperatureC, 18);
      assert.strictEqual(report.dewpointC, 8);
      assert.strictEqual(report.altimeterInHg, 30.02);
    });
  });

  describe('4. Airline & Carrier Resolution', () => {
    it('indexes major global carriers with telephony callsigns and country', () => {
      assert.ok(AIRLINE_CATALOG.length >= 10, 'Expected airline catalog entries');
      const delta = getAirlineByCallsign('DAL123');
      assert.ok(delta, 'Expected Delta Air Lines lookup');
      assert.strictEqual(delta?.name, 'Delta Air Lines');
      assert.strictEqual(delta?.callsignTelephony, 'DELTA');

      const lufthansa = getAirlineByCallsign('DLH400');
      assert.ok(lufthansa, 'Expected Lufthansa lookup');
      assert.strictEqual(lufthansa?.name, 'Lufthansa');
      assert.strictEqual(lufthansa?.callsignTelephony, 'LUFTHANSA');
    });
  });

  describe('5. Cartography Style Generator', () => {
    it('generates isolated, valid Aeroloom light map style specifications', () => {
      const style = createAeroloomMapStyle();
      assert.strictEqual(style.version, 8);
      assert.strictEqual(style.name, 'Aeroloom Editorial Light');
      assert.ok(style.sources.openmaptiles, 'Expected openmaptiles source');
      assert.ok(style.layers.length > 5, 'Expected styled layers');
    });
  });
});
