import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHardwareTier, TIER_CONFIGS } from '../lib/deviceTier.ts';

describe('lib/deviceTier evaluation tests', () => {
  test('returns static tier when WebGL is unavailable', () => {
    const tier = evaluateHardwareTier(16, 60, false);
    assert.equal(tier, 'static');
  });

  test('returns static tier when FPS is below 20', () => {
    const tier = evaluateHardwareTier(16, 18, true);
    assert.equal(tier, 'static');
  });

  test('returns full tier when concurrency >= 8 and FPS >= 50', () => {
    const tier = evaluateHardwareTier(8, 55, true);
    assert.equal(tier, 'full');

    const highTier = evaluateHardwareTier(16, 60, true);
    assert.equal(highTier, 'full');
  });

  test('returns reduced tier when concurrency < 8 even if FPS >= 50', () => {
    const tier = evaluateHardwareTier(4, 60, true);
    assert.equal(tier, 'reduced');
  });

  test('returns reduced tier when FPS is between 20 and 49', () => {
    const tier = evaluateHardwareTier(8, 45, true);
    assert.equal(tier, 'reduced');
  });

  test('tier configurations match blueprint point count thresholds', () => {
    // Full: ~8,000-10,000 points, bloom enabled
    assert.ok(TIER_CONFIGS.full.pointCount >= 8000 && TIER_CONFIGS.full.pointCount <= 10000);
    assert.equal(TIER_CONFIGS.full.bloom, true);

    // Reduced: ~2,000-2,500 points, bloom disabled
    assert.ok(TIER_CONFIGS.reduced.pointCount >= 2000 && TIER_CONFIGS.reduced.pointCount <= 2500);
    assert.equal(TIER_CONFIGS.reduced.bloom, false);

    // Static: 0 points, bloom disabled
    assert.equal(TIER_CONFIGS.static.pointCount, 0);
    assert.equal(TIER_CONFIGS.static.bloom, false);
  });
});
