import type { SilhouetteState } from './types.ts';

export interface SilhouetteStyle {
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity: number;
  scale: number;
  state?: SilhouetteState;
}

/**
 * Returns style attributes for a given silhouette state
 */
export function getSilhouetteStyle(
  state: SilhouetteState = 'default',
  size: number = 48
): SilhouetteStyle {
  switch (state) {
    case 'selected':
      return {
        fill: '#FF4F1F',      // --signal
        stroke: '#FFFFFF',    // Crisp white outline
        strokeWidth: size <= 32 ? 1.5 : 2,
        opacity: 1,
        scale: 1.05,
        state: 'selected',
      };
    case 'hover':
      return {
        fill: '#0E1116',      // --ink
        stroke: '#FF4F1F',    // --signal hover halo
        strokeWidth: 1.5,
        opacity: 1,
        scale: 1.15,
        state: 'hover',
      };
    case 'stale':
      return {
        fill: '#0E1116',      // --ink
        opacity: 0.4,         // 40% opacity per spec
        scale: 1,
        state: 'stale',
      };
    case 'on_ground':
      return {
        fill: '#878D96',      // --ink-3
        opacity: 0.85,
        scale: 0.8,           // Smaller on ground
        state: 'on_ground',
      };
    case 'ground_shadow':
      return {
        fill: 'rgba(14, 17, 22, 0.12)', // 12% ink soft shadow
        opacity: 1,
        scale: 0.95,
        state: 'ground_shadow',
      };
    case 'default':
    default:
      return {
        fill: '#0E1116',      // --ink
        stroke: '#FFFFFF',
        strokeWidth: 0.5,     // Hairline outline for crispness against basemaps
        opacity: 1,
        scale: 1,
        state: 'default',
      };
  }
}
