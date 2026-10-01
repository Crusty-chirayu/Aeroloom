import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { AircraftState, Bounds } from '@/lib/providers/types';
import type { PositionSample } from '@/lib/providers/positions/types';
import { AircraftInterpolator } from '@/lib/map/interpolation';

export interface SectorDefinition {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  defaultZoom: number;
}

interface UseLiveAircraftOptions {
  sector?: SectorDefinition;
  zoom?: number;
  pollIntervalMs?: number;
  enabled?: boolean;
}

const MAX_TRAIL_SAMPLES = 50;
const DEBOUNCE_DELAY_MS = 250;

export function useLiveAircraft({
  sector,
  zoom = 10,
  pollIntervalMs = 6000,
  enabled = true,
}: UseLiveAircraftOptions = {}) {
  const [aircraft, setAircraft] = useState<AircraftState[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isDegraded, setIsDegraded] = useState<boolean>(false);
  const [isSampleData, setIsSampleData] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftState | null>(null);
  const [selectedTrail, setSelectedTrail] = useState<PositionSample[]>([]);
  const [isFollowMode, setIsFollowMode] = useState<boolean>(false);

  // Dynamic bounds tracking
  const [activeBounds, setActiveBounds] = useState<Bounds | null>(null);
  const [activeZoom, setActiveZoom] = useState<number>(zoom);

  // Replay states (backward compatibility)
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  // References
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFailuresRef = useRef<number>(0);
  const breadcrumbsMapRef = useRef<Map<string, PositionSample[]>>(new Map());
  // Instantiate persistent MapLibre 60FPS dead-reckoning interpolator
  const interpolator = useMemo(() => new AircraftInterpolator(), []);
  const fetchAircraftRef = useRef<() => Promise<void>>(async () => {});

  // Update selected aircraft reference when ID changes
  useEffect(() => {
    interpolator.setSelectedId(selectedAircraftId);

    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      if (!selectedAircraftId) {
        setSelectedAircraft(null);
        setSelectedTrail([]);
        setIsFollowMode(false);
      } else {
        const live = interpolator.get(selectedAircraftId);
        if (live) {
          setSelectedAircraft(live.raw);
        } else {
          const found = aircraft.find((a) => a.id === selectedAircraftId);
          if (found) {
            setSelectedAircraft(found);
          }
        }
        const trail = breadcrumbsMapRef.current.get(selectedAircraftId) || [];
        setSelectedTrail([...trail]);
      }
    });
  }, [selectedAircraftId, interpolator, aircraft]);

  // Set bounds callback with debounce
  const setBounds = useCallback((bounds: Bounds, currentZoom: number) => {
    setActiveBounds(bounds);
    setActiveZoom(currentZoom);
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
        throw new Error(`HTTP ${res.status}`);
      }

      const envelope = await res.json();
      if (!isMountedRef.current) return;

      // Extract and normalize aircraft list to guarantee lat and lon
      const rawList = (envelope.states || envelope.aircraft || []) as (AircraftState & { latitude?: number; longitude?: number })[];
      const receivedList: AircraftState[] = rawList.map((ac) => ({
        ...ac,
        lat: typeof ac.lat === 'number' ? ac.lat : (typeof ac.latitude === 'number' ? ac.latitude : 0),
        lon: typeof ac.lon === 'number' ? ac.lon : (typeof ac.longitude === 'number' ? ac.longitude : 0),
      })).filter((ac) => ac.lat !== 0 || ac.lon !== 0);

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
      consecutiveFailuresRef.current = 0;
      setAircraft(receivedList);
      setTotalCount(envelope.totalFound || receivedList.length);
      setLastUpdated(now);
      setIsStale(false);
      setIsDegraded(Boolean(envelope.degraded));
      setIsSampleData(Boolean(envelope.isSampleData));
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

      consecutiveFailuresRef.current += 1;
      setIsStale(true);
      setIsRefreshing(false);
      setIsLoading(false);
      setIsDegraded(true);

      // Friendly UI message, never raw HTTP dumps
      setError('No live data source is reachable right now. Retrying…');

      // Automatic backoff retry (5s, 10s, max 30s)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const backoffMs = Math.min(5000 * Math.pow(1.5, consecutiveFailuresRef.current - 1), 30000);
      retryTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          fetchAircraftRef.current();
        }
      }, backoffMs);
    }
  }, [enabled, activeBounds, activeZoom, sector, selectedAircraftId, interpolator]);

  useEffect(() => {
    fetchAircraftRef.current = fetchAircraft;
  }, [fetchAircraft]);

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
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
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
    isSampleData,
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
