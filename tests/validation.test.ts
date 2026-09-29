import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSpatialQuery,
  isValidIcaoHex,
  isValidSquawk,
  getEmergencyType,
} from '../lib/providers/positions/validation.ts';

describe('Spatial & Telemetry Validation Engine Tests', () => {
  describe('Spatial Query Validation', () => {
    test('accepts valid WGS84 coordinates and radius within operational limits', () => {
      const res = validateSpatialQuery('37.7749', '-122.4194', '50');
      assert.equal(res.valid, true);
      assert.equal(res.lat, 37.7749);
      assert.equal(res.lon, -122.4194);
      assert.equal(res.radiusNm, 50);
      assert.equal(res.error, undefined);
    });

    test('falls back to default values when params are missing or empty', () => {
      const res = validateSpatialQuery(null, undefined, '');
      assert.equal(res.valid, true);
      assert.equal(res.lat, 37.7749);
      assert.equal(res.lon, -122.4194);
      assert.equal(res.radiusNm, 50);
    });

    test('rejects latitude beyond +90.0 or -90.0 bounds', () => {
      const high = validateSpatialQuery('90.001', '0', '50');
      assert.equal(high.valid, false);
      assert.match(high.error ?? '', /latitude/i);

      const low = validateSpatialQuery('-120', '0', '50');
      assert.equal(low.valid, false);
      assert.match(low.error ?? '', /latitude/i);

      const nonNum = validateSpatialQuery('invalid_lat', '0', '50');
      assert.equal(nonNum.valid, false);
    });

    test('rejects longitude beyond +180.0 or -180.0 bounds', () => {
      const high = validateSpatialQuery('0', '180.05', '50');
      assert.equal(high.valid, false);
      assert.match(high.error ?? '', /longitude/i);

      const low = validateSpatialQuery('0', '-200', '50');
      assert.equal(low.valid, false);
      assert.match(low.error ?? '', /longitude/i);
    });

    test('rejects non-positive or excessive radius queries (>300 NM)', () => {
      const zero = validateSpatialQuery('0', '0', '0');
      assert.equal(zero.valid, false);
      assert.match(zero.error ?? '', /radius/i);

      const negative = validateSpatialQuery('0', '0', '-20');
      assert.equal(negative.valid, false);

      const excessive = validateSpatialQuery('0', '0', '450');
      assert.equal(excessive.valid, false);
    });
  });

  describe('ICAO 24-bit Hex Address Validation', () => {
    test('validates 6-character hexadecimal codes', () => {
      assert.equal(isValidIcaoHex('a38d95'), true);
      assert.equal(isValidIcaoHex('A38D95'), true);
      assert.equal(isValidIcaoHex('400f0a'), true);
      assert.equal(isValidIcaoHex('000001'), true);
    });

    test('rejects invalid or malformed ICAO hex codes', () => {
      assert.equal(isValidIcaoHex('a38d9'), false); // Too short (5 chars)
      assert.equal(isValidIcaoHex('a38d95f'), false); // Too long (7 chars)
      assert.equal(isValidIcaoHex('g38d95'), false); // 'g' is not hex
      assert.equal(isValidIcaoHex(''), false);
      assert.equal(isValidIcaoHex(null), false);
      assert.equal(isValidIcaoHex(123456), false);
    });
  });

  describe('Transponder Squawk & Emergency Classification', () => {
    test('validates standard 4-digit octal squawk codes (0-7 only)', () => {
      assert.equal(isValidSquawk('1200'), true); // VFR standard
      assert.equal(isValidSquawk('7700'), true); // Emergency
      assert.equal(isValidSquawk('7600'), true); // Nordo
      assert.equal(isValidSquawk('7500'), true); // Hijack
      assert.equal(isValidSquawk('0000'), true);
      assert.equal(isValidSquawk('7777'), true);
    });

    test('rejects non-octal digits (8 or 9) or invalid lengths', () => {
      assert.equal(isValidSquawk('7800'), false); // '8' is not octal
      assert.equal(isValidSquawk('1920'), false); // '9' is not octal
      assert.equal(isValidSquawk('120'), false); // 3 digits
      assert.equal(isValidSquawk('12000'), false); // 5 digits
      assert.equal(isValidSquawk('abcd'), false);
      assert.equal(isValidSquawk(null), false);
    });

    test('correctly classifies emergency squawks', () => {
      assert.equal(getEmergencyType('7700'), 'GENERAL_EMERGENCY');
      assert.equal(getEmergencyType('7600'), 'RADIO_FAILURE');
      assert.equal(getEmergencyType('7500'), 'HIJACK');
      assert.equal(getEmergencyType('1200'), null);
      assert.equal(getEmergencyType(undefined), null);
    });
  });
});
