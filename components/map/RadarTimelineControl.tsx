'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useReducedMotion } from '@/lib/motion';
import type { RadarFrame, RadarApiResponse } from '@/app/api/radar/route';

export interface RadarTimelineControlProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  onFrameChange: (tileUrl: string | null, opacity: number) => void;
  className?: string;
}

export function RadarTimelineControl({
  isVisible,
  onToggleVisibility,
  onFrameChange,
  className = '',
}: RadarTimelineControlProps) {
  const isReducedMotion = useReducedMotion();

  // State
  const [radarData, setRadarData] = useState<RadarApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [opacity, setOpacity] = useState<number>(0.7);

  // Playback timer ref
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [fetchTrigger, setFetchTrigger] = useState<number>(0);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setFetchTrigger((prev) => prev + 1);
  }, []);

  // Initial fetch + 5-minute auto-refresh when visible
  useEffect(() => {
    if (!isVisible) {
      onFrameChange(null, opacity);
      return;
    }

    let isMounted = true;

    async function loadRadarData() {
      try {
        const res = await fetch('/api/radar');
        const data: RadarApiResponse = await res.json();

        if (!isMounted) return;

        if (!data.success || !data.frames || data.frames.length === 0) {
          throw new Error(data.error || 'No radar frames available from provider.');
        }

        setRadarData(data);
        setActiveFrameIndex(data.frames.length - 1);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Radar temporarily unavailable';
        setError(msg);
        onFrameChange(null, opacity);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRadarData();

    // Auto refresh every 5 minutes (300,000 ms)
    const refreshInterval = setInterval(() => {
      loadRadarData();
    }, 300000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [isVisible, fetchTrigger, opacity, onFrameChange]);

  // 2. Handle Frame Tile URL Updates to Map
  useEffect(() => {
    if (!isVisible || !radarData || !radarData.frames[activeFrameIndex]) {
      onFrameChange(null, opacity);
      return;
    }

    const frame = radarData.frames[activeFrameIndex];
    // Substitute {path} into tileUrlTemplate
    const tileUrl = radarData.tileUrlTemplate.replace('{path}', frame.path);
    onFrameChange(tileUrl, opacity);
  }, [isVisible, radarData, activeFrameIndex, opacity, onFrameChange]);

  // 3. Animation Loop (Scrubbing / Playback)
  useEffect(() => {
    if (!isPlaying || isReducedMotion || !radarData || radarData.frames.length === 0) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }

    playbackTimerRef.current = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % radarData.frames.length);
    }, 800); // 800ms per frame for smooth 10-min step review

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, isReducedMotion, radarData]);

  // 4. Tab Visibility Listener (Pause when hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 5. Keyboard Navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setActiveFrameIndex((prev) => (prev > 0 ? prev - 1 : (radarData?.frames.length || 1) - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setActiveFrameIndex((prev) => (prev + 1) % (radarData?.frames.length || 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, radarData]);

  if (!isVisible) return null;

  const currentFrame: RadarFrame | undefined = radarData?.frames[activeFrameIndex];

  return (
    <div
      aria-label="Precipitation Weather Radar Controls"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[620px] bg-[var(--surface)] border border-[var(--line-strong)] rounded-[var(--r-lg)] p-4 shadow-[var(--sh-3)] backdrop-blur-md font-sans text-[var(--ink)] transition-all ${className}`}
    >
      {/* Top Bar: Header, Timestamps, Close */}
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-[var(--line)] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2B62F0] animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--ink)]">
            DOPPLER RADAR
          </span>
          {radarData?.degraded && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[var(--warn-wash)] text-[var(--warn-ink)] rounded border border-[var(--line)]">
              CACHED
            </span>
          )}
        </div>

        {/* Timestamps */}
        {currentFrame ? (
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--ink-2)]">
            <span className="font-semibold text-[var(--signal-ink)]">{currentFrame.timeUtc} UTC</span>
            <span className="text-[var(--ink-3)]">·</span>
            <span>{currentFrame.timeLocal} Local</span>
          </div>
        ) : (
          <span className="text-xs font-mono text-[var(--ink-3)]">
            {isLoading ? 'FETCHING FRAMES…' : 'NO TELEMETRY'}
          </span>
        )}

        <button
          onClick={onToggleVisibility}
          className="p-1 rounded hover:bg-[var(--paper-2)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
          aria-label="Close radar overlay"
          title="Close radar timeline"
        >
          <Icon name="x" className="w-4 h-4" />
        </button>
      </div>

      {/* Error or Loading State */}
      {error ? (
        <div className="flex items-center justify-between p-3 bg-[var(--paper-2)] rounded-[var(--r-sm)] border border-[var(--line)] my-1">
          <div className="flex items-center gap-2 text-xs text-[var(--bad-ink)] font-mono">
            <Icon name="alert-triangle" className="w-4 h-4 shrink-0" />
            <span>Radar temporarily unavailable</span>
          </div>
          <button
            onClick={handleRetry}
            className="px-2.5 py-1 text-xs font-mono bg-[var(--surface)] hover:bg-[var(--paper)] text-[var(--ink)] border border-[var(--line-strong)] rounded transition-colors"
          >
            Retry
          </button>
        </div>
      ) : isLoading && !radarData ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-[var(--ink-3)]">Querying RainViewer Radar Index…</span>
        </div>
      ) : (
        <>
          {/* Main Controls: Play/Pause, Scrubber, Frame Counter */}
          <div className="flex items-center gap-3 my-1">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying((p) => !p)}
              disabled={isReducedMotion}
              title={isReducedMotion ? 'Autoplay disabled (prefers-reduced-motion active)' : isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--signal)] disabled:opacity-50 transition-colors shrink-0 shadow-sm"
            >
              <Icon name={isPlaying ? 'pause' : 'play'} className="w-4 h-4 fill-current ml-0.5" />
            </button>

            {/* Step Back */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setActiveFrameIndex((prev) => (prev > 0 ? prev - 1 : (radarData?.frames.length || 1) - 1));
              }}
              title="Previous Frame (Left Arrow)"
              className="p-1.5 rounded hover:bg-[var(--paper-2)] text-[var(--ink-2)] transition-colors shrink-0"
            >
              <Icon name="chevron-left" className="w-4 h-4" />
            </button>

            {/* Timeline Scrubber */}
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={(radarData?.frames.length || 1) - 1}
                value={activeFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setActiveFrameIndex(parseInt(e.target.value, 10));
                }}
                className="w-full accent-[var(--signal)] h-2 bg-[var(--paper-2)] rounded-lg cursor-pointer transition-all"
                aria-label="Radar frame timeline scrubber"
              />
            </div>

            {/* Step Forward */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setActiveFrameIndex((prev) => (prev + 1) % (radarData?.frames.length || 1));
              }}
              title="Next Frame (Right Arrow)"
              className="p-1.5 rounded hover:bg-[var(--paper-2)] text-[var(--ink-2)] transition-colors shrink-0"
            >
              <Icon name="chevron-right" className="w-4 h-4" />
            </button>

            {/* Frame Index Indicator */}
            <span className="font-mono text-xs text-[var(--ink-3)] shrink-0 w-12 text-right">
              {activeFrameIndex + 1}/{radarData?.frames.length || 0}
            </span>
          </div>

          {/* Bottom Toolbar: Opacity Slider & Reflectivity Legend */}
          <div className="flex items-center justify-between gap-4 mt-3 pt-2.5 border-t border-[var(--line)] text-xs">
            {/* Reflectivity Legend */}
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--ink-3)]">
              <span>REFLECTIVITY:</span>
              <div className="flex items-center gap-0.5">
                <span className="w-3 h-2.5 rounded-l bg-[#4682B4]" title="Light (15-30 dBZ)" />
                <span className="w-3 h-2.5 bg-[#0000FF]" title="Moderate (30-40 dBZ)" />
                <span className="w-3 h-2.5 bg-[#00FF00]" title="Convective (40-50 dBZ)" />
                <span className="w-3 h-2.5 bg-[#FFFF00]" title="Heavy (50-55 dBZ)" />
                <span className="w-3 h-2.5 rounded-r bg-[#FF0000]" title="Severe (55+ dBZ)" />
              </div>
              <span className="text-[10px]">LIGHT → HEAVY</span>
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase">OPACITY:</span>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-20 accent-[var(--signal)] h-1.5 bg-[var(--paper-2)] rounded cursor-pointer"
                title="Adjust radar layer opacity"
                aria-label="Radar layer opacity"
              />
              <span className="font-mono text-[10px] text-[var(--ink-2)] w-8">
                {Math.round(opacity * 100)}%
              </span>
            </div>
          </div>
        </>
      )}

      {/* Attribution & Overscaling Note */}
      <div className="mt-2 text-[10px] font-mono text-[var(--ink-3)] flex items-center justify-between border-t border-[var(--line)] pt-1.5">
        <span>Radar imagery © <a href="https://www.rainviewer.com/api/weather-maps-api.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">RainViewer</a></span>
        <span className="hidden sm:inline">Tiles native z0–z7 (overscaled above z7)</span>
      </div>
    </div>
  );
}
