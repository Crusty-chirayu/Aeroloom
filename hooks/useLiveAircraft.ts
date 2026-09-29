'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AircraftPosition, PositionSample } from '@/lib/providers/positions/types';
import type { AviationSector } from '@/lib/map/config';

interface UseLiveAircraftOptions {
  sector: AviationSector;
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UseLiveAircraftReturn {
  aircraft: AircraftPosition[];
  totalCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  lastUpdated: Date | null;
  error: string | null;
  selectedAircraft: AircraftPosition | null;
  selectedAircraftId: string | null;
  isFollowMode: boolean;
  selectedAircraftTrail: PositionSample[];
  // Replay capabilities
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
  setSelectedAircraftId: (id: string | null) => void;
  setIsFollowMode: (follow: boolean) => void;
  refresh: () => void;
}

const MAX_TRAIL_SAMPLES = 50;

export function useLiveAircraft({
  sector,
  pollIntervalMs = 6000,
  enabled = true,
}: UseLiveAircraftOptions): UseLiveAircraftReturn {
  const [aircraft, setAircraft] = useState<AircraftPosition[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftPosition | null>(null);
  const [isFollowMode, setIsFollowMode] = useState<boolean>(false);

  // Breadcrumbs cache per aircraft hex
  const breadcrumbsMapRef = useRef<Map<string, PositionSample[]>>(new Map());

  // Replay state machine
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // 1x, 2x, 4x

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const selectedAircraftIdRef = useRef<string | null>(selectedAircraftId);
  selectedAircraftIdRef.current = selectedAircraftId;
  const requestSeqRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);

  // Derive radius from sector zoom (Continental needs larger radius ~250nm, Metro ~100nm)
  const queryRadiusNm = sector.id === 'conus' ? 250 : 120;
  const [centerLng, centerLat] = sector.center;

  const fetchAircraft = useCallback(async () => {
    if (!enabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentSeq = ++requestSeqRef.current;
    setIsRefreshing(true);

    try {
      const url = `/api/aircraft/live?lat=${centerLat.toFixed(4)}&lon=${centerLng.toFixed(4)}&radius=${queryRadiusNm}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`ADS-B gateway returned HTTP ${res.status}`);
      }

      const json = await res.json();

      if (!isMountedRef.current || currentSeq !== requestSeqRef.current) return;

      if (json.success && Array.isArray(json.aircraft)) {
        const rawList: AircraftPosition[] = json.aircraft;
        const now = Date.now();

        // Accumulate timestamped breadcrumbs into bounded FIFO buffer
        const breadcrumbs = breadcrumbsMapRef.current;
        const enrichedList = rawList.map((ac) => {
          let samples = breadcrumbs.get(ac.id);
          if (!samples) {
            samples = [];
            breadcrumbs.set(ac.id, samples);
          }

          const lastSample = samples[samples.length - 1];
          const hasMoved =
            !lastSample ||
            Math.abs(lastSample.latitude - ac.latitude) > 0.0001 ||
            Math.abs(lastSample.longitude - ac.longitude) > 0.0001 ||
            now - lastSample.timestamp > 10000;

          if (hasMoved) {
            samples.push({
              latitude: ac.latitude,
              longitude: ac.longitude,
              altitude: ac.altitude,
              speed: ac.speed,
              heading: ac.heading,
              verticalRate: ac.verticalRate,
              timestamp: ac.timestamp || now,
            });

            if (samples.length > MAX_TRAIL_SAMPLES) {
              samples.shift();
            }
          }

          return {
            ...ac,
            positionHistory: [...samples],
          };
        });

        // Prune stale aircraft from breadcrumb map (not seen in > 15 minutes)
        if (breadcrumbs.size > 500) {
          const activeIds = new Set(enrichedList.map((a) => a.id));
          for (const hex of breadcrumbs.keys()) {
            if (!activeIds.has(hex)) {
              breadcrumbs.delete(hex);
            }
          }
        }

        setAircraft(enrichedList);
        setTotalCount(json.totalFound || enrichedList.length);
        setLastUpdated(new Date());
        setIsStale(false);
        setError(null);
        consecutiveErrorsRef.current = 0;

        // Synchronize selected aircraft
        const currentSelId = selectedAircraftIdRef.current;
        if (currentSelId) {
          const match = enrichedList.find(
            (a) => a.id === currentSelId || a.callsign === currentSelId
          );
          if (match) {
            setSelectedAircraft(match);
          }
        }
      } else {
        setError(json.error || 'Empty telemetry stream');
        setIsStale(true);
        consecutiveErrorsRef.current += 1;
      }
    } catch (err: unknown) {
      if (!isMountedRef.current || currentSeq !== requestSeqRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Telemetry fetch failed';
      setError(msg);
      setIsStale(true);
      consecutiveErrorsRef.current += 1;
    } finally {
      if (isMountedRef.current && currentSeq === requestSeqRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [centerLat, centerLng, queryRadiusNm, enabled]);

  // Synchronize selected aircraft object whenever selectedAircraftId or aircraft updates
  useEffect(() => {
    if (!selectedAircraftId) {
      setSelectedAircraft(null);
      setIsFollowMode(false);
      setIsReplayActive(false);
      setIsReplayPlaying(false);
      return;
    }

    const match = aircraft.find(
      (a) => a.id === selectedAircraftId || a.callsign === selectedAircraftId
    );
    if (match) {
      setSelectedAircraft(match);
    }
  }, [selectedAircraftId, aircraft]);

  // Get active trail samples for currently selected flight
  const selectedAircraftTrail: PositionSample[] =
    (selectedAircraftId && breadcrumbsMapRef.current.get(selectedAircraftId)) ||
    selectedAircraft?.positionHistory ||
    [];

  // Replay playback timer
  useEffect(() => {
    if (!isReplayActive || !isReplayPlaying || selectedAircraftTrail.length === 0) {
      return;
    }

    const intervalMs = Math.max(250, Math.round(1000 / replaySpeed));
    const timer = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= selectedAircraftTrail.length - 1) {
          setIsReplayPlaying(false);
          return selectedAircraftTrail.length - 1;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isReplayActive, isReplayPlaying, replaySpeed, selectedAircraftTrail.length]);

  // When replay is active, interpolate/override selected aircraft telemetry
  const effectiveSelectedAircraft = (() => {
    if (!selectedAircraft || !isReplayActive || selectedAircraftTrail.length === 0) {
      return selectedAircraft;
    }
    const sample = selectedAircraftTrail[Math.min(replayIndex, selectedAircraftTrail.length - 1)];
    if (!sample) return selectedAircraft;

    return {
      ...selectedAircraft,
      latitude: sample.latitude,
      longitude: sample.longitude,
      altitude: sample.altitude,
      speed: sample.speed,
      heading: sample.heading,
      verticalRate: sample.verticalRate ?? selectedAircraft.verticalRate,
      timestamp: sample.timestamp,
    };
  })();

  const startReplay = useCallback(() => {
    if (selectedAircraftTrail.length < 2) return;
    setIsReplayActive(true);
    setIsReplayPlaying(true);
    setReplayIndex(0);
  }, [selectedAircraftTrail.length]);

  const pauseReplay = useCallback(() => {
    setIsReplayPlaying(false);
  }, []);

  const toggleReplayPlay = useCallback(() => {
    setIsReplayPlaying((p) => !p);
  }, []);

  const seekReplay = useCallback((index: number) => {
    setReplayIndex(Math.max(0, Math.min(index, selectedAircraftTrail.length - 1)));
  }, [selectedAircraftTrail.length]);

  const stopReplay = useCallback(() => {
    setIsReplayActive(false);
    setIsReplayPlaying(false);
    setReplayIndex(0);
  }, []);

  // Polling lifecycle loop with tab visibility and backoff protection
  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);

    let isCancelled = false;

    const runPoll = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        await fetchAircraft();
      }
      if (!isCancelled && enabled) {
        const delay = consecutiveErrorsRef.current > 0
          ? Math.min(Math.round(pollIntervalMs * Math.pow(1.5, consecutiveErrorsRef.current)), 30000)
          : pollIntervalMs;
        timeoutIdRef.current = setTimeout(runPoll, delay);
      }
    };

    runPoll();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isCancelled && enabled) {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        runPoll();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAircraft, pollIntervalMs, enabled]);

  const refresh = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    fetchAircraft().then(() => {
      if (isMountedRef.current && enabled) {
        timeoutIdRef.current = setTimeout(fetchAircraft, pollIntervalMs);
      }
    });
  }, [fetchAircraft, pollIntervalMs, enabled]);

  return {
    aircraft,
    totalCount,
    isLoading,
    isRefreshing,
    isStale,
    lastUpdated,
    error,
    selectedAircraft: effectiveSelectedAircraft,
    selectedAircraftId,
    isFollowMode,
    selectedAircraftTrail,
    isReplayActive,
    isReplayPlaying,
    replayIndex,
    replaySpeed,
    startReplay,
    pauseReplay,
    toggleReplayPlay,
    seekReplay,
    setReplaySpeed,
    stopReplay,
    setSelectedAircraftId,
    setIsFollowMode,
    refresh,
  };
}
