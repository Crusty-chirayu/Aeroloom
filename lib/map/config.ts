/**
 * Aeroloom Flight Map Configuration
 *
 * Defines basemap styles, attribution requirements, default viewports,
 * and camera constraints for the MapLibre GL engine.
 */

export interface BasemapProvider {
  id: string;
  name: string;
  styleUrl: string;
  attribution: string;
  license: string;
  isDefault?: boolean;
}

export const BASEMAP_PROVIDERS: Record<string, BasemapProvider> = {
  cartoDark: {
    id: 'cartoDark',
    name: 'CARTO Dark Matter',
    styleUrl: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    attribution: '© CARTO, © OpenStreetMap contributors',
    license: 'Free for non-commercial / visualization with mandatory attribution',
    isDefault: true,
  },
  openFreeMapDark: {
    id: 'openFreeMapDark',
    name: 'OpenFreeMap Dark',
    styleUrl: 'https://tiles.openfreemap.org/styles/dark',
    attribution: '© OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors',
    license: 'Open-source community tiles (ODbL / CC-BY)',
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
