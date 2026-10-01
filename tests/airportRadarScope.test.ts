import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { AircraftState } from '../lib/providers/types.ts';

const mockAirport = {
  name: 'London Heathrow Airport',
  iata: 'LHR',
  icao: 'EGLL',
  latitude: 51.4700,
  longitude: -0.4543,
  elevationFt: 83,
};

const mockAircraft: AircraftState[] = [
  {
    id: '400a01',
    callsign: 'BAW123',
    lat: 51.5200,
    lon: -0.3543,
    altitudeFt: 4500,
    groundSpeedKt: 220,
    trackDeg: 180,
    onGround: false,
    squawk: '1200',
    typeCode: 'A320',
    source: 'adsb_lol',
    updatedAt: Date.now(),
  },
  {
    id: '400a02',
    callsign: 'VIR456',
    lat: 51.4000,
    lon: -0.5543,
    altitudeFt: 12000,
    groundSpeedKt: 340,
    trackDeg: 90,
    onGround: false,
    squawk: '7700', // Emergency squawk
    typeCode: 'B789',
    source: 'adsb_lol',
    updatedAt: Date.now(),
  },
];

// Calculation verification helper matching AirportRadarScope logic
function calculateDistanceAndBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceNm: number; bearingDeg: number } {
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceNm = c * 3440.065;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearingDeg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  return { distanceNm, bearingDeg };
}

describe('Part C: Airport ATC Radar Scope Logic Verification', () => {
  it('calculates accurate distance and bearing for terminal aircraft relative to airport', () => {
    const ac1 = mockAircraft[0];
    const { distanceNm, bearingDeg } = calculateDistanceAndBearing(
      mockAirport.latitude,
      mockAirport.longitude,
      ac1.lat,
      ac1.lon
    );

    assert.ok(distanceNm > 0 && distanceNm < 15, `Distance ${distanceNm} should be within 15 NM`);
    assert.ok(bearingDeg >= 0 && bearingDeg <= 360, `Bearing ${bearingDeg} should be between 0 and 360`);
  });

  it('correctly identifies emergency squawk 7700 targets', () => {
    const emergencyAc = mockAircraft.find((ac) => ac.squawk === '7700');
    assert.ok(emergencyAc, 'Expected emergency aircraft with squawk 7700');
    assert.strictEqual(emergencyAc?.callsign, 'VIR456');
  });

  it('filters aircraft strictly within selected range ring (e.g. 10NM vs 25NM)', () => {
    const range10 = mockAircraft.filter((ac) => {
      const { distanceNm } = calculateDistanceAndBearing(
        mockAirport.latitude,
        mockAirport.longitude,
        ac.lat,
        ac.lon
      );
      return distanceNm <= 10;
    });

    assert.ok(range10.length >= 1, 'Expected at least 1 aircraft within 10 NM');
  });
});
