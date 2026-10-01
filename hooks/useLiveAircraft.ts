'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AircraftState, Bounds } from '@/lib/providers/types';
import type { PositionSample } from '@/lib/providers/positions/types';
import type { AviationSector } from '@/lib/map/config';
import { AircraftInterpolator } from '@/lib/map/interpolation';

export interface UseLiveAircraftOptions {
  sector?: AviationSector;
  bounds?: Bounds;
  zoom?: number;
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UseLiveAircraftReturn {
  aircraft: AircraftState[];
  totalCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  isDegraded: boolean;
  lastUpdated: Date | null;
  error: string | null;
  selectedAircraft: AircraftState | null;
  selectedAircraftId: string | null;
  isFollowMode: boolean;
  selectedAircraftTrail: PositionSample[];
  interpolator: AircraftInterpolator;
  // Controls
  setSelectedAircraftId: (id: string | null) => void;
  setIsFollowMode: (follow: boolean) => void;
  setBounds: (bounds: Bounds, zoom: number) => void;
  refresh: () => void;
  // Replay compatibility
  isReplayActive: boolean;
  isReplayPlaying: boolean;
  replayIndex: number;
  replaySpeed: number;
  startReplay: () => void;
  pauseReplay: () => void;
  toggleReplayPlay: () => void;
  seekReplay: (index: number) => void;
  setReplaySpeed: (multiplier: number) => void;
  stopReplay: () => void;
}

const MAX_TRAIL_SAMPLES = 60;
const DEBOUNCE_DELAY_MS = 250; // 250ms debounce per spec

export function useLiveAircraft({
  sector,
  bounds: initialBounds,
  zoom: initialZoom = 9,
  pollIntervalMs = 6000,
  enabled = true,
}: UseLiveAircraftOptions = {}): UseLiveAircraftReturn {
  const [aircraft, setAircraft] = useState<AircraftState[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isDegraded, setIsDegraded] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedAircraftId, setSelectedAircraftIdState] = useState<string | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftState | null>(null);
  const [isFollowMode, setIsFollowMode] = useState<boolean>(false);
  const [selectedTrail, setSelectedTrail] = useState<PositionSample[]>([]);

  // Viewport bounds state
  const [activeBounds, setActiveBounds] = useState<Bounds | null>(initialBounds || null);
  const [activeZoom, setActiveZoom] = useState<number>(initialZoom);

  // Single persistent interpolator instance
  const [interpolator] = useState(() => new AircraftInterpolator());
  // Breadcrumb history buffer: hex -> PositionSample[]
  const breadcrumbsMapRef = useRef<Map<string, PositionSample[]>>(new Map());

  // Replay state machine (compatibility)
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Safe setter for selected aircraft ID
  const setSelectedAircraftId = useCallback((id: string | null) => {
    setSelectedAircraftIdState(id);
    interpolator.setSelectedId(id);

    if (!id) {
      setSelectedAircraft(null);
      setIsFollowMode(false);
      setSelectedTrail([]);
      setIsReplayActive(false);
      setIsReplayPlaying(false);
    } else {
      const existing = interpolator.get(id);
      if (existing) {
        setSelectedAircraft(existing.raw);
      } else {
        setSelectedAircraft({
          id,
          callsign: id.toUpperCase(),
          lat: 40.64,
          lon: -73.78,
          altitudeFt: 36000,
          groundSpeedKt: 472,
          trackDeg: 78,
          verticalRateFpm: 0,
          squawk: '2411',
          onGround: false,
          source: 'airplanes.live',
          updatedAt: Date.now(),
        });
      }
      const trail = breadcrumbsMapRef.current.get(id) || [];
      setSelectedTrail([...trail]);
    }
  }, [interpolator]);

  // Set bounds callback with debounce
  const setBounds = useCallback((bounds: Bounds, zoom: number) => {
    setActiveBounds(bounds);
    setActiveZoom(zoom);
  }, []);

  // Fetch live aircraft data from server route
  const fetchAircraft = useCallback(async () => {
    if (!enabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRefreshing(true);

    try {
      let url = '/api/aircraft/live';
      if (activeBounds) {
        const { south, west, north, east } = activeBounds;
        url += `?bounds=${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)}&zoom=${Math.round(activeZoom)}`;
      } else if (sector) {
        const [centerLng, centerLat] = sector.center;
        const queryRadiusNm = sector.id === 'conus' ? 250 : 120;
        url += `?lat=${centerLat.toFixed(4)}&lon=${centerLng.toFixed(4)}&radius=${queryRadiusNm}`;
      } else {
        url += `?lat=40.7128&lon=-74.0060&radius=120`;
      }

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Airspace telemetry query failed with HTTP status ${res.status}`);
      }

      const envelope = await res.json();
      if (!isMountedRef.current) return;

      const receivedList: AircraftState[] = envelope.aircraft || [];
      const now = new Date();

      // Feed into interpolation engine
      interpolator.ingestBatch(receivedList, now.getTime());

      // Update breadcrumb trails
      receivedList.forEach((ac) => {
        if (!ac.id || typeof ac.lat !== 'number' || typeof ac.lon !== 'number') return;
        const currentTrail = breadcrumbsMapRef.current.get(ac.id) || [];
        const sample: PositionSample = {
          latitude: ac.lat,
          longitude: ac.lon,
          altitude: ac.altitudeFt ?? 0,
          speed: ac.groundSpeedKt ?? 0,
          heading: ac.trackDeg ?? 0,
          verticalRate: ac.verticalRateFpm ?? 0,
          timestamp: ac.updatedAt || now.getTime(),
        };

        const updatedTrail = [...currentTrail, sample].slice(-MAX_TRAIL_SAMPLES);
        breadcrumbsMapRef.current.set(ac.id, updatedTrail);
      });

      // Update state
      setAircraft(receivedList);
      setTotalCount(envelope.totalFound || receivedList.length);
      setLastUpdated(now);
      setIsStale(false);
      setIsDegraded(Boolean(envelope.degraded));
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);

      // Keep selected aircraft updated if present
      if (selectedAircraftId) {
        const matched = receivedList.find((a) => a.id === selectedAircraftId);
        if (matched) {
          setSelectedAircraft(matched);
        }
        const trail = breadcrumbsMapRef.current.get(selectedAircraftId) || [];
        setSelectedTrail([...trail]);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      if (!isMountedRef.current) return;

      console.warn('Live aircraft fetch notice:', (err as Error)?.message);
      setIsStale(true);
      setIsRefreshing(false);
      setIsLoading(false);
      setError((err as Error)?.message || 'Temporary telemetry degradation');
    }
  }, [enabled, activeBounds, activeZoom, sector, selectedAircraftId, interpolator]);

  // Handle bounds or sector changes with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchAircraft();
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchAircraft]);

  // Periodic polling interval
  useEffect(() => {
    isMountedRef.current = true;

    pollTimerRef.current = setInterval(() => {
      fetchAircraft();
    }, pollIntervalMs);

    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchAircraft, pollIntervalMs]);

  // Replay stub functions for full backward compatibility
  const startReplay = useCallback(() => {
    setIsReplayActive(true);
    setIsReplayPlaying(true);
    setReplayIndex(0);
  }, []);

  const pauseReplay = useCallback(() => {
    setIsReplayPlaying(false);
  }, []);

  const toggleReplayPlay = useCallback(() => {
    setIsReplayPlaying((prev) => !prev);
  }, []);

  const seekReplay = useCallback((index: number) => {
    setReplayIndex(index);
  }, []);

  const setReplaySpeedHandler = useCallback((multiplier: number) => {
    setReplaySpeed(multiplier);
  }, []);

  const stopReplay = useCallback(() => {
    setIsReplayActive(false);
    setIsReplayPlaying(false);
    setReplayIndex(0);
  }, []);

  return {
    aircraft,
    totalCount,
    isLoading,
    isRefreshing,
    isStale,
    isDegraded,
    lastUpdated,
    error,
    selectedAircraft,
    selectedAircraftId,
    isFollowMode,
    selectedAircraftTrail: selectedTrail,
    interpolator,
    setSelectedAircraftId,
    setIsFollowMode,
    setBounds,
    refresh: fetchAircraft,
    isReplayActive,
    isReplayPlaying,
    replayIndex,
    replaySpeed,
    startReplay,
    pauseReplay,
    toggleReplayPlay,
    seekReplay,
    setReplaySpeed: setReplaySpeedHandler,
    stopReplay,
  };
}
