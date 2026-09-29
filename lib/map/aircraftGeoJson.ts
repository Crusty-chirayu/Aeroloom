/**
 * Aeroloom Aircraft GeoJSON & Altitude Strata Engine
 *
 * Converts normalized AircraftPosition records into MapLibre-compatible
 * GeoJSON FeatureCollections with altitude strata classification,
 * progressive disclosure flags, and clutter reduction metrics.
 */

import type { AircraftPosition } from '@/lib/providers/positions/types';

export type AltitudeStrata = 'stratosphere' | 'cruise' | 'terminal' | 'ground';

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
  statusColor: string; // '#38bdf8' | '#10b981' | '#f59e0b' | '#ef4444' | '#818cf8'
  strata: AltitudeStrata;
  isEmergency: boolean;
  isClimbingOrDescending: boolean;
  shouldShowLabel: boolean;
  labelPriority: number;
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

export interface AirspaceClutterMetrics {
  totalAircraft: number;
  stratosphereCount: number;
  cruiseCount: number;
  terminalCount: number;
  groundCount: number;
  emergencyCount: number;
  baselineUnfilteredLabelCount: number;
  strataFilteredLabelCount: number;
  labelReductionRatio: number; // e.g. 0.70 = 70% reduction
}

/**
 * Classifies flight into altitude strata:
 * - stratosphere: >= 28,000 ft (high altitude jet routes / FL280+)
 * - cruise: 18,000 to 27,999 ft (FL180 to FL280)
 * - terminal: 1,000 to 17,999 ft (approach, departure, low altitude vectors)
 * - ground: < 1,000 ft with ground status or alt <= 0
 */
export function classifyAltitudeStrata(altitude: number, isGround?: boolean): AltitudeStrata {
  if (isGround || altitude <= 0) return 'ground';
  if (altitude >= 28000) return 'stratosphere';
  if (altitude >= 18000) return 'cruise';
  return 'terminal';
}

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
 * Determines status color based on flight dynamics and strata:
 * - Crimson: Emergency squawk (7700, 7600, 7500)
 * - Amber: Active climb or descent (> 400 fpm)
 * - Emerald: Cruising level in mid-altitude (18,000 - 27,999 ft)
 * - Violet: High stratosphere flight (>= 36,000 ft)
 * - Cyan: Standard active flight / terminal approach
 */
export function getStatusColor(aircraft: AircraftPosition): string {
  if (aircraft.squawk === '7700' || aircraft.squawk === '7600' || aircraft.squawk === '7500') {
    return '#ef4444'; // Crimson emergency
  }
  if (aircraft.verticalRate && Math.abs(aircraft.verticalRate) > 400) {
    return '#f59e0b'; // Amber climb/descent
  }
  if (!aircraft.isGround && aircraft.altitude >= 36000) {
    return '#818cf8'; // Violet high stratosphere
  }
  if (!aircraft.isGround && aircraft.altitude >= 18000) {
    return '#10b981'; // Emerald cruise
  }
  return '#38bdf8'; // Aero Cyan standard
}

export type FlightCategoryFilter = 'ALL' | 'CRUISE' | 'CLIMB' | 'GROUND' | 'EMERGENCY';

/**
 * Evaluates whether an aircraft matches the tactical category filter
 */
export function matchesFlightFilter(ac: AircraftPosition, filter: FlightCategoryFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'CRUISE') return ac.altitude >= 18000 && !ac.isGround;
  if (filter === 'CLIMB') return !!(ac.verticalRate && Math.abs(ac.verticalRate) > 400);
  if (filter === 'GROUND') return ac.isGround || ac.altitude <= 0;
  if (filter === 'EMERGENCY') return ac.squawk === '7700' || ac.squawk === '7600' || ac.squawk === '7500';
  return true;
}

/**
 * Transforms an array of AircraftPosition records into an Altitude-Strata
 * GeoJSON FeatureCollection with progressive disclosure parameters.
 */
export function aircraftToGeoJson(
  aircraftList: AircraftPosition[],
  selectedId: string | null = null,
  searchFilter: string = '',
  activeFilter: FlightCategoryFilter = 'ALL'
): AircraftFeatureCollection {
  if (!Array.isArray(aircraftList)) {
    return { type: 'FeatureCollection', features: [] };
  }

  const query = searchFilter.trim().toUpperCase();
  const features: AircraftGeoJsonFeature[] = [];

  for (const ac of aircraftList) {
    if (!ac) continue;

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
    const isSelected = selectedId !== null && (ac.id === selectedId || callsign === selectedId);

    // Filter by active category filter (preserve selected flight)
    if (!isSelected && !matchesFlightFilter(ac, activeFilter)) {
      continue;
    }

    // Search query filter (matches callsign, hex, or registration)
    if (
      query &&
      !callsign.includes(query) &&
      !hex.includes(query) &&
      (!ac.registration || !ac.registration.toUpperCase().includes(query))
    ) {
      continue;
    }

    const altitude = ac.altitude || 0;
    const isGround = ac.isGround ?? false;
    const strata = classifyAltitudeStrata(altitude, isGround);
    const isEmergency = ac.squawk === '7700' || ac.squawk === '7600' || ac.squawk === '7500';
    const isClimbingOrDescending = !!(ac.verticalRate && Math.abs(ac.verticalRate) > 400);

    const altitudeDisplay = formatAltitude(altitude, isGround);
    const speedDisplay = formatSpeed(ac.speed);
    const verticalRateDisplay = formatVerticalRate(ac.verticalRate);
    const heading = normalizeHeading(ac.heading);

    // Multi-line telemetry label
    const telemetryLabel = isGround
      ? 'GND'
      : `${altitudeDisplay} • ${speedDisplay}`;

    // Clutter Reduction & Progressive Disclosure Priority:
    // - Emergencies and Selected always get max priority (100 / 90)
    // - Active climbs/descents in terminal airspace get priority (70)
    // - High-altitude level cruise flights get low label priority (30) so chevrons remain uncluttered
    // - Ground traffic gets priority 10
    let labelPriority = 50;
    let shouldShowLabel = false;

    if (isEmergency) {
      labelPriority = 100;
      shouldShowLabel = true;
    } else if (isSelected) {
      labelPriority = 95;
      shouldShowLabel = true;
    } else if (query && (callsign.includes(query) || hex.includes(query))) {
      labelPriority = 90;
      shouldShowLabel = true;
    } else if (isClimbingOrDescending) {
      labelPriority = 75;
      shouldShowLabel = true;
    } else if (strata === 'terminal') {
      labelPriority = 60;
      shouldShowLabel = true;
    } else if (strata === 'stratosphere' || strata === 'cruise') {
      // High-altitude level flight: chevron is shown, text label is withheld in dense sectors
      labelPriority = 30;
      shouldShowLabel = false;
    } else {
      labelPriority = 10;
      shouldShowLabel = false;
    }

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
        altitude,
        altitudeDisplay,
        telemetryLabel,
        speed: ac.speed,
        speedDisplay,
        heading,
        verticalRate: ac.verticalRate || 0,
        verticalRateDisplay,
        squawk: ac.squawk || '----',
        isGround,
        statusColor: getStatusColor(ac),
        strata,
        isEmergency,
        isClimbingOrDescending,
        shouldShowLabel,
        labelPriority,
        isSelected,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Calculates empirical airspace clutter metrics on a set of GeoJSON features
 * comparing baseline unconstrained label rendering against progressive strata filtering.
 */
export function calculateClutterMetrics(
  collection: AircraftFeatureCollection
): AirspaceClutterMetrics {
  const features = collection.features;
  const total = features.length;

  if (total === 0) {
    return {
      totalAircraft: 0,
      stratosphereCount: 0,
      cruiseCount: 0,
      terminalCount: 0,
      groundCount: 0,
      emergencyCount: 0,
      baselineUnfilteredLabelCount: 0,
      strataFilteredLabelCount: 0,
      labelReductionRatio: 0,
    };
  }

  let stratosphereCount = 0;
  let cruiseCount = 0;
  let terminalCount = 0;
  let groundCount = 0;
  let emergencyCount = 0;
  let strataFilteredLabelCount = 0;

  for (const f of features) {
    const p = f.properties;
    if (p.strata === 'stratosphere') stratosphereCount++;
    else if (p.strata === 'cruise') cruiseCount++;
    else if (p.strata === 'terminal') terminalCount++;
    else if (p.strata === 'ground') groundCount++;

    if (p.isEmergency) emergencyCount++;
    if (p.shouldShowLabel) strataFilteredLabelCount++;
  }

  // Baseline: every airborne aircraft attempts to draw a label
  const baselineUnfiltered = features.filter((f) => !f.properties.isGround).length;
  const reduction = baselineUnfiltered > 0
    ? Number(((baselineUnfiltered - strataFilteredLabelCount) / baselineUnfiltered).toFixed(2))
    : 0;

  return {
    totalAircraft: total,
    stratosphereCount,
    cruiseCount,
    terminalCount,
    groundCount,
    emergencyCount,
    baselineUnfilteredLabelCount: baselineUnfiltered,
    strataFilteredLabelCount,
    labelReductionRatio: Math.max(0, reduction),
  };
}
