import { test, describe } from 'node:test';
import assert from 'node:assert';
import { BASEMAP_PROVIDERS, AVIATION_SECTORS, MAP_DEFAULTS } from '../lib/map/config.ts';

describe('MapLibre configuration & sector validation', () => {
  test('basemap providers have valid HTTPS style URLs and licensing attribution', () => {
    const providers = Object.values(BASEMAP_PROVIDERS);
    assert.ok(providers.length >= 2, 'Should offer at least primary and fallback providers');

    for (const provider of providers) {
      assert.ok(provider.id && typeof provider.id === 'string', 'Provider must have an id');
      assert.ok(provider.name && typeof provider.name === 'string', 'Provider must have a name');
      assert.ok(
        provider.styleUrl.startsWith('https://'),
        `Provider ${provider.id} styleUrl must be HTTPS: ${provider.styleUrl}`
      );
      assert.ok(
        provider.attribution.length > 5,
        `Provider ${provider.id} must have non-empty attribution for license compliance`
      );
      assert.ok(
        provider.license.length > 5,
        `Provider ${provider.id} must document license/usage terms`
      );
    }
  });

  test('default basemap provider is configured with OpenStreetMap attribution', () => {
    const defaultProvider = BASEMAP_PROVIDERS.lightPrimary;
    assert.ok(defaultProvider, 'lightPrimary must exist');
    assert.strictEqual(defaultProvider.isDefault, true);
    assert.ok(defaultProvider.attribution.includes('OpenStreetMap'));
  });

  test('fallback basemap provider is configured with valid attribution', () => {
    const fallback = BASEMAP_PROVIDERS.lightFallback;
    assert.ok(fallback, 'lightFallback must exist');
    assert.ok(fallback.attribution.includes('OpenStreetMap') || fallback.attribution.includes('CARTO'));
  });

  test('all aviation sectors have valid WGS84 coordinates and zoom levels', () => {
    assert.ok(AVIATION_SECTORS.length >= 4, 'Must have at least 4 predefined sectors');

    for (const sector of AVIATION_SECTORS) {
      const [lng, lat] = sector.center;
      assert.ok(
        lng >= -180 && lng <= 180,
        `Sector ${sector.id} longitude ${lng} must be between -180 and 180`
      );
      assert.ok(
        lat >= -90 && lat <= 90,
        `Sector ${sector.id} latitude ${lat} must be between -90 and 90`
      );
      assert.ok(
        sector.zoom >= MAP_DEFAULTS.minZoom && sector.zoom <= MAP_DEFAULTS.maxZoom,
        `Sector ${sector.id} zoom ${sector.zoom} must be within bounds`
      );
      assert.ok(sector.iata.length >= 3, `Sector ${sector.id} must have IATA label`);
      assert.ok(sector.label.length >= 3, `Sector ${sector.id} must have readable label`);
    }
  });

  test('MAP_DEFAULTS defines standard constraints', () => {
    assert.strictEqual(MAP_DEFAULTS.minZoom, 2);
    assert.strictEqual(MAP_DEFAULTS.maxZoom, 18);
    assert.strictEqual(MAP_DEFAULTS.defaultPitch, 0);
    assert.strictEqual(MAP_DEFAULTS.dragRotate, true);
    assert.ok(MAP_DEFAULTS.initialSector);
    assert.strictEqual(MAP_DEFAULTS.initialSector.id, 'ny-metro');
  });
});
