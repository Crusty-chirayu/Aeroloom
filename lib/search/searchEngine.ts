import type { SearchResults, AirportInfo, AirlineInfo, AircraftState } from '../providers/types.ts';
import { GLOBAL_AIRPORTS } from '../airports/airportData.ts';
import { AIRLINE_CATALOG } from '../metadata/airlineCatalog.ts';
import { getDefaultFlightProvider } from '../providers/chainedFlightProvider.ts';

export async function performOmniSearch(query: string, maxPerCategory: number = 6): Promise<SearchResults> {
  const clean = query.trim().toUpperCase();
  if (!clean) {
    return {
      query,
      flights: [],
      airports: [],
      airlines: [],
      total: 0,
    };
  }

  // 1. Airports search (exact matches first, then startsWith, then includes)
  const matchedAirports: AirportInfo[] = [];
  for (const ap of GLOBAL_AIRPORTS) {
    const isIcaoMatch = ap.icao.toUpperCase() === clean;
    const isIataMatch = ap.iata.toUpperCase() === clean;
    const isCityMatch = ap.city.toUpperCase().includes(clean);
    const isNameMatch = ap.name.toUpperCase().includes(clean);

    if (isIcaoMatch || isIataMatch || isCityMatch || isNameMatch) {
      matchedAirports.push(ap);
      if (matchedAirports.length >= maxPerCategory * 2) break;
    }
  }

  // Sort airports: exact code matches first
  matchedAirports.sort((a, b) => {
    const aExact = a.icao === clean || a.iata === clean;
    const bExact = b.icao === clean || b.iata === clean;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
  const airports = matchedAirports.slice(0, maxPerCategory);

  // 2. Airlines search
  const matchedAirlines: AirlineInfo[] = [];
  for (const al of AIRLINE_CATALOG) {
    const isIcao = al.icao.toUpperCase() === clean;
    const isIata = al.iata?.toUpperCase() === clean;
    const isName = al.name.toUpperCase().includes(clean);
    const isCallsign = al.callsignTelephony?.toUpperCase().includes(clean);

    if (isIcao || isIata || isName || isCallsign) {
      matchedAirlines.push(al);
      if (matchedAirlines.length >= maxPerCategory * 2) break;
    }
  }
  matchedAirlines.sort((a, b) => {
    const aExact = a.icao === clean || a.iata === clean;
    const bExact = b.icao === clean || b.iata === clean;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
  const airlines = matchedAirlines.slice(0, maxPerCategory);

  // 3. Live Flight search via provider
  const flights: AircraftState[] = [];
  try {
    const provider = getDefaultFlightProvider();
    const flight = await provider.getAircraftByCallsign(clean);
    if (flight) {
      flights.push(flight);
    }
  } catch {
    // If upstream flight search fails, return empty flights list without breaking the search
  }

  const total = flights.length + airports.length + airlines.length;

  return {
    query,
    flights,
    airports,
    airlines,
    total,
  };
}
