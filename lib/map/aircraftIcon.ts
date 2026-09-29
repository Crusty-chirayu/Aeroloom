/**
 * Tactical Aircraft Marker Icon Generator
 *
 * Dynamically draws high-contrast, resolution-independent vector aircraft
 * silhouettes onto HTMLCanvas elements for registration into MapLibre GL's
 * WebGL texture atlas via `map.addImage()`.
 */

import type { Map as MapLibreMap } from 'maplibre-gl';

export const ICON_IDS = {
  CYAN: 'ac-icon-cyan',
  EMERALD: 'ac-icon-emerald',
  AMBER: 'ac-icon-amber',
  CRIMSON: 'ac-icon-crimson',
  VIOLET: 'ac-icon-violet',
  SELECTED: 'ac-icon-selected',
} as const;

/**
 * Renders an aircraft silhouette onto a canvas and returns ImageData
 */
function createAircraftImageData(
  primaryColor: string,
  strokeColor: string = '#080b11',
  isSelected: boolean = false
): ImageData {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const cx = size / 2;
  const cy = size / 2;

  // If selected, draw target reticle ring
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, 27, 0, Math.PI * 2);
    ctx.stroke();

    // Reticle crosshair ticks
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, 1);
    ctx.lineTo(cx, 7);
    ctx.moveTo(cx, size - 7);
    ctx.lineTo(cx, size - 1);
    ctx.moveTo(1, cy);
    ctx.lineTo(7, cy);
    ctx.moveTo(size - 7, cy);
    ctx.lineTo(size - 1, cy);
    ctx.stroke();
    ctx.restore();
  }

  // Draw aircraft silhouette (Pointed North-up 0°)
  ctx.save();
  ctx.fillStyle = primaryColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  // Nose
  ctx.moveTo(cx, cy - 22);

  // Right wing
  ctx.lineTo(cx + 3, cy - 8);
  ctx.lineTo(cx + 22, cy + 4);
  ctx.lineTo(cx + 22, cy + 7);
  ctx.lineTo(cx + 4, cy + 3);

  // Right fuselage to tail
  ctx.lineTo(cx + 4, cy + 12);
  ctx.lineTo(cx + 10, cy + 18);
  ctx.lineTo(cx + 10, cy + 20);
  ctx.lineTo(cx + 1.5, cy + 17);

  // Tail tip
  ctx.lineTo(cx, cy + 19);

  // Left tail
  ctx.lineTo(cx - 1.5, cy + 17);
  ctx.lineTo(cx - 10, cy + 20);
  ctx.lineTo(cx - 10, cy + 18);
  ctx.lineTo(cx - 4, cy + 12);

  // Left wing
  ctx.lineTo(cx - 4, cy + 3);
  ctx.lineTo(cx - 22, cy + 7);
  ctx.lineTo(cx - 22, cy + 4);
  ctx.lineTo(cx - 3, cy - 8);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  return ctx.getImageData(0, 0, size, size);
}

/**
 * Registers all aircraft icons into the MapLibre Map instance.
 * Safe to call idempotently across style reloads.
 */
export function registerAircraftIcons(map: MapLibreMap): void {
  if (typeof window === 'undefined') return;

  const icons = [
    { id: ICON_IDS.CYAN, color: '#38bdf8', selected: false },
    { id: ICON_IDS.EMERALD, color: '#10b981', selected: false },
    { id: ICON_IDS.AMBER, color: '#f59e0b', selected: false },
    { id: ICON_IDS.CRIMSON, color: '#ef4444', selected: false },
    { id: ICON_IDS.VIOLET, color: '#818cf8', selected: false },
    { id: ICON_IDS.SELECTED, color: '#38bdf8', selected: true },
  ];

  for (const { id, color, selected } of icons) {
    if (!map.hasImage(id)) {
      try {
        const imgData = createAircraftImageData(color, '#080b11', selected);
        map.addImage(id, imgData, { pixelRatio: 2 });
      } catch (e) {
        console.error(`Failed to register icon ${id}:`, e);
      }
    }
  }
}
