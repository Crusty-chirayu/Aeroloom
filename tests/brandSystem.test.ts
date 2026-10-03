import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BRAND_TOKENS } from '../lib/brand/brandTokens.ts';
import { siteConfig } from '../lib/site-config.ts';

describe('Brand System & Assets Verification (Part G)', () => {
  test('brand tokens match design specification and siteConfig', () => {
    assert.equal(BRAND_TOKENS.name, siteConfig.name);
    assert.equal(BRAND_TOKENS.colors.paper, '#F6F4EE');
    assert.equal(BRAND_TOKENS.colors.ink, '#0E1116');
    assert.equal(BRAND_TOKENS.colors.signal, '#FF4F1F');
    assert.equal(BRAND_TOKENS.mark.gridSize, 32);
    assert.ok(BRAND_TOKENS.mark.weftPath.startsWith('M 5 24'));
  });

  test('SVG favicon exists, is valid SVG and includes warm paper rect and mark', () => {
    const iconPath = join(process.cwd(), 'app', 'icon.svg');
    assert.ok(existsSync(iconPath), 'app/icon.svg must exist');
    const content = readFileSync(iconPath, 'utf-8');
    assert.ok(content.includes('<svg'), 'must contain svg tag');
    assert.ok(content.includes('width="32"'), 'must specify 32px width');
    assert.ok(content.includes('height="32"'), 'must specify 32px height');
    assert.ok(content.includes('#F6F4EE'), 'must include warm paper backing');
    assert.ok(content.includes('#FF4F1F'), 'must include vermilion beacon');
  });

  test('apple-icon.tsx and manifest.ts exist in app directory', () => {
    const appleIconPath = join(process.cwd(), 'app', 'apple-icon.tsx');
    const manifestPath = join(process.cwd(), 'app', 'manifest.ts');
    assert.ok(existsSync(appleIconPath), 'app/apple-icon.tsx must exist');
    assert.ok(existsSync(manifestPath), 'app/manifest.ts must exist');

    const manifestContent = readFileSync(manifestPath, 'utf-8');
    assert.ok(manifestContent.includes('#F6F4EE'), 'manifest must specify #F6F4EE theme_color');
  });

  test('OpenGraph card generators exist for home, flight, and airport routes', () => {
    const rootOg = join(process.cwd(), 'app', 'opengraph-image.tsx');
    const flightOg = join(process.cwd(), 'app', 'flight', '[flightId]', 'opengraph-image.tsx');
    const airportOg = join(process.cwd(), 'app', 'airport', '[code]', 'opengraph-image.tsx');

    assert.ok(existsSync(rootOg), 'app/opengraph-image.tsx must exist');
    assert.ok(existsSync(flightOg), 'app/flight/[flightId]/opengraph-image.tsx must exist');
    assert.ok(existsSync(airportOg), 'app/airport/[code]/opengraph-image.tsx must exist');

    const rootContent = readFileSync(rootOg, 'utf-8');
    assert.ok(rootContent.includes('#F6F4EE'));
    assert.ok(rootContent.includes('#FF4F1F'));
  });

  test('docs/BRAND.md exists with comprehensive guidelines', () => {
    const brandDocPath = join(process.cwd(), 'docs', 'BRAND.md');
    assert.ok(existsSync(brandDocPath), 'docs/BRAND.md must exist');
    const docContent = readFileSync(brandDocPath, 'utf-8');
    assert.ok(docContent.includes('Editorial Aviation'));
    assert.ok(docContent.includes('Weft Thread'));
    assert.ok(docContent.includes('Warp Thread'));
    assert.ok(docContent.includes('#FF4F1F'));
    assert.ok(docContent.includes('Clear Space'));
  });
});
