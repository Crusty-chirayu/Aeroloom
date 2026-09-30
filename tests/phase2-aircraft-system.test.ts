import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ICAO_TYPE_MAP, getAircraftCategory } from '../lib/map/typeMapping.ts';
import { SILHOUETTES } from '../lib/map/silhouettes/paths.ts';
import { AIRCRAFT_CATEGORIES, type AircraftCategory } from '../lib/map/silhouettes/types.ts';
import { getSilhouetteStyle } from '../lib/map/silhouettes/styles.ts';

describe('Phase 2 — ICAO Type Code Mapping Engine', () => {
  it('covers at least 150 unique ICAO type designators directly', () => {
    const codes = Object.keys(ICAO_TYPE_MAP);
    assert.ok(
      codes.length >= 150,
      `Expected at least 150 mapped codes, got ${codes.length}`
    );
  });

  it('correctly maps prominent commercial narrowbodies', () => {
    assert.strictEqual(getAircraftCategory('A320'), 'narrowbody');
    assert.strictEqual(getAircraftCategory('A20N'), 'narrowbody');
    assert.strictEqual(getAircraftCategory('B738'), 'narrowbody');
    assert.strictEqual(getAircraftCategory('B38M'), 'narrowbody');
    assert.strictEqual(getAircraftCategory('BCS3'), 'narrowbody');
  });

  it('correctly maps prominent widebody twins', () => {
    assert.strictEqual(getAircraftCategory('B789'), 'widebody_twin');
    assert.strictEqual(getAircraftCategory('A359'), 'widebody_twin');
    assert.strictEqual(getAircraftCategory('B77W'), 'widebody_twin');
    assert.strictEqual(getAircraftCategory('A339'), 'widebody_twin');
  });

  it('correctly maps quads (A380, B747, A340)', () => {
    assert.strictEqual(getAircraftCategory('A388'), 'quad');
    assert.strictEqual(getAircraftCategory('B744'), 'quad');
    assert.strictEqual(getAircraftCategory('B748'), 'quad');
    assert.strictEqual(getAircraftCategory('A346'), 'quad');
  });

  it('correctly maps regional jets and turboprops', () => {
    assert.strictEqual(getAircraftCategory('E175'), 'regional_jet');
    assert.strictEqual(getAircraftCategory('CRJ9'), 'regional_jet');
    assert.strictEqual(getAircraftCategory('AT76'), 'turboprop');
    assert.strictEqual(getAircraftCategory('DH8D'), 'turboprop');
  });

  it('correctly maps bizjets, GA, helicopters, cargo, and military', () => {
    assert.strictEqual(getAircraftCategory('GL75'), 'bizjet');
    assert.strictEqual(getAircraftCategory('GLEX'), 'bizjet');
    assert.strictEqual(getAircraftCategory('C172'), 'light_ga');
    assert.strictEqual(getAircraftCategory('SR22'), 'light_ga');
    assert.strictEqual(getAircraftCategory('H145'), 'helicopter');
    assert.strictEqual(getAircraftCategory('AW139'), 'helicopter');
    assert.strictEqual(getAircraftCategory('B744F'), 'cargo');
    assert.strictEqual(getAircraftCategory('C17'), 'cargo');
    assert.strictEqual(getAircraftCategory('F35A'), 'military');
    assert.strictEqual(getAircraftCategory('EUFI'), 'military');
  });

  it('falls back to catalog metadata when code is unmapped in primary table', () => {
    // If a code is not in ICAO_TYPE_MAP but in AIRCRAFT_CATALOG
    assert.strictEqual(getAircraftCategory('C182'), 'light_ga');
    assert.strictEqual(getAircraftCategory('PA28'), 'light_ga');
  });

  it('falls back to prefix heuristics for family variants', () => {
    assert.strictEqual(getAircraftCategory('B737-MAX10'), 'narrowbody');
    assert.strictEqual(getAircraftCategory('A320-214'), 'narrowbody');
    assert.strictEqual(getAircraftCategory('A380-PLUS'), 'quad');
    assert.strictEqual(getAircraftCategory('C172S'), 'light_ga');
  });

  it('gracefully returns unknown for invalid or unknown strings', () => {
    assert.strictEqual(getAircraftCategory(null), 'unknown');
    assert.strictEqual(getAircraftCategory(undefined), 'unknown');
    assert.strictEqual(getAircraftCategory(''), 'unknown');
    assert.strictEqual(getAircraftCategory('XYZ999'), 'unknown');
  });
});

describe('Phase 2 — Aircraft Silhouettes & Visual Specifications', () => {
  const ALL_CATEGORIES: AircraftCategory[] = [
    'narrowbody',
    'widebody_twin',
    'quad',
    'regional_jet',
    'turboprop',
    'bizjet',
    'light_ga',
    'helicopter',
    'cargo',
    'military',
    'unknown',
  ];

  it('defines geometry for all 11 canonical categories', () => {
    for (const cat of ALL_CATEGORIES) {
      const silhouette = SILHOUETTES[cat];
      assert.ok(silhouette, `Missing silhouette definition for category ${cat}`);
      assert.strictEqual(silhouette.viewBox, '0 0 64 64');
      assert.ok(silhouette.bodyPath.length > 20, `Body path too short for ${cat}`);
    }
  });

  it('provides category metadata with dimensions and examples', () => {
    for (const cat of ALL_CATEGORIES) {
      const meta = AIRCRAFT_CATEGORIES[cat];
      assert.ok(meta, `Missing category metadata for ${cat}`);
      assert.ok(meta.typicalWingspanM > 0);
      assert.ok(meta.typicalLengthM > 0);
      assert.ok(meta.typicalHeightM > 0);
      assert.ok(meta.exampleModels.length > 0);
    }
  });

  it('implements correct style tokens across all 6 silhouette states', () => {
    const defaultStyle = getSilhouetteStyle('default');
    assert.strictEqual(defaultStyle.fill, '#0E1116');
    assert.strictEqual(defaultStyle.opacity, 1);

    const selectedStyle = getSilhouetteStyle('selected');
    assert.strictEqual(selectedStyle.fill, '#FF4F1F');
    assert.strictEqual(selectedStyle.stroke, '#FFFFFF');
    assert.strictEqual(selectedStyle.strokeWidth, 2);

    const staleStyle = getSilhouetteStyle('stale');
    assert.strictEqual(staleStyle.opacity, 0.4);

    const onGroundStyle = getSilhouetteStyle('on_ground');
    assert.strictEqual(onGroundStyle.fill, '#878D96');
    assert.strictEqual(onGroundStyle.scale, 0.8);

    const shadowStyle = getSilhouetteStyle('ground_shadow');
    assert.strictEqual(shadowStyle.fill, 'rgba(14, 17, 22, 0.12)');
  });
});

describe('Phase 2 — MapLibre Sprite Atlas Generation', () => {
  it('generates consistent canonical sprite IDs for all 66 category/state pairs', async () => {
    const {
      ALL_AIRCRAFT_CATEGORIES,
      ALL_SILHOUETTE_STATES,
      getAircraftSpriteId,
      generateSilhouetteSvgString,
    } = await import('../lib/map/spriteAtlas.ts');

    let count = 0;
    for (const cat of ALL_AIRCRAFT_CATEGORIES) {
      for (const st of ALL_SILHOUETTE_STATES) {
        count++;
        const id = getAircraftSpriteId(cat, st);
        assert.strictEqual(id, `ac-${cat}-${st}`);

        const svg = generateSilhouetteSvgString(cat, st, 64);
        assert.ok(svg.startsWith('<svg'), 'SVG must start with <svg tag');
        assert.ok(svg.includes('viewBox="0 0 64 64"'), 'SVG must have 64x64 viewBox');
        // Verify no dark theme colors
        assert.ok(!svg.includes('#000000'), 'Must not use pure black #000000');
        assert.ok(!svg.includes('#111827'), 'Must not use dark theme navy');
      }
    }
    assert.strictEqual(count, 66, 'Expected exactly 66 category/state combinations');
  });
});
