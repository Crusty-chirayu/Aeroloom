'use client';

/**
 * LenisProvider — Smooth-scroll provider for landing-page routes ONLY.
 *
 * MOUNTING RULES (critical):
 *   - Mount on the `/` landing page layout ONLY.
 *   - NEVER mount on /map or any observatory/dashboard routes.
 *   - MapLibre GL manages its own scroll/touch — Lenis conflicts with it.
 *
 * Usage:
 *   // app/(landing)/layout.tsx
 *   import { LenisProvider } from '@/lib/motion/LenisProvider';
 *   export default function LandingLayout({ children }) {
 *     return <LenisProvider>{children}</LenisProvider>;
 *   }
 */

import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from './useReducedMotion';

interface LenisProviderProps {
  children: React.ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
