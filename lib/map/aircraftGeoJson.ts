/**
 * Aeroloom Aircraft GeoJSON & Telemetry Formatter
 *
 * Converts normalized AircraftPosition records into MapLibre-compatible
 * GeoJSON FeatureCollections with precalculated styling properties,
 * telemetry badges, and flight status classifications.
 */

import type { AircraftPosition } from '@/lib/providers/positions/types';

export interface AircraftGeoJsonProperties {
  id: string;
  callsign: string;
  registration: string;
  aircraftType: string;
  altitude: number;
  altitudeDisplay: string;
  telemetryLabel: string;
  speed: number;
  speedDisplay: string;
  heading: number;
  verticalRate: number;
  verticalRateDisplay: string;
  squawk: string;
  isGround: boolean;
  statusColor: string; // '#38bdf8' | '#10b981' | '#f59e0b' | '#ef4444'
  isSelected: boolean;
}

export type AircraftGeoJsonFeature = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: AircraftGeoJsonProperties;
};

export type AircraftFeatureCollection = {
  type: 'FeatureCollection';
  features: AircraftGeoJsonFeature[];
};

/**
 * Format altitude for tactical callout:
 * >= 18,000 ft -> Flight Level (FL180, FL350)
 * < 18,000 ft -> Comma formatted ft (2,400 FT)
 * On ground -> GND
 */
export function formatAltitude(altitude: number, isGround?: boolean): string {
  if (isGround || altitude <= 0) return 'GND';
  if (altitude >= 18000) {
    const fl = Math.round(altitude / 100);
    return `FL${fl}`;
  }
  return `${altitude.toLocaleString()} FT`;
}

/**
 * Format speed for tactical callout: '420 KTS'
 */
export function formatSpeed(speed: number): string {
  if (speed <= 0 || isNaN(speed)) return '0 KTS';
  return `${Math.round(speed)} KTS`;
}

/**
 * Format vertical rate (climb/descent): '+1,800 FPM', '-2,200 FPM', or 'LEVEL'
 */
export function formatVerticalRate(vrate?: number): string {
  if (vrate === undefined || Math.abs(vrate) < 64) return 'LEVEL';
  const sign = vrate > 0 ? '+' : '';
  return `${sign}${Math.round(vrate).toLocaleString()} FPM`;
}

/**
 * Normalizes heading to 0-359.9°
 */
export function normalizeHeading(heading?: number): number {
  if (heading === undefined || isNaN(heading)) return 0;
  const normalized = ((heading % 360) + 360) % 360;
  return Number(normalized.toFixed(1));
}

/**
 * Determines status color based on flight dynamics:
 * - Red: Emergency squawk (7700, 7600, 7500)
 * - Amber: Active climb or descent (> 400 fpm)
 * - Emerald: Cruising level (>= 10,000 ft and level)
 * - Cyan: Standard active flight / ground taxi
 */
export function getStatusColor(aircraft: AircraftPosition): string {
  if (aircraft.squawk === '7700' || aircraft.squawk === '7600' || aircraft.squawk === '7500') {
    return '#ef4444'; // Crimson emergency
  }
  if (aircraft.verticalRate && Math.abs(aircraft.verticalRate) > 400) {
    return '#f59e0b'; // Amber climb/descent
  }
  if (!aircraft.isGround && aircraft.altitude >= 10000) {
    return '#10b981'; // Emerald cruise
  }
  return '#38bdf8'; // Aero Cyan standard
}

/**
 * Transforms an array of AircraftPosition records into a GeoJSON FeatureCollection.
 * Safely filters out null, corrupted, or out-of-bounds coordinates.
 */
export function aircraftToGeoJson(
  aircraftList: AircraftPosition[],
  selectedId: string | null = null,
  searchFilter: string = ''
): AircraftFeatureCollection {
  if (!Array.isArray(aircraftList)) {
    return { type: 'FeatureCollection', features: [] };
  }

  const query = searchFilter.trim().toUpperCase();

  const features: AircraftGeoJsonFeature[] = [];

  for (const ac of aircraftList) {
    if (!ac) continue;

    // Validate geographic coordinates
    const lat = ac.latitude;
    const lng = ac.longitude;

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      continue;
    }

    const callsign = (ac.callsign || ac.id || 'UNID').trim().toUpperCase();
    const hex = (ac.id || '').trim().toUpperCase();

    // Apply callsign / hex search filter if provided
    if (query && !callsign.includes(query) && !hex.includes(query)) {
      continue;
    }

    const altitudeDisplay = formatAltitude(ac.altitude, ac.isGround);
    const speedDisplay = formatSpeed(ac.speed);
    const verticalRateDisplay = formatVerticalRate(ac.verticalRate);
    const heading = normalizeHeading(ac.heading);
    const isSelected = selectedId !== null && (ac.id === selectedId || callsign === selectedId);

    // Multi-line telemetry label for symbol layer
    const telemetryLabel = ac.isGround
      ? 'GND'
      : `${altitudeDisplay} • ${speedDisplay}`;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
      },
      properties: {
        id: ac.id,
        callsign,
        registration: ac.registration || '',
        aircraftType: ac.aircraftType || 'GENERIC',
        altitude: ac.altitude,
        altitudeDisplay,
        telemetryLabel,
        speed: ac.speed,
        speedDisplay,
        heading,
        verticalRate: ac.verticalRate || 0,
        verticalRateDisplay,
        squawk: ac.squawk || '----',
        isGround: ac.isGround ?? false,
        statusColor: getStatusColor(ac),
        isSelected,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
