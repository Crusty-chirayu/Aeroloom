/**
 * Aeroloom Brand System Tokens & Specifications
 *
 * Canonical values for colors, typography, sizing, and geometric mark paths.
 */

export const BRAND_TOKENS = {
  name: 'Aeroloom',
  tagline: 'Live Airspace Cartography & Flight Intelligence',
  philosophy: 'Editorial Aviation',
  theme: 'Light Only (#F6F4EE)',
  colors: {
    paper: '#F6F4EE',
    paperAlt: '#EFECE4',
    ink: '#0E1116',
    inkSecondary: '#3B4250',
    inkMuted: '#6E7686',
    signal: '#FF4F1F',
    signalWash: '#FFE9E1',
    sky: '#2B62F0',
  },
  typography: {
    display: 'Instrument Serif',
    ui: 'Geist Sans',
    data: 'Geist Mono',
  },
  mark: {
    viewBox: '0 0 32 32',
    gridSize: 32,
    weftPath: 'M 5 24 C 9 24, 12 18, 15 12 C 17.5 7, 21.5 5.5, 24.5 7.5 C 27.5 9.5, 27 15, 23.5 18 C 19 22, 11 22.5, 7.5 17 C 4.5 12, 7 6.5, 13.5 6.5 C 19 6.5, 23.5 11, 26.5 17',
    warpPath: 'M 10 9 C 14 13, 18 19, 22 25',
    beaconDot: { cx: 26.5, cy: 17, r: 2.8 },
    strokeWidth: 2.4,
  },
  sizing: {
    sm: 20,
    md: 28,
    lg: 38,
    xl: 52,
  },
} as const;
