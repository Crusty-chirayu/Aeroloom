export interface AircraftPosition {
  id: string; // ICAO 24-bit hex address (e.g. "a38d95")
  callsign: string; // Flight callsign (e.g. "UAL123", "REH35")
  registration?: string; // Tail registration number (e.g. "N328RX")
  aircraftType?: string; // Type designator (e.g. "B738", "A321")
  latitude: number; // Decimal degrees
  longitude: number; // Decimal degrees
  altitude: number; // Barometric or geometric altitude in feet
  heading: number; // Track / heading in degrees (0-360)
  speed: number; // Ground speed in knots
  verticalRate?: number; // Feet per minute climb/descent
  squawk?: string; // 4-digit transponder code
  timestamp: number; // Milliseconds Unix epoch
  source: 'airplanes.live' | 'adsb-open' | 'fixture';
  isGround?: boolean;
}

export interface BoundingBox {
  southLat: number;
  northLat: number;
  westLon: number;
  eastLon: number;
}

export interface PositionQuery {
  lat: number;
  lon: number;
  radiusNm: number;
}

export interface ProviderResponse {
  success: boolean;
  aircraft: AircraftPosition[];
  timestamp: number;
  totalFound: number;
  provider: string;
  error?: string;
  contactRequired?: boolean;
}
