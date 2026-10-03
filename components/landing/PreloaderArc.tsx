'use client';

import React, { useState, useEffect } from 'react';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';
import { SILHOUETTES } from '@/lib/map/silhouettes/paths';

interface PreloaderArcProps {
  onComplete?: () => void;
  airborneCount?: number;
}

export function PreloaderArc({ onComplete, airborneCount = 12481 }: PreloaderArcProps) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [counter, setCounter] = useState(0);
  const [arcProgress, setArcProgress] = useState(0);

  const dismiss = React.useCallback(() => {
    sessionStorage.setItem('aeroloom_preloaded', 'true');
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    // Check session storage
    if (typeof window === 'undefined') return;
    const hasPreloaded = sessionStorage.getItem('aeroloom_preloaded');

    if (hasPreloaded || reducedMotion) {
      onComplete?.();
      return;
    }

    // First time in session: run the 1.1s preloader
    const timer = setTimeout(() => {
      setMounted(true);
      setVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [reducedMotion, onComplete]);

  useEffect(() => {
    if (!visible) return;

    const startTime = performance.now();
    const duration = 850; // 850ms arc draw and tick

    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - p, 3);

      setArcProgress(ease);
      setCounter(Math.round(ease * airborneCount));

      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Complete counter and start wipe
        setTimeout(() => {
          setIsWiping(true);
          setTimeout(() => {
            sessionStorage.setItem('aeroloom_preloaded', 'true');
            setVisible(false);
            onComplete?.();
          }, 250); // 250ms wipe up
        }, 100);
      }
    };

    rafId = requestAnimationFrame(tick);

    // Keyboard listener: Esc to skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, airborneCount, onComplete, dismiss]);

  if (!mounted || !visible) return null;

  // Compute position along parabolic arc M 40 160 Q 250 40 460 160
  // Quadratic bezier: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
  const t = arcProgress;
  const p0x = 40, p0y = 160;
  const p1x = 250, p1y = 40;
  const p2x = 460, p2y = 160;

  const curX = Math.pow(1 - t, 2) * p0x + 2 * (1 - t) * t * p1x + Math.pow(t, 2) * p2x;
  const curY = Math.pow(1 - t, 2) * p0y + 2 * (1 - t) * t * p1y + Math.pow(t, 2) * p2y;

  // Tangent angle
  const dx = 2 * (1 - t) * (p1x - p0x) + 2 * t * (p2x - p1x);
  const dy = 2 * (1 - t) * (p1y - p0y) + 2 * t * (p2y - p1y);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // Align with silhouette nose

  return (
    <div
      role="status"
      aria-label="Calibrating transponder frequencies"
      onClick={dismiss}
      className={`fixed inset-0 z-50 bg-[var(--paper)] flex flex-col items-center justify-center p-6 cursor-pointer select-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isWiping ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="w-full max-w-[500px] flex flex-col items-center space-y-6">
        {/* Great-Circle Flight Arc SVG */}
        <div className="relative w-full aspect-[500/200]">
          <svg
            viewBox="0 0 500 200"
            className="w-full h-full overflow-visible"
            fill="none"
          >
            {/* Guide dashed line */}
            <path
              d="M 40 160 Q 250 40 460 160"
              stroke="var(--line-strong)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              strokeLinecap="round"
            />
            {/* Drawing great circle arc */}
            <path
              d="M 40 160 Q 250 40 460 160"
              stroke="var(--signal)"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - arcProgress}
            />

            {/* Departure & Arrival Waypoints */}
            <circle cx="40" cy="160" r="4" fill="var(--ink)" />
            <circle cx="460" cy="160" r="4" fill="var(--signal)" />

            {/* Aircraft silhouette riding the curve */}
            <g
              transform={`translate(${curX}, ${curY}) rotate(${angleDeg})`}
              className="text-[var(--ink)] fill-current"
            >
              <g transform="translate(-12, -12) scale(0.375)">
                <path d={SILHOUETTES['narrowbody'].bodyPath} />
              </g>
            </g>
          </svg>
        </div>

        {/* Live Airborne Ticker Counter */}
        <div className="text-center space-y-2">
          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
            {counter.toLocaleString()}
          </div>
          <div className="mono-label text-[11px] text-[var(--ink-3)] tracking-widest flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] animate-pulse" />
            <span>CALIBRATING TRANSPONDER FREQUENCIES</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-[var(--ink-4)] pt-4">
          PRESS ESC OR TAP ANYWHERE TO ENTER
        </div>
      </div>
    </div>
  );
}
