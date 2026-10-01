import type { AircraftState, Bounds, FlightProvider, TrackPoint } from './types.ts';
import { AdsbFiProvider } from './adsbFiProvider.ts';
import { AdsbLolProvider } from './adsbLolProvider.ts';
import { AirplanesLiveProvider } from './airplanesLiveProvider.ts';
import { OpenSkyProvider } from './openSkyProvider.ts';
import { shouldSkipProvider } from './healthTracker.ts';

export class ChainedFlightProvider implements FlightProvider {
  readonly name = 'chained-failover';
  private providers: FlightProvider[];
  private lastSuccessfulProviderName: string = 'none';

  constructor(
    providersOrPrimary?: FlightProvider[] | FlightProvider,
    secondary?: FlightProvider
  ) {
    if (Array.isArray(providersOrPrimary)) {
      this.providers = providersOrPrimary;
    } else if (providersOrPrimary) {
      this.providers = [providersOrPrimary, ...(secondary ? [secondary] : [])];
    } else {
      this.providers = [
        new AdsbFiProvider(),
        new AdsbLolProvider(),
        new AirplanesLiveProvider(),
        new OpenSkyProvider(),
      ];
    }
  }

  get lastProvider(): string {
    return this.lastSuccessfulProviderName;
  }

  get configuredProviders(): FlightProvider[] {
    return [...this.providers];
  }

  private deduplicate(aircraft: AircraftState[]): AircraftState[] {
    const map = new Map<string, AircraftState>();
    for (const a of aircraft) {
      if (a.id && !map.has(a.id)) {
        map.set(a.id, a);
      }
    }
    return Array.from(map.values());
  }

  /**
   * For very large viewports (e.g. world zoom <= 4 or span > 90 deg),
   * tiles the query across major high-density airspace sectors to ensure aircraft are visible globally.
   */
  private getTiledSubBounds(bounds: Bounds): Bounds[] {
    const latSpan = Math.abs(bounds.north - bounds.south);
    const lonSpan = Math.abs(bounds.east - bounds.west);

    if ((bounds.zoom !== undefined && bounds.zoom <= 4) || latSpan > 60 || lonSpan > 90) {
      // Global/continental view: sample 3 prominent high-density traffic sectors
      return [
        { south: 35.0, north: 45.0, west: -82.0, east: -70.0, zoom: 6 }, // US East / NY
        { south: 48.0, north: 55.0, west: -5.0, east: 12.0, zoom: 6 },   // Western Europe / London / Paris
        { south: 30.0, north: 40.0, west: 130.0, east: 145.0, zoom: 6 }, // East Asia / Tokyo
      ];
    }

    return [bounds];
  }

  async getAircraftInBounds(bounds: Bounds): Promise<AircraftState[]> {
    const subBoundsList = this.getTiledSubBounds(bounds);
    const errors: string[] = [];

    for (const provider of this.providers) {
      if (shouldSkipProvider(provider.name)) {
        continue;
      }

      try {
        if (subBoundsList.length === 1) {
          const data = await provider.getAircraftInBounds(subBoundsList[0]);
          this.lastSuccessfulProviderName = provider.name;
          return data;
        }

        // Tiled multi-sector query for world views
        const results = await Promise.allSettled(
          subBoundsList.map((sub) => provider.getAircraftInBounds(sub))
        );
        const combined: AircraftState[] = [];
        let anySuccess = false;

        for (const res of results) {
          if (res.status === 'fulfilled') {
            anySuccess = true;
            combined.push(...res.value);
          }
        }

        if (anySuccess) {
          this.lastSuccessfulProviderName = provider.name;
          return this.deduplicate(combined);
        }

        throw new Error(`${provider.name} failed across all tiled sectors`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${provider.name}: ${msg}`);
      }
    }

    this.lastSuccessfulProviderName = 'all-failed';
    throw new Error(`All telemetry providers failed: ${errors.join('; ')}`);
  }

  async getAircraftByCallsign(callsignOrHex: string): Promise<AircraftState | null> {
    for (const provider of this.providers) {
      if (shouldSkipProvider(provider.name)) {
        continue;
      }

      try {
        const data = await provider.getAircraftByCallsign(callsignOrHex);
        if (data) {
          this.lastSuccessfulProviderName = provider.name;
          return data;
        }
      } catch {
        // Failover to next provider
      }
    }
    return null;
  }

  async getTrack(id: string): Promise<TrackPoint[]> {
    for (const provider of this.providers) {
      if (shouldSkipProvider(provider.name)) {
        continue;
      }

      try {
        const track = await provider.getTrack(id);
        if (track && track.length > 0) {
          return track;
        }
      } catch {
        // Failover to next provider
      }
    }
    return [];
  }
}

let defaultProviderInstance: FlightProvider | null = null;

export function getDefaultFlightProvider(): FlightProvider {
  if (!defaultProviderInstance) {
    defaultProviderInstance = new ChainedFlightProvider();
  }
  return defaultProviderInstance;
}

export function setDefaultFlightProvider(provider: FlightProvider | null): void {
  defaultProviderInstance = provider;
}
