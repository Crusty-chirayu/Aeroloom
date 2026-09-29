'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AircraftPosition } from '@/lib/providers/positions/types';
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
  setSelectedAircraftId: (id: string | null) => void;
  setIsFollowMode: (follow: boolean) => void;
  refresh: () => void;
}

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

    // Abort previous in-flight request if pending
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
        const list: AircraftPosition[] = json.aircraft;
        setAircraft(list);
        setTotalCount(json.totalFound || list.length);
        setLastUpdated(new Date());
        setIsStale(false);
        setError(null);
        consecutiveErrorsRef.current = 0;

        // Update selected aircraft data if still present in stream
        const currentSelId = selectedAircraftIdRef.current;
        if (currentSelId) {
          const match = list.find(
            (a) => a.id === currentSelId || a.callsign === currentSelId
          );
          if (match) {
            setSelectedAircraft(match);
          }
        }
      } else {
        // Upstream error or empty fallback
        setError(json.error || 'Empty telemetry stream');
        setIsStale(true);
        consecutiveErrorsRef.current += 1;
      }
    } catch (err: unknown) {
      if (!isMountedRef.current || currentSeq !== requestSeqRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was purposefully cancelled (e.g. sector switch), ignore
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
      return;
    }

    const match = aircraft.find(
      (a) => a.id === selectedAircraftId || a.callsign === selectedAircraftId
    );
    if (match) {
      setSelectedAircraft(match);
    }
  }, [selectedAircraftId, aircraft]);

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
        // Apply backoff if consecutive errors occur (6s -> 9s -> 13.5s -> max 30s)
        const delay = consecutiveErrorsRef.current > 0
          ? Math.min(Math.round(pollIntervalMs * Math.pow(1.5, consecutiveErrorsRef.current)), 30000)
          : pollIntervalMs;
        timeoutIdRef.current = setTimeout(runPoll, delay);
      }
    };

    runPoll();

    // Listen to tab visibility changes to resume polling immediately when user returns
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
    selectedAircraft,
    selectedAircraftId,
    isFollowMode,
    setSelectedAircraftId,
    setIsFollowMode,
    refresh,
  };
}
