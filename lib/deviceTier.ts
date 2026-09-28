export type DeviceTier = 'full' | 'reduced' | 'static';

export interface TierConfig {
  tier: DeviceTier;
  pointCount: number;
  gridX: number;
  gridZ: number;
  bloom: boolean;
  dpr: number;
  reason: string;
}

export const TIER_CONFIGS: Record<DeviceTier, TierConfig> = {
  full: {
    tier: 'full',
    pointCount: 9600, // 120 x 80 grid
    gridX: 120,
    gridZ: 80,
    bloom: true,
    dpr: 1.5,
    reason: 'High performance device (>=8 cores, >=50 FPS probe)',
  },
  reduced: {
    tier: 'reduced',
    pointCount: 2400, // 60 x 40 grid
    gridX: 60,
    gridZ: 40,
    bloom: false,
    dpr: 1.0,
    reason: 'Balanced profile (standard hardware, reduced point count, bloom off)',
  },
  static: {
    tier: 'static',
    pointCount: 0,
    gridX: 0,
    gridZ: 0,
    bloom: false,
    dpr: 1.0,
    reason: 'Static fallback (WebGL unsupported, context lost, or probe <20 FPS)',
  },
};

/**
 * Pure evaluation function for hardware capability
 */
export function evaluateHardwareTier(
  concurrency: number,
  measuredFps: number,
  isWebGLSupported: boolean
): DeviceTier {
  if (!isWebGLSupported || measuredFps < 20) {
    return 'static';
  }

  // Full tier requires hardwareConcurrency >= 8 and sustained >= 50 FPS
  if (concurrency >= 8 && measuredFps >= 50) {
    return 'full';
  }

  return 'reduced';
}

/**
 * Check if WebGL2 or WebGL is supported by the current browser
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Check for manual URL or local storage tier override
 */
export function getTierOverride(): DeviceTier | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. URL search param check: ?tier=full|reduced|static
    const params = new URLSearchParams(window.location.search);
    const paramTier = params.get('tier')?.toLowerCase();
    if (paramTier === 'full' || paramTier === 'reduced' || paramTier === 'static') {
      return paramTier;
    }

    // 2. Local storage check
    const storedTier = localStorage.getItem('aeroloom_tier_override')?.toLowerCase();
    if (storedTier === 'full' || storedTier === 'reduced' || storedTier === 'static') {
      return storedTier;
    }
  } catch {
    // Ignore storage/search errors
  }

  return null;
}

/**
 * Set manual tier override in local storage
 */
export function setTierOverride(tier: DeviceTier | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (tier) {
      localStorage.setItem('aeroloom_tier_override', tier);
    } else {
      localStorage.removeItem('aeroloom_tier_override');
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Runs a 1-second FPS probe in the browser to sample frame times
 */
export async function runFpsProbe(durationMs: number = 1000): Promise<number> {
  if (typeof window === 'undefined') return 60;

  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();

    function onFrame(currentTime: number) {
      frameCount++;
      const elapsed = currentTime - startTime;
      if (elapsed >= durationMs) {
        const measuredFps = Math.round((frameCount * 1000) / elapsed);
        resolve(measuredFps);
      } else {
        requestAnimationFrame(onFrame);
      }
    }

    requestAnimationFrame(onFrame);
  });
}

/**
 * Check if the user has requested reduced motion for accessibility
 */
export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Resolve device tier with override support and hardware probe
 */
export async function resolveDeviceTier(): Promise<TierConfig> {
  const override = getTierOverride();
  if (override) {
    return {
      ...TIER_CONFIGS[override],
      reason: `Manual override: '${override}'`,
    };
  }

  if (typeof window === 'undefined') {
    return TIER_CONFIGS.reduced;
  }

  // Accessibility: respect reduced motion preferences
  if (isReducedMotionPreferred()) {
    return {
      ...TIER_CONFIGS.reduced,
      reason: 'Accessibility preference: prefers-reduced-motion detected (calmed motion)',
    };
  }

  const webGL = isWebGLAvailable();
  if (!webGL) {
    return TIER_CONFIGS.static;
  }

  const concurrency = navigator.hardwareConcurrency || 4;
  const measuredFps = await runFpsProbe(800); // 800ms probe for responsive init

  const tier = evaluateHardwareTier(concurrency, measuredFps, webGL);
  return {
    ...TIER_CONFIGS[tier],
    reason: `Evaluated: ${concurrency} cores, ${measuredFps} measured FPS, WebGL=${webGL}`,
  };
}
