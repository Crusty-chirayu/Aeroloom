import type {
  AircraftDetails,
  AirlineInfo,
  AirportInfo,
  FlightRoute,
  PositionSample,
  AircraftPosition,
} from './positions/types.ts';

export type {
  AircraftDetails,
  AirlineInfo,
  AirportInfo,
  FlightRoute,
  PositionSample,
  AircraftPosition,
};

/**
 * Geographic bounding box.
 */
export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
  zoom?: number;
}

/**
 * Single historical or projected track telemetry point.
 */
export interface TrackPoint {
  lat: number;
  lon: number;
  altitudeFt: number;
  groundSpeedKt?: number;
  trackDeg?: number;
  verticalRateFpm?: number;
  timestamp: number;
}

/**
 * The canonical normalized aircraft representation per DESIGN_SPEC.md §5.
 * This is the primary telemetry entity consumed across all application surfaces.
 */
export interface AircraftState {
  id: string; // icao24 hex address (lowercase)
  callsign: string; // standard uppercase callsign
  registration?: string; // tail number (e.g. N12345)
  typeCode?: string; // ICAO aircraft type (e.g. B738, A20N)
  lat: number; // decimal degrees [-90, 90]
  lon: number; // decimal degrees [-180, 180]
  altitudeFt: number; // barometric altitude in feet (0 when onGround)
  groundSpeedKt: number; // speed in knots
  trackDeg: number; // true track/heading [0, 360)
  verticalRateFpm?: number; // climb/descent rate in feet per minute
  onGround: boolean; // true if weight-on-wheels / surface mode
  squawk?: string; // 4-digit transponder code (e.g. 7700)
  updatedAt: number; // Unix milliseconds
  ageSeconds?: number; // server-computed age relative to request time
  source: string; // provider identifier (e.g. 'airplanes.live', 'adsb.lol')

  // Enriched metadata fields
  airline?: AirlineInfo;
  aircraftDetails?: AircraftDetails;
  route?: FlightRoute;
  positionHistory?: PositionSample[];
}

/**
 * Flight Provider adapter interface per DESIGN_SPEC.md §5.
 * Swappable, testable, and chainable for upstream independence.
 */
export interface FlightProvider {
  readonly name: string;
  getAircraftInBounds(bounds: Bounds): Promise<AircraftState[]>;
  getAircraftByCallsign(callsignOrHex: string): Promise<AircraftState | null>;
  getTrack(id: string): Promise<TrackPoint[]>;
}

/**
 * Decoded meteorological observation report (METAR).
 */
export interface WeatherReport {
  icao: string;
  stationName?: string;
  rawMetar: string;
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  wind: {
    directionDeg: number;
    speedKt: number;
    gustKt?: number;
    variable?: boolean;
  };
  visibilitySm?: number;
  ceilingFt?: number;
  temperatureC?: number;
  dewpointC?: number;
  altimeterInHg?: number;
  observationTime?: string;
  summary: string;
}

/**
 * Grouped multi-entity omni-search result.
 */
export interface SearchResults {
  query: string;
  flights: AircraftState[];
  airports: AirportInfo[];
  airlines: AirlineInfo[];
  total: number;
}

/**
 * Unified, typed API response envelope.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  cached?: boolean;
  cacheAgeMs?: number;
  degraded?: boolean;
  provider?: string;
}

/**
 * Converts legacy AircraftPosition to canonical AircraftState.
 */
export function toAircraftState(pos: AircraftPosition, now: number = Date.now()): AircraftState {
  const safeTimestamp = pos.timestamp < 1e11 ? pos.timestamp * 1000 : pos.timestamp;
  const safeNow = now < 1e11 ? now * 1000 : now;
  const ageSeconds = Math.max(0, Math.round((safeNow - safeTimestamp) / 1000));
  return {
    id: pos.id.toLowerCase(),
    callsign: pos.callsign,
    registration: pos.registration,
    typeCode: pos.aircraftType,
    lat: pos.latitude,
    lon: pos.longitude,
    altitudeFt: pos.altitude,
    groundSpeedKt: pos.speed,
    trackDeg: pos.heading,
    verticalRateFpm: pos.verticalRate,
    onGround: Boolean(pos.isGround),
    squawk: pos.squawk,
    updatedAt: safeTimestamp,
    ageSeconds,
    source: pos.source,
    airline: pos.airline,
    aircraftDetails: pos.aircraftDetails,
    route: pos.route,
    positionHistory: pos.positionHistory,
  };
}

/**
 * Converts canonical AircraftState back to AircraftPosition for backward compatibility.
 */
export function toAircraftPosition(state: AircraftState): AircraftPosition {
  return {
    id: state.id,
    callsign: state.callsign,
    registration: state.registration,
    aircraftType: state.typeCode,
    latitude: state.lat,
    longitude: state.lon,
    altitude: state.altitudeFt,
    heading: state.trackDeg,
    speed: state.groundSpeedKt,
    verticalRate: state.verticalRateFpm,
    squawk: state.squawk,
    timestamp: state.updatedAt,
    source: (state.source as 'airplanes.live' | 'adsb-open' | 'fixture') || 'airplanes.live',
    isGround: state.onGround,
    airline: state.airline,
    aircraftDetails: state.aircraftDetails,
    route: state.route,
    positionHistory: state.positionHistory,
  };
}
