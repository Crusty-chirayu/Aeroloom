import type { AircraftPosition } from './positions/types.ts';
import { getAirlineByCallsign } from '../metadata/airlineCatalog.ts';
import { getAircraftDetails } from '../metadata/aircraftCatalog.ts';
import { resolveFlightRoute } from '../routes/routeResolver.ts';

/**
 * Enriches a single aircraft position with airline, aircraft model/manufacturer,
 * and verified flight route data when authentic records exist.
 */
export function enrichAircraftPosition(pos: AircraftPosition): AircraftPosition {
  const airline = pos.airline ?? getAirlineByCallsign(pos.callsign);
  const aircraftDetails = pos.aircraftDetails ?? getAircraftDetails(pos.aircraftType);
  const route = pos.route ?? (resolveFlightRoute(pos.callsign) || undefined);

  return {
    ...pos,
    airline,
    aircraftDetails,
    route,
  };
}

/**
 * Enriches an array of aircraft positions in bulk.
 */
export function enrichAircraftPositions(positions: AircraftPosition[]): AircraftPosition[] {
  return positions.map(enrichAircraftPosition);
}
