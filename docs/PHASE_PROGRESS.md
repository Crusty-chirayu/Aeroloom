# Aeroloom Redesign — Phase Progress & Audit Log

## Progress Overview

| Phase | Description | Status | Verification & Gates |
|---|---|---|---|
| **Phase 0** | Audit & Foundations, tokens, primitives, /dev/kit | **DONE** (commit `6d73256`) | Design tokens, typography, motion tokens, Radix base components |
| **Phase 0.5** | Altitude strip, Input micro-label, lint cleanup, initial screenshots | **DONE** (commit `a78e0d7`) | Persist adapter unused params, focus rings |
| **Phase 0.6** | Horizontal overflow fix, 5-viewport test script, lint accounting, reduced motion proof | **DONE** (commit pending) | 40/40 viewport tests pass, all screenshot widths exact, zero overflow |
| **Phase 1** | Data layer: FlightProvider adapter, Redis cache, route handlers, data docs | **IN PROGRESS** | Target: live endpoints, provider abstraction, normalization, 0 regressions |
| **Phase 2** | Aircraft system: SVG silhouettes, sprite atlas, blueprint art, /dev/aircraft | PENDING | Top-down silhouettes, ICAO type mapping, sprite atlas |
| **Phase 3** | Map page: MapLibre basemap, 60fps interpolation, flight panel, filters | PENDING | Core map surface, rewrite useLiveAircraft (clears remaining lint debt) |
| **Phase 4** | Flight & airport pages, search, data page | PENDING | Editorial layout, METAR decode, airport radar |
| **Phase 5A** | Landing page: preloader, nav, hero, pinned "Follow one flight" | PENDING | GSAP ScrollTrigger, Lenis, live background map |
| **Phase 5B** | Landing page: capabilities bento, split-flap board, specimen, CTA | PENDING | Responsive bento, flip board, final wordmark |
| **Phase 6** | Polish & QA, a11y, mobile, cross-browser, Lighthouse, cleanup | PENDING | Final production readiness |

---

## Phase 0.6 Execution & Verification Report

### 1. Horizontal Overflow Diagnosis & Remediation
- **Investigation**: Measured `document.documentElement.scrollWidth` and individual element bounding rects under Playwright across all routes at 360px and 390px.
- **Root Causes**:
  1. `/dev/kit` Header: Long flex row with multiple action buttons and title badges lacked responsive wrapping/collapsing, pushing total width to 532px.
  2. `/dev/kit` Altitude and Color Strata Strips: Flex children without `min-w-0` refused to shrink below minimum content text width.
  3. `/flight/[flightId]`: Action buttons container on stub page lacked `flex-wrap`, causing horizontal overflow on mobile viewports.
- **Remediation**:
  - Implemented responsive mobile action icons and text truncation on `/dev/kit` header.
  - Added `min-w-0 flex-1` and responsive typography (`text-[8px] sm:text-[9px]`) to all color swatch and altitude strata strips.
  - Added `flex-wrap` and responsive header truncation to `/flight/[flightId]`.
- **Reusable Automated Test**: Created `scripts/check-overflow.mjs`, which tests all 8 active routes at 360, 390, 768, 1280, and 1728 px viewport widths.
  - **Result: 40 / 40 checks PASS (0px overflow on every route).**

### 2. Screenshot Dimension Proofs
`scripts/take-phase0-screenshots.mjs` captured fresh full-page screenshots at explicit viewports with `deviceScaleFactor: 1` and verified dimensions directly against PNG binary headers:

| Route | Target Viewport | File | Rendered Image Width | Rendered Image Height | Status |
|---|---|---|---|---|---|
| `/dev/kit` | 390px | `kit_390px.png` | **390px** | 7,784px | ✓ EXACT MATCH |
| `/` | 390px | `landing_390px.png` | **390px** | 900px | ✓ EXACT MATCH |
| `/dev/kit` | 768px | `kit_768px.png` | **768px** | 5,243px | ✓ EXACT MATCH |
| `/` | 768px | `landing_768px.png` | **768px** | 900px | ✓ EXACT MATCH |
| `/dev/kit` | 1280px | `kit_1280px.png` | **1280px** | 4,783px | ✓ EXACT MATCH |
| `/` | 1280px | `landing_1280px.png` | **1280px** | 900px | ✓ EXACT MATCH |
| `/dev/kit` | 1728px | `kit_1728px.png` | **1728px** | 4,757px | ✓ EXACT MATCH |
| `/` | 1728px | `landing_1728px.png` | **1728px** | 900px | ✓ EXACT MATCH |
| `/dev/kit` (reduced-motion) | 1280px | `kit_1280px_reduced_motion.png` | **1280px** | 4,783px | ✓ EXACT MATCH |

### 3. Reduced Motion Verification
- Tested with `emulateMedia({ reducedMotion: 'reduce' })`.
- Verified in DOM and visual screenshot:
  - `useReducedMotion()` returns `true`.
  - Live status indicator switches to: `RESPECTS PREFERS-REDUCED-MOTION: ENABLED (CALMED FADES)`.
  - Notification badge displays: `prefers-reduced-motion active`.
  - Transition duration tokens drop to 10ms for instantaneous/calm transitions.

### 4. Lint Accounting & Resolution
- Previous run reported 7 warnings:
  - `app/search/page.tsx:49:13`: Next.js router warning -> **FIXED** with `useRouter().push()`.
  - `app/search/page.tsx:52:13`: Next.js router warning -> **FIXED** with `useRouter().push()`.
  - `docs/screenshots/take_screenshots.cjs`: CommonJS script flagged -> **REMOVED** and replaced with `scripts/take-phase0-screenshots.mjs`; `docs/**` added to ESLint global ignores.
  - `hooks/useLiveAircraft.ts` (lines 73, 202, 219, 291): 4 unique warning sites -> **CONFIRMED** as known debt slated for complete rewrite in Phase 3.
- Current ESLint status: **0 errors, 5 warnings** (only `hooks/useLiveAircraft.ts`).

### 5. Verification Gate Summary
- `tsc --noEmit`: 0 errors
- `eslint .`: 0 errors, 5 warnings (Phase 3 known debt)
- `npm test`: 101 / 101 tests passed (0 failures)
- `npm run build`: Compiled successfully (10 routes generated)
- `scripts/check-overflow.mjs`: 40 / 40 route-viewport combinations pass
