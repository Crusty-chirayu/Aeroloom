export interface AirportInfo {
  icao: string; // 4-letter ICAO code (e.g. "KJFK", "EGLL")
  iata: string; // 3-letter IATA code (e.g. "JFK", "LHR")
  name: string; // Full airport name (e.g. "John F. Kennedy International Airport")
  city: string; // Metropolitan area / city
  country: string; // Country name or ISO code
  latitude: number; // Decimal degrees
  longitude: number; // Decimal degrees
  elevationFt?: number; // Elevation above sea level in feet
  timezone?: string; // IANA timezone (e.g. "America/New_York")
}

export interface AirlineInfo {
  icao: string; // 3-letter ICAO operator code (e.g. "DAL", "BAW")
  iata?: string; // 2-letter IATA code (e.g. "DL", "BA")
  name: string; // Full airline name (e.g. "Delta Air Lines")
  callsignTelephony?: string; // Radio telephony callsign (e.g. "DELTA", "SPEEDBIRD")
  country: string;
}

export interface AircraftDetails {
  typeCode: string; // ICAO designator (e.g. "B738", "A20N")
  manufacturer: string; // e.g. "Boeing", "Airbus"
  model: string; // e.g. "737-800", "A320neo"
  category: 'Jet' | 'Turboprop' | 'Piston' | 'Helicopter' | 'Military' | 'Special';
  wakeClass: 'L' | 'M' | 'H' | 'J'; // Light, Medium, Heavy, Super
}

export interface FlightRoute {
  origin: AirportInfo;
  destination: AirportInfo;
  confidence: 'verified' | 'derived' | 'unresolved';
  provenance: string; // Source identifier (e.g. "OpenFlights Schedule Index", "Transponder Callout")
  distanceNm?: number;
}

export interface PositionSample {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  verticalRate?: number;
  timestamp: number;
}

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

  // Enriched metadata fields (populated via metadata and route resolvers)
  airline?: AirlineInfo;
  aircraftDetails?: AircraftDetails;
  route?: FlightRoute;
  positionHistory?: PositionSample[];
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
