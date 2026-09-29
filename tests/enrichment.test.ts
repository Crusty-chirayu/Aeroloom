import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getAirlineByCallsign } from '../lib/metadata/airlineCatalog.ts';
import { getAircraftDetails } from '../lib/metadata/aircraftCatalog.ts';
import {
  getAirportByIcao,
  getAirportByIata,
  findNearestAirports,
  calculateDistanceNm,
} from '../lib/airports/airportData.ts';
import {
  resolveFlightRoute,
  clearRouteCache,
} from '../lib/routes/routeResolver.ts';
import {
  enrichAircraftPosition,
  enrichAircraftPositions,
} from '../lib/providers/enrichment.ts';
import type { AircraftPosition } from '../lib/providers/positions/types.ts';

describe('Aviation Metadata & Enrichment Pipeline Tests', () => {
  beforeEach(() => {
    clearRouteCache();
  });

  describe('Airline Catalog Resolution', () => {
    test('resolves Delta Air Lines from DAL callsign', () => {
      const airline = getAirlineByCallsign('DAL397');
      assert.ok(airline);
      assert.strictEqual(airline.name, 'Delta Air Lines');
      assert.strictEqual(airline.icao, 'DAL');
      assert.strictEqual(airline.iata, 'DL');
      assert.strictEqual(airline.callsignTelephony, 'DELTA');
    });

    test('resolves British Airways from BAW callsign', () => {
      const airline = getAirlineByCallsign('BAW112');
      assert.ok(airline);
      assert.strictEqual(airline.name, 'British Airways');
      assert.strictEqual(airline.callsignTelephony, 'SPEEDBIRD');
    });

    test('resolves JetBlue from JBU callsign with lowercase input', () => {
      const airline = getAirlineByCallsign('jbu359');
      assert.ok(airline);
      assert.strictEqual(airline.name, 'JetBlue Airways');
    });

    test('returns undefined for unknown callsign prefix or general aviation tail', () => {
      assert.strictEqual(getAirlineByCallsign('N328RX'), undefined);
      assert.strictEqual(getAirlineByCallsign(''), undefined);
      assert.strictEqual(getAirlineByCallsign(undefined), undefined);
    });
  });

  describe('Aircraft Type Catalog Resolution', () => {
    test('resolves Boeing 737-800 from B738', () => {
      const details = getAircraftDetails('B738');
      assert.ok(details);
      assert.strictEqual(details.manufacturer, 'Boeing');
      assert.strictEqual(details.model, '737-800');
      assert.strictEqual(details.category, 'Jet');
      assert.strictEqual(details.wakeClass, 'M');
    });

    test('resolves Airbus A320neo from A20N', () => {
      const details = getAircraftDetails('A20N');
      assert.ok(details);
      assert.strictEqual(details.manufacturer, 'Airbus');
      assert.strictEqual(details.model, 'A320neo');
    });

    test('resolves Cessna 172 Skyhawk from C172', () => {
      const details = getAircraftDetails('C172');
      assert.ok(details);
      assert.strictEqual(details.manufacturer, 'Cessna');
      assert.strictEqual(details.category, 'Piston');
      assert.strictEqual(details.wakeClass, 'L');
    });

    test('returns undefined for unknown type designator', () => {
      assert.strictEqual(getAircraftDetails('ZZ99'), undefined);
      assert.strictEqual(getAircraftDetails(undefined), undefined);
    });
  });

  describe('Airport Directory & Geodesic Calculations', () => {
    test('resolves KJFK by ICAO and JFK by IATA', () => {
      const icaoMatch = getAirportByIcao('KJFK');
      const iataMatch = getAirportByIata('JFK');
      assert.ok(icaoMatch);
      assert.ok(iataMatch);
      assert.strictEqual(icaoMatch.icao, 'KJFK');
      assert.strictEqual(iataMatch.iata, 'JFK');
      assert.strictEqual(icaoMatch.name, 'John F. Kennedy International Airport');
      assert.strictEqual(icaoMatch.city, 'New York');
    });

    test('calculates accurate great-circle nautical distance between JFK and SFO', () => {
      const jfk = getAirportByIata('JFK')!;
      const sfo = getAirportByIata('SFO')!;
      const dist = calculateDistanceNm(jfk.latitude, jfk.longitude, sfo.latitude, sfo.longitude);
      // Great-circle distance between JFK and SFO is ~2245 nm
      assert.ok(dist > 2200 && dist < 2300, `Expected distance ~2245nm, got ${dist}`);
    });

    test('findNearestAirports identifies LGA, JFK, EWR near Manhattan coordinates', () => {
      const manhattanLat = 40.7580;
      const manhattanLon = -73.9855;
      const nearest = findNearestAirports(manhattanLat, manhattanLon, 3);
      assert.strictEqual(nearest.length, 3);
      const iatas = nearest.map((n) => n.airport.iata);
      assert.ok(iatas.includes('LGA'));
      assert.ok(iatas.includes('EWR'));
      assert.ok(iatas.includes('JFK'));
    });
  });

  describe('Route Resolver', () => {
    test('resolves authentic commercial schedule for DAL397 to JFK->SFO', () => {
      const route = resolveFlightRoute('DAL397');
      assert.ok(route);
      assert.strictEqual(route.origin.iata, 'JFK');
      assert.strictEqual(route.destination.iata, 'SFO');
      assert.strictEqual(route.confidence, 'verified');
      assert.ok(route.distanceNm && route.distanceNm > 2200);
    });

    test('returns null without hallucinating for unknown general aviation callsigns', () => {
      const route = resolveFlightRoute('N172SP');
      assert.strictEqual(route, null);
    });

    test('serves cached route on second lookup', () => {
      const r1 = resolveFlightRoute('JBU359');
      const r2 = resolveFlightRoute('JBU359');
      assert.ok(r1);
      assert.strictEqual(r1, r2);
    });
  });

  describe('Unified Aircraft Enrichment Pipeline', () => {
    const rawPos: AircraftPosition = {
      id: 'a1b2c3',
      callsign: 'DAL397',
      aircraftType: 'B738',
      latitude: 40.64,
      longitude: -73.78,
      altitude: 12000,
      heading: 270,
      speed: 380,
      timestamp: Date.now(),
      source: 'airplanes.live',
    };

    test('enriches AircraftPosition with airline, aircraftDetails, and verified route', () => {
      const enriched = enrichAircraftPosition(rawPos);
      assert.strictEqual(enriched.id, 'a1b2c3');
      assert.ok(enriched.airline);
      assert.strictEqual(enriched.airline.name, 'Delta Air Lines');
      assert.ok(enriched.aircraftDetails);
      assert.strictEqual(enriched.aircraftDetails.model, '737-800');
      assert.ok(enriched.route);
      assert.strictEqual(enriched.route.origin.iata, 'JFK');
      assert.strictEqual(enriched.route.destination.iata, 'SFO');
    });

    test('preserves existing non-empty metadata without overwriting', () => {
      const customPos: AircraftPosition = {
        ...rawPos,
        callsign: 'UNKNOWN99',
        aircraftType: 'UNKNOWN',
      };
      const enriched = enrichAircraftPosition(customPos);
      assert.strictEqual(enriched.airline, undefined);
      assert.strictEqual(enriched.aircraftDetails, undefined);
      assert.strictEqual(enriched.route, undefined);
    });

    test('enrichAircraftPositions processes lists in bulk', () => {
      const list = [rawPos, { ...rawPos, id: 'x2y3z4', callsign: 'BAW112', aircraftType: 'A359' }];
      const enrichedList = enrichAircraftPositions(list);
      assert.strictEqual(enrichedList.length, 2);
      assert.strictEqual(enrichedList[0].airline?.name, 'Delta Air Lines');
      assert.strictEqual(enrichedList[1].airline?.name, 'British Airways');
      assert.strictEqual(enrichedList[1].aircraftDetails?.manufacturer, 'Airbus');
    });
  });
});
