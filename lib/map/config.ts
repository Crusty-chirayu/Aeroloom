/**
 * Aeroloom Flight Map Configuration
 *
 * Defines basemap providers, default viewports, and camera constraints
 * for the MapLibre GL engine.
 *
 * NOTE: Dark basemap entries have been removed. Basemap config structure is retained.
 * The final light style choice and custom style JSON will be built in Phase 3.
 * Terms and attribution of candidate tile sources are documented in docs/data-sources.md.
 */

export interface BasemapProvider {
  id: string;
  name: string;
  /** Tile style JSON URL — to be finalized in Phase 3 */
  styleUrl: string;
  attribution: string;
  license: string;
  isDefault?: boolean;
}

/**
 * PHASE 3 NOTE: The light style is built in Phase 3.
 * Final choice, terms of service, and attribution will be recorded in docs/data-sources.md.
 *
 * Candidate light tile sources:
 * - OpenFreeMap Liberty: https://tiles.openfreemap.org/styles/liberty (ODbL, free, no token)
 * - CARTO Positron Light: https://basemaps.cartocdn.com/gl/positron-gl-style/style.json (CC-BY 4.0)
 */
export const BASEMAP_PROVIDERS: Record<string, BasemapProvider> = {
  lightPrimary: {
    id: 'lightPrimary',
    name: 'OpenFreeMap Liberty (Light Candidate)',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: '© OpenStreetMap contributors, © OpenFreeMap',
    license: 'ODbL (see docs/data-sources.md)',
    isDefault: true,
  },
  lightFallback: {
    id: 'lightFallback',
    name: 'CARTO Positron (Light Fallback Candidate)',
    styleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    attribution: '© CARTO, © OpenStreetMap contributors',
    license: 'CC-BY 4.0 (see docs/data-sources.md)',
  },
};

export interface AviationSector {
  id: string;
  label: string;
  iata: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  description: string;
}

export const AVIATION_SECTORS: AviationSector[] = [
  {
    id: 'ny-metro',
    label: 'New York Tracon',
    iata: 'JFK / EWR / LGA',
    center: [-73.95, 40.75],
    zoom: 9.5,
    pitch: 0,
    bearing: 0,
    description: 'High-density Northeast corridor airspace',
  },
  {
    id: 'socal',
    label: 'SoCal Tracon',
    iata: 'LAX / SAN / BUR',
    center: [-118.35, 33.95],
    zoom: 9.2,
    pitch: 0,
    bearing: 0,
    description: 'Pacific rim arrivals and departures',
  },
  {
    id: 'midwest',
    label: 'Chicago Center',
    iata: 'ORD / MDW',
    center: [-87.75, 41.9],
    zoom: 9.0,
    pitch: 0,
    bearing: 0,
    description: 'Midwest hub confluence',
  },
  {
    id: 'lon-metro',
    label: 'London TMA',
    iata: 'LHR / LGW / STN',
    center: [-0.25, 51.5],
    zoom: 9.2,
    pitch: 0,
    bearing: 0,
    description: 'European Atlantic gateway airspace',
  },
  {
    id: 'conus',
    label: 'Continental US',
    iata: 'CONUS',
    center: [-98.5795, 39.8283],
    zoom: 4.2,
    pitch: 0,
    bearing: 0,
    description: 'Transcontinental domestic radar sector',
  },
];

export const MAP_DEFAULTS = {
  initialSector: AVIATION_SECTORS[0], // NY Tracon
  minZoom: 2,
  maxZoom: 18,
  defaultPitch: 0,
  maxPitch: 60,
  dragRotate: true,
  touchPitch: true,
};
