import type { AircraftState, Bounds, FlightProvider, TrackPoint } from './types.ts';
import { AirplanesLiveProvider } from './airplanesLiveProvider.ts';
import { AdsbLolProvider } from './adsbLolProvider.ts';

export class ChainedFlightProvider implements FlightProvider {
  readonly name = 'chained-failover';
  private primary: FlightProvider;
  private secondary: FlightProvider;
  private lastSuccessfulProvider: string = 'none';

  constructor(
    primary: FlightProvider = new AirplanesLiveProvider(),
    secondary: FlightProvider = new AdsbLolProvider()
  ) {
    this.primary = primary;
    this.secondary = secondary;
  }

  get lastProvider(): string {
    return this.lastSuccessfulProvider;
  }

  async getAircraftInBounds(bounds: Bounds): Promise<AircraftState[]> {
    try {
      const data = await this.primary.getAircraftInBounds(bounds);
      if (data && data.length > 0) {
        this.lastSuccessfulProvider = this.primary.name;
        return data;
      }
    } catch {
      // Primary failed; proceed to secondary
    }

    try {
      const data = await this.secondary.getAircraftInBounds(bounds);
      this.lastSuccessfulProvider = this.secondary.name;
      return data;
    } catch (err) {
      this.lastSuccessfulProvider = 'all-failed';
      throw err;
    }
  }

  async getAircraftByCallsign(callsignOrHex: string): Promise<AircraftState | null> {
    try {
      const data = await this.primary.getAircraftByCallsign(callsignOrHex);
      if (data) {
        this.lastSuccessfulProvider = this.primary.name;
        return data;
      }
    } catch {
      // Failover to secondary
    }

    try {
      const data = await this.secondary.getAircraftByCallsign(callsignOrHex);
      if (data) {
        this.lastSuccessfulProvider = this.secondary.name;
      }
      return data;
    } catch {
      return null;
    }
  }

  async getTrack(id: string): Promise<TrackPoint[]> {
    try {
      const track = await this.primary.getTrack(id);
      if (track && track.length > 0) {
        return track;
      }
    } catch {
      // Try secondary
    }

    try {
      return await this.secondary.getTrack(id);
    } catch {
      return [];
    }
  }
}

let defaultProviderInstance: FlightProvider | null = null;

export function getDefaultFlightProvider(): FlightProvider {
  if (!defaultProviderInstance) {
    defaultProviderInstance = new ChainedFlightProvider(
      new AirplanesLiveProvider(),
      new AdsbLolProvider()
    );
  }
  return defaultProviderInstance;
}

export function setDefaultFlightProvider(provider: FlightProvider | null): void {
  defaultProviderInstance = provider;
}
