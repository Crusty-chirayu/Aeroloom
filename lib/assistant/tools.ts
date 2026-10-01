import { getDefaultFlightProvider } from '../providers/chainedFlightProvider.ts';
import { GLOBAL_AIRPORTS } from '../airports/airportData.ts';
import { performOmniSearch } from '../search/searchEngine.ts';
import { normalizeAviationWeatherReport, type AviationWeatherGovMetar } from '../weather/metarDecoder.ts';
import { getCacheService } from '../cache/index.ts';
import type { AircraftState, WeatherReport, AirportInfo, Bounds } from '../providers/types.ts';
import type { AssistantToolSource } from './types.ts';

export interface GetFlightResult {
  found: boolean;
  flight?: AircraftState;
  summary: string;
}

export interface SearchFlightsResult {
  flights: AircraftState[];
  airports: AirportInfo[];
  summary: string;
}

export interface GetAirportWeatherResult {
  found: boolean;
  weather?: WeatherReport;
  rawMetar?: string;
  summary: string;
}

export interface GetAirportTrafficResult {
  found: boolean;
  count: number;
  airport?: AirportInfo;
  aircraft: AircraftState[];
  summary: string;
}

export interface FlightContextResult {
  found: boolean;
  flight?: AircraftState;
  destinationAirport?: AirportInfo;
  destinationWeather?: WeatherReport;
  summary: string;
}

/**
 * Tool 1: getFlight
 * Resolves a live airborne aircraft by ICAO 24-bit hex or commercial callsign.
 */
export async function getFlight(idOrCallsign: string): Promise<{ result: GetFlightResult; source: AssistantToolSource }> {
  const clean = idOrCallsign.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const timestamp = Date.now();
  const source: AssistantToolSource = {
    tool: 'getFlight',
    query: clean,
    timestamp,
    summary: `Lookup flight/hex: ${clean}`,
  };

  if (!clean) {
    return {
      result: { found: false, summary: 'No valid callsign or hex provided.' },
      source,
    };
  }

  try {
    const provider = getDefaultFlightProvider();
    const flight = await provider.getAircraftByCallsign(clean);
    if (!flight) {
      return {
        result: {
          found: false,
          summary: `Flight '${clean}' is not currently tracked as airborne in active ADS-B coverage.`,
        },
        source,
      };
    }

    const altitudeStr = flight.altitudeFt ? `${flight.altitudeFt.toLocaleString()} ft` : 'Altitude unknown';
    const speedStr = flight.groundSpeedKt ? `${flight.groundSpeedKt} kts` : 'Speed unknown';
    const headingStr = flight.trackDeg !== undefined ? `track ${flight.trackDeg}°` : '';
    const routeStr = flight.route?.origin?.iata && flight.route?.destination?.iata
      ? `en route ${flight.route.origin.iata} -> ${flight.route.destination.iata}`
      : '';
    const squawkStr = flight.squawk ? `Squawk ${flight.squawk}` : '';

    const summary = [
      `Callsign ${flight.callsign || flight.id}`,
      routeStr,
      altitudeStr,
      speedStr,
      headingStr,
      squawkStr,
    ].filter(Boolean).join(', ');

    return {
      result: { found: true, flight, summary },
      source,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lookup failed';
    return {
      result: { found: false, summary: `Error querying telemetry for ${clean}: ${errorMsg}` },
      source,
    };
  }
}

/**
 * Tool 2: searchFlights
 * Executes omni-search matching callsigns, airlines, and airports.
 */
export async function searchFlights(query: string): Promise<{ result: SearchFlightsResult; source: AssistantToolSource }> {
  const clean = query.trim().toUpperCase();
  const timestamp = Date.now();
  const source: AssistantToolSource = {
    tool: 'searchFlights',
    query: clean,
    timestamp,
    summary: `Search for '${clean}'`,
  };

  try {
    const searchRes = await performOmniSearch(clean, 4);
    const summary = `Found ${searchRes.flights.length} flights, ${searchRes.airports.length} airports, ${searchRes.airlines.length} airlines matching '${clean}'.`;

    return {
      result: {
        flights: searchRes.flights,
        airports: searchRes.airports,
        summary,
      },
      source,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Search error';
    return {
      result: {
        flights: [],
        airports: [],
        summary: `Search failed: ${errorMsg}`,
      },
      source,
    };
  }
}

/**
 * Tool 3: getAirportWeather
 * Retrieves verified NOAA METAR and FAA flight category for an airport ICAO code.
 */
export async function getAirportWeather(icao: string): Promise<{ result: GetAirportWeatherResult; source: AssistantToolSource }> {
  const cleanIcao = icao.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const timestamp = Date.now();
  const source: AssistantToolSource = {
    tool: 'getAirportWeather',
    query: cleanIcao,
    timestamp,
    summary: `Weather METAR for ${cleanIcao}`,
  };

  if (!cleanIcao || cleanIcao.length < 3 || cleanIcao.length > 4) {
    return {
      result: { found: false, summary: 'Invalid airport ICAO code.' },
      source,
    };
  }

  const cacheKey = `weather_${cleanIcao}`;
  const cache = getCacheService();
  const cached = await cache.get<WeatherReport>(cacheKey);
  if (cached) {
    return {
      result: {
        found: true,
        weather: cached,
        rawMetar: cached.rawMetar,
        summary: `${cleanIcao}: ${cached.flightCategory} · ${cached.summary}`,
      },
      source,
    };
  }

  try {
    const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${cleanIcao}&format=json`, {
      headers: { 'User-Agent': 'Aeroloom-FlightTracker/0.1.0' },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = (await res.json()) as AviationWeatherGovMetar[];
      if (Array.isArray(data) && data.length > 0) {
        const decoded = normalizeAviationWeatherReport(cleanIcao, data[0]);
        await cache.set(cacheKey, decoded, 60);
        return {
          result: {
            found: true,
            weather: decoded,
            rawMetar: decoded.rawMetar,
            summary: `${cleanIcao}: ${decoded.flightCategory} · ${decoded.summary}`,
          },
          source,
        };
      }
    }

    return {
      result: {
        found: false,
        summary: `No active METAR weather observation found for ${cleanIcao}.`,
      },
      source,
    };
  } catch {
    return {
      result: {
        found: false,
        summary: `Aviation meteorological service unreachable for ${cleanIcao}.`,
      },
      source,
    };
  }
}

/**
 * Tool 4: getAirportTraffic
 * Retrieves live airborne traffic within vicinity radius of specified airport.
 */
export async function getAirportTraffic(icao: string, radiusNm: number = 30): Promise<{ result: GetAirportTrafficResult; source: AssistantToolSource }> {
  const cleanIcao = icao.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const timestamp = Date.now();
  const source: AssistantToolSource = {
    tool: 'getAirportTraffic',
    query: `${cleanIcao} (${radiusNm} NM)`,
    timestamp,
    summary: `Traffic radius ${radiusNm} NM around ${cleanIcao}`,
  };

  const airport = GLOBAL_AIRPORTS.find(
    (a) => a.icao.toUpperCase() === cleanIcao || a.iata.toUpperCase() === cleanIcao
  );

  if (!airport) {
    return {
      result: {
        found: false,
        count: 0,
        aircraft: [],
        summary: `Airport code '${cleanIcao}' not found in global airport database.`,
      },
      source,
    };
  }

  try {
    const provider = getDefaultFlightProvider();
    const latDelta = radiusNm / 60;
    const lonDelta = radiusNm / (60 * Math.max(0.1, Math.cos((airport.latitude * Math.PI) / 180)));
    const bounds: Bounds = {
      south: airport.latitude - latDelta,
      north: airport.latitude + latDelta,
      west: airport.longitude - lonDelta,
      east: airport.longitude + lonDelta,
    };

    const traffic = await provider.getAircraftInBounds(bounds);
    const summary = `${traffic.length} active aircraft tracked within ${radiusNm} NM of ${airport.name} (${airport.icao}/${airport.iata}).`;

    return {
      result: {
        found: true,
        count: traffic.length,
        airport,
        aircraft: traffic.slice(0, 10), // Limit payload
        summary,
      },
      source,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Telemetry failure';
    return {
      result: {
        found: false,
        count: 0,
        airport,
        aircraft: [],
        summary: `Failed to retrieve airport traffic: ${errorMsg}`,
      },
      source,
    };
  }
}

/**
 * Tool 5: getSelectedFlightContext
 * Retrieves comprehensive dossier context for a specific flight, including destination weather.
 */
export async function getSelectedFlightContext(idOrCallsign: string): Promise<{ result: FlightContextResult; source: AssistantToolSource }> {
  const { result: flightRes, source } = await getFlight(idOrCallsign);
  source.tool = 'getSelectedFlightContext';

  if (!flightRes.found || !flightRes.flight) {
    return {
      result: {
        found: false,
        summary: flightRes.summary,
      },
      source,
    };
  }

  const flight = flightRes.flight;
  let destinationAirport: AirportInfo | undefined;
  let destinationWeather: WeatherReport | undefined;

  const destCode = flight.route?.destination?.icao || flight.route?.destination?.iata;
  if (destCode) {
    const upperDest = destCode.toUpperCase();
    destinationAirport = GLOBAL_AIRPORTS.find(
      (a) => a.icao.toUpperCase() === upperDest || a.iata.toUpperCase() === upperDest
    );

    if (destinationAirport) {
      const weatherRes = await getAirportWeather(destinationAirport.icao);
      if (weatherRes.result.found) {
        destinationWeather = weatherRes.result.weather;
      }
    }
  }

  const parts = [
    `Aircraft ${flight.callsign || flight.id} (${flight.typeCode || 'Unknown type'})`,
    flight.route?.origin?.iata && flight.route?.destination?.iata
      ? `Route: ${flight.route.origin.iata} -> ${flight.route.destination.iata}`
      : null,
    flight.altitudeFt ? `Altitude: ${flight.altitudeFt.toLocaleString()} ft` : null,
    flight.groundSpeedKt ? `Speed: ${flight.groundSpeedKt} kts` : null,
    flight.trackDeg !== undefined ? `Track: ${flight.trackDeg}°` : null,
    flight.squawk ? `Squawk: ${flight.squawk}` : null,
    destinationWeather
      ? `Destination weather (${destinationAirport?.icao}): ${destinationWeather.flightCategory} · ${destinationWeather.summary}`
      : null,
  ].filter(Boolean);

  return {
    result: {
      found: true,
      flight,
      destinationAirport,
      destinationWeather,
      summary: parts.join(' | '),
    },
    source,
  };
}
