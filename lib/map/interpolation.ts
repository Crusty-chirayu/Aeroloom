/**
 * Aeroloom 60 FPS Telemetry Dead-Reckoning & Interpolation Engine
 *
 * Implements smooth continuous aircraft gliding between poll updates:
 * 1. Dead-reckons forward along track at ground speed in requestAnimationFrame loop.
 * 2. Eases position updates over ~600ms (no teleportation or snapping).
 * 3. Enforces 60s / 180s staleness and eviction rules per DESIGN_SPEC.md §5.
 * 4. Computes altitude-proportional ground shadow offsets.
 */

import type { AircraftState } from '../providers/types.ts';
import { getAircraftCategory } from './typeMapping.ts';
import { getAircraftSpriteId } from './spriteAtlas.ts';

export interface InterpolatedAircraft {
  id: string; // icao24
  currentLng: number;
  currentLat: number;
  currentTrack: number;
  targetLng: number;
  targetLat: number;
  startLng: number;
  startLat: number;
  lastUpdatedMs: number;
  correctionStartMs: number;
  correctionDurationMs: number;
  groundSpeedKt: number;
  altitudeFt: number;
  verticalRateFpm: number;
  onGround: boolean;
  state: 'default' | 'selected' | 'hover' | 'stale' | 'on_ground' | 'ground_shadow';
  category: ReturnType<typeof getAircraftCategory>;
  raw: AircraftState;
}

export type RenderedAircraft = InterpolatedAircraft;

const NM_PER_DEG_LAT = 60.0;
const CORRECTION_DURATION_MS = 600; // ~600ms smooth easing per spec

/**
 * Cubic ease-out curve: 1 - (1 - t)^3
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class AircraftInterpolator {
  private aircraftMap: Map<string, InterpolatedAircraft> = new Map();
  private selectedId: string | null = null;
  private hoveredId: string | null = null;

  public setSelectedId(id: string | null): void {
    this.selectedId = id;
  }

  public setHoveredId(id: string | null): void {
    this.hoveredId = id;
  }

  /**
   * Ingests a new batch of server updates and initializes or eases targets
   */
  public ingestBatch(incoming: AircraftState[], nowMs: number = Date.now()): void {
    const activeIds = new Set<string>();

    for (const ac of incoming) {
      if (
        !ac.id ||
        typeof ac.lat !== 'number' ||
        typeof ac.lon !== 'number' ||
        !Number.isFinite(ac.lat) ||
        !Number.isFinite(ac.lon) ||
        Math.abs(ac.lat) > 90
      ) {
        continue;
      }
      activeIds.add(ac.id);

      const category = getAircraftCategory(ac.typeCode);
      const existing = this.aircraftMap.get(ac.id);

      if (!existing) {
        // New aircraft appearing
        this.aircraftMap.set(ac.id, {
          id: ac.id,
          currentLng: ac.lon,
          currentLat: ac.lat,
          currentTrack: ac.trackDeg ?? 0,
          targetLng: ac.lon,
          targetLat: ac.lat,
          startLng: ac.lon,
          startLat: ac.lat,
          lastUpdatedMs: nowMs,
          correctionStartMs: nowMs,
          correctionDurationMs: 0,
          groundSpeedKt: ac.groundSpeedKt ?? 0,
          altitudeFt: ac.altitudeFt ?? 0,
          verticalRateFpm: ac.verticalRateFpm ?? 0,
          onGround: ac.onGround,
          state: ac.onGround ? 'on_ground' : 'default',
          category,
          raw: ac,
        });
      } else {
        // Existing aircraft received fresh telemetry
        existing.startLng = existing.currentLng;
        existing.startLat = existing.currentLat;
        existing.targetLng = ac.lon;
        existing.targetLat = ac.lat;
        existing.currentTrack = ac.trackDeg ?? existing.currentTrack;
        existing.groundSpeedKt = ac.groundSpeedKt ?? existing.groundSpeedKt;
        existing.altitudeFt = ac.altitudeFt ?? existing.altitudeFt;
        existing.verticalRateFpm = ac.verticalRateFpm ?? existing.verticalRateFpm;
        existing.onGround = ac.onGround;
        existing.lastUpdatedMs = nowMs;
        existing.correctionStartMs = nowMs;
        existing.correctionDurationMs = CORRECTION_DURATION_MS;
        existing.raw = ac;
      }
    }
  }

  /**
   * Advances simulation time and dead-reckons positions for 60 fps rendering
   */
  public step(
    nowMs: number = Date.now(),
    onStep?: (aircraftList: InterpolatedAircraft[]) => void
  ): {
    aircraftGeoJson: GeoJSON.FeatureCollection;
    shadowGeoJson: GeoJSON.FeatureCollection;
  } {
    if (onStep) {
      onStep(Array.from(this.aircraftMap.values()));
    }
    const aircraftFeatures: GeoJSON.Feature[] = [];
    const shadowFeatures: GeoJSON.Feature[] = [];
    const idsToEvict: string[] = [];

    this.aircraftMap.forEach((ac, id) => {
      const ageSeconds = (nowMs - ac.lastUpdatedMs) / 1000;

      // 180s rule: Evict dead telemetry
      if (ageSeconds > 180) {
        idsToEvict.push(id);
        return;
      }

      // 1. Position Easing (blend from start to target)
      if (ac.correctionDurationMs > 0) {
        const elapsed = nowMs - ac.correctionStartMs;
        if (elapsed < ac.correctionDurationMs) {
          const t = Math.min(1, elapsed / ac.correctionDurationMs);
          const factor = easeOutCubic(t);
          ac.currentLng = ac.startLng + (ac.targetLng - ac.startLng) * factor;
          ac.currentLat = ac.startLat + (ac.targetLat - ac.startLat) * factor;
        } else {
          ac.currentLng = ac.targetLng;
          ac.currentLat = ac.targetLat;
          ac.correctionDurationMs = 0;
        }
      } else if (!ac.onGround && ac.groundSpeedKt > 30 && ageSeconds < 10) {
        // 2. Dead-reckoning along heading at ground speed (up to 10s max extrapolation)
        // dt in hours
        const dtHours = 1 / (60 * 3600); // 1 frame at 60 fps (~16.6ms)
        const distNm = ac.groundSpeedKt * dtHours;

        const rad = ((ac.currentTrack || 0) * Math.PI) / 180;
        const dLat = (distNm * Math.cos(rad)) / NM_PER_DEG_LAT;
        const cosLat = Math.max(0.01, Math.cos((Math.min(85, Math.max(-85, ac.currentLat)) * Math.PI) / 180));
        const dLng = (distNm * Math.sin(rad)) / (NM_PER_DEG_LAT * cosLat);

        ac.currentLat = Math.max(-89.9, Math.min(89.9, ac.currentLat + dLat));
        let nextLng = ac.currentLng + dLng;
        nextLng = ((((nextLng + 180) % 360) + 360) % 360) - 180;
        ac.currentLng = nextLng;
      }

      // Safety check: ensure coordinates never degenerate to NaN or non-finite numbers
      if (!Number.isFinite(ac.currentLat) || !Number.isFinite(ac.currentLng)) {
        ac.currentLat = ac.targetLat;
        ac.currentLng = ac.targetLng;
      }

      // Determine visual state
      let visualState: 'default' | 'selected' | 'hover' | 'stale' | 'on_ground' = 'default';
      if (id === this.selectedId) {
        visualState = 'selected';
      } else if (id === this.hoveredId) {
        visualState = 'hover';
      } else if (ac.onGround) {
        visualState = 'on_ground';
      } else if (ageSeconds > 60) {
        // 60s rule: Fade to 40% opacity
        visualState = 'stale';
      }

      const iconId = getAircraftSpriteId(ac.category, visualState);

      // Main Aircraft Marker Feature
      aircraftFeatures.push({
        type: 'Feature',
        id: ac.id,
        geometry: {
          type: 'Point',
          coordinates: [ac.currentLng, ac.currentLat],
        },
        properties: {
          id: ac.id,
          callsign: ac.raw.callsign || ac.id.toUpperCase(),
          altitudeFt: ac.altitudeFt,
          groundSpeedKt: ac.groundSpeedKt,
          trackDeg: ac.currentTrack,
          iconId,
          isSelected: id === this.selectedId,
          isHovered: id === this.hoveredId,
          state: visualState,
          category: ac.category,
        },
      });

      // Ground Shadow Feature (only for airborne aircraft)
      if (!ac.onGround && ac.altitudeFt > 500) {
        // Down-right offset proportional to altitude up to 0.008 degrees
        const altFactor = Math.min(1, ac.altitudeFt / 40000);
        const shadowLatOffset = -0.006 * altFactor;
        const shadowLngOffset = 0.006 * altFactor;
        const shadowIconId = getAircraftSpriteId(ac.category, 'ground_shadow');

        shadowFeatures.push({
          type: 'Feature',
          id: `${ac.id}-shadow`,
          geometry: {
            type: 'Point',
            coordinates: [ac.currentLng + shadowLngOffset, ac.currentLat + shadowLatOffset],
          },
          properties: {
            iconId: shadowIconId,
            trackDeg: ac.currentTrack,
          },
        });
      }
    });

    // Clean up expired aircraft
    for (const deadId of idsToEvict) {
      this.aircraftMap.delete(deadId);
    }

    return {
      aircraftGeoJson: {
        type: 'FeatureCollection',
        features: aircraftFeatures,
      },
      shadowGeoJson: {
        type: 'FeatureCollection',
        features: shadowFeatures,
      },
    };
  }

  public get(id: string): InterpolatedAircraft | undefined {
    return this.aircraftMap.get(id);
  }

  public getAll(): InterpolatedAircraft[] {
    return Array.from(this.aircraftMap.values());
  }

  public clear(): void {
    this.aircraftMap.clear();
  }
}
