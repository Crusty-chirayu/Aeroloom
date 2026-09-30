/**
 * Aeroloom MapLibre Vector Aircraft Sprite Atlas Generator
 *
 * Replaces legacy canvas-drawn icons with the authentic 11-category hand-authored vector silhouettes.
 * Supports DPR 1x, 2x, 3x for crisp rendering across Retina and mobile displays.
 * Registers all 11 categories × 6 visual states = 66 unique tactical markers into MapLibre GL.
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import { SILHOUETTES } from './silhouettes/paths.ts';
import { getSilhouetteStyle, type SilhouetteStyle } from './silhouettes/styles.ts';
import type { AircraftCategory, SilhouetteState } from './silhouettes/types.ts';

export const ALL_AIRCRAFT_CATEGORIES: AircraftCategory[] = [
  'narrowbody',
  'widebody_twin',
  'quad',
  'regional_jet',
  'turboprop',
  'bizjet',
  'light_ga',
  'helicopter',
  'cargo',
  'military',
  'unknown',
];

export const ALL_SILHOUETTE_STATES: SilhouetteState[] = [
  'default',
  'selected',
  'hover',
  'stale',
  'on_ground',
  'ground_shadow',
];

/**
 * Returns the canonical MapLibre image ID for an aircraft marker.
 * Example: 'ac-narrowbody-default', 'ac-helicopter-selected', 'ac-quad-ground_shadow'
 */
export function getAircraftSpriteId(
  category: AircraftCategory = 'unknown',
  state: SilhouetteState = 'default'
): string {
  return `ac-${category}-${state}`;
}

/**
 * Generates an SVG string representation of a category in a given state.
 */
export function generateSilhouetteSvgString(
  category: AircraftCategory,
  state: SilhouetteState = 'default',
  size: number = 64
): string {
  const def = SILHOUETTES[category] || SILHOUETTES.unknown;
  const style: SilhouetteStyle = getSilhouetteStyle(state);

  const detailSvg = (def.detailPaths || [])
    .map((d) => {
      const fill = d.fill !== undefined ? d.fill : style.fill;
      const stroke = d.stroke || (state === 'selected' ? '#FFFFFF' : '#0E1116');
      const strokeWidth = d.strokeWidth ?? (d.stroke ? 1.5 : 0);
      const dash = d.strokeDasharray ? `stroke-dasharray="${d.strokeDasharray}"` : '';
      const opacity = d.opacity !== undefined ? `opacity="${d.opacity}"` : '';
      return `<path d="${d.d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" ${dash} ${opacity} />`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <g transform="scale(${style.scale}) transform-origin(32 32)" opacity="${style.opacity}">
      <path d="${def.bodyPath}" fill="${style.fill}" stroke="${style.stroke || 'none'}" stroke-width="${style.strokeWidth || 0}" stroke-linejoin="round" stroke-linecap="round" />
      ${detailSvg}
    </g>
  </svg>`;
}

/**
 * Renders an aircraft silhouette SVG to an HTMLCanvasElement and extracts ImageData.
 */
export async function renderSilhouetteToImageData(
  category: AircraftCategory,
  state: SilhouetteState = 'default',
  dpr: number = 2
): Promise<ImageData> {
  const baseSize = 64;
  const pixelSize = Math.round(baseSize * dpr);

  const canvas = document.createElement('canvas');
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const svgString = generateSilhouetteSvgString(category, state, pixelSize);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.width = pixelSize;
  img.height = pixelSize;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load SVG for ${category}:${state}`));
    img.src = url;
  });

  ctx.drawImage(img, 0, 0, pixelSize, pixelSize);
  URL.revokeObjectURL(url);

  return ctx.getImageData(0, 0, pixelSize, pixelSize);
}

/**
 * Registers all 66 aircraft category/state combinations into MapLibre GL.
 */
export async function registerAllAircraftSprites(
  map: MapLibreMap,
  dpr: number = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2
): Promise<void> {
  if (typeof window === 'undefined' || !map) return;

  const promises: Promise<void>[] = [];

  for (const category of ALL_AIRCRAFT_CATEGORIES) {
    for (const state of ALL_SILHOUETTE_STATES) {
      const iconId = getAircraftSpriteId(category, state);
      if (map.hasImage(iconId)) continue;

      promises.push(
        renderSilhouetteToImageData(category, state, dpr).then((imageData) => {
          if (!map.hasImage(iconId)) {
            map.addImage(iconId, imageData, { pixelRatio: dpr });
          }
        }).catch((err) => {
          console.warn(`Failed to register aircraft sprite ${iconId}:`, err);
        })
      );
    }
  }

  await Promise.all(promises);
}
