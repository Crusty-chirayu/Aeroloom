/**
 * Aeroloom Light Custom MapLibre Style
 *
 * Authored to strict editorial aviation specifications (DESIGN_SPEC.md §8):
 * - Paper land (#F6F4EE)
 * - Soft pale-blue water (#DCE6F0)
 * - Hairline admin borders (rgba(14, 17, 22, 0.12))
 * - Muted typographic labels
 * - Minimalist transport network, emphasized aeronautical waypoints and airports
 * - Powered by OpenFreeMap ODbL permissive vector tiles (zero token, free infrastructure)
 */

import type { StyleSpecification } from 'maplibre-gl';

export const AEROLOOM_LIGHT_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'Aeroloom Editorial Light',
  metadata: {
    'aeroloom:designer': 'Antigravity Editorial Aviation',
    'aeroloom:palette': 'paper-marine-light',
  },
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
    // RainViewer Free Global Precipitation Radar Tile Source
    rainviewer: {
      type: 'raster',
      tiles: [
        'https://tilecache.rainviewer.com/v2/radar/nowcast_10/256/{z}/{x}/{y}/2/1_1.png',
      ],
      tileSize: 256,
      attribution: '© RainViewer',
    },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    // 1. Background Base — Editorial Paper
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#F6F4EE', // var(--paper)
      },
    },
    // 2. Water Polygons — Soft Pale Blue
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'intermittent', 1]],
      paint: {
        'fill-color': '#DCE6F0', // Spec marine wash
        'fill-opacity': 0.95,
      },
    },
    // 3. Waterway Lines — Subtle Stream Hairlines
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: {
        'line-color': '#DCE6F0',
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 1.5],
        'line-opacity': 0.8,
      },
    },
    // 4. Land Cover & Green Space — Barely Perceptible Tint
    {
      id: 'landcover',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['in', 'class', 'grass', 'wood', 'forest', 'park'],
      paint: {
        'fill-color': '#F0EFE6',
        'fill-opacity': 0.6,
      },
    },
    // 5. National & Marine Boundaries — Hairlines
    {
      id: 'boundary-country',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['<=', 'admin_level', 2], ['!=', 'maritime', 1]],
      paint: {
        'line-color': 'rgba(14, 17, 22, 0.16)', // --line-strong
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.75, 8, 1.25],
        'line-dasharray': [3, 2],
      },
    },
    {
      id: 'boundary-state',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['==', 'admin_level', 4], ['!=', 'maritime', 1]],
      paint: {
        'line-color': 'rgba(14, 17, 22, 0.08)', // --line
        'line-width': 0.5,
      },
    },
    // 6. Major Roads & Runways — Minimal Hairlines
    {
      id: 'transportation-major',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
      minzoom: 6,
      paint: {
        'line-color': 'rgba(14, 17, 22, 0.06)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 1.5],
      },
    },
    // Aeroway Runways & Taxiways — Emphasized on High Zoom
    {
      id: 'aeroway-runway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'aeroway',
      filter: ['==', 'class', 'runway'],
      minzoom: 9,
      paint: {
        'line-color': '#0E1116',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.5, 14, 6],
        'line-opacity': 0.8,
      },
    },
    {
      id: 'aeroway-taxiway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'aeroway',
      filter: ['==', 'class', 'taxiway'],
      minzoom: 11,
      paint: {
        'line-color': 'rgba(14, 17, 22, 0.25)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 14, 2.5],
      },
    },
    // 7. Geographic Labels — Clean Typography
    {
      id: 'place-country',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'country'],
      maxzoom: 6,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 1, 9, 5, 12],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.15,
      },
      paint: {
        'text-color': 'rgba(14, 17, 22, 0.35)',
        'text-halo-color': '#F6F4EE',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'place-city',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['in', 'class', 'city', 'town'],
      minzoom: 4,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 10, 13],
      },
      paint: {
        'text-color': '#0E1116',
        'text-halo-color': '#F6F4EE',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'place-airport',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'aeroway',
      filter: ['==', 'class', 'aerodrome'],
      minzoom: 8,
      layout: {
        'text-field': '{name:latin}',
        'text-font': ['Noto Sans Bold'],
        'text-size': 11,
        'text-letter-spacing': 0.05,
      },
      paint: {
        'text-color': '#C93A10', // --signal-ink
        'text-halo-color': '#FFE9E1',
        'text-halo-width': 2,
      },
    },
  ],
};

export function createAeroloomMapStyle(_options?: {
  showAirports?: boolean;
  showDayNight?: boolean;
  showRainViewer?: boolean;
}): StyleSpecification {
  return JSON.parse(JSON.stringify(AEROLOOM_LIGHT_MAP_STYLE));
}

