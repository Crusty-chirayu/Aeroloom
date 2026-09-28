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

      if (!isMountedRef.current) return;

      if (json.success && Array.isArray(json.aircraft)) {
        const list: AircraftPosition[] = json.aircraft;
        setAircraft(list);
        setTotalCount(json.totalFound || list.length);
        setLastUpdated(new Date());
        setIsStale(false);
        setError(null);

        // Update selected aircraft data if still present in stream
        if (selectedAircraftId) {
          const match = list.find(
            (a) => a.id === selectedAircraftId || a.callsign === selectedAircraftId
          );
          if (match) {
            setSelectedAircraft(match);
          }
        }
      } else {
        // Upstream error or empty fallback
        setError(json.error || 'Empty telemetry stream');
        setIsStale(true);
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was purposefully cancelled (e.g. sector switch), ignore
        return;
      }
      const msg = err instanceof Error ? err.message : 'Telemetry fetch failed';
      setError(msg);
      setIsStale(true);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [centerLat, centerLng, queryRadiusNm, enabled, selectedAircraftId]);

  // Synchronize selected aircraft object whenever selectedAircraftId changes
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

  // Polling lifecycle loop
  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);

    let isCancelled = false;

    const runPoll = async () => {
      await fetchAircraft();
      if (!isCancelled && enabled) {
        timeoutIdRef.current = setTimeout(runPoll, pollIntervalMs);
      }
    };

    runPoll();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
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
