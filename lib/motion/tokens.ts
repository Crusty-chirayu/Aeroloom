/**
 * Aeroloom Motion System — Easing & Duration Tokens
 *
 * Mirrors the CSS custom properties in tokens.css so JS animation
 * libraries (GSAP, framer-motion) use the same values.
 * Never hard-code easing strings in components — import from here.
 */

// Matches --ease-out-expo in tokens.css
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
// Matches --ease-in-out in tokens.css
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** GSAP-friendly ease strings */
export const GSAP_EASE = {
  outExpo: "power4.out",
  inOut: "power2.inOut",
  snap: "power4.inOut",
} as const;

/** Framer-motion transition presets */
export const MOTION_TRANSITION = {
  outExpo: {
    ease: [...EASE_OUT_EXPO] as [number, number, number, number],
    duration: 0.8,
  },
  ui: {
    ease: [...EASE_OUT_EXPO] as [number, number, number, number],
    duration: 0.28,
  },
  micro: {
    ease: "easeOut" as const,
    duration: 0.15,
  },
} as const;

/** Duration tokens in seconds (framer-motion uses seconds) */
export const DUR = {
  micro: 0.15,
  ui: 0.28,
  reveal: 0.8,
} as const;

/** Duration tokens in milliseconds (GSAP / CSS) */
export const DUR_MS = {
  micro: 150,
  ui: 280,
  reveal: 800,
} as const;
