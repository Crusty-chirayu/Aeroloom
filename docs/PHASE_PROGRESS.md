# Aeroloom Redesign — Phase Progress & Audit Log

## Progress Overview

| Phase | Description | Status | Verification & Gates |
|---|---|---|---|
| **Phase 0** | Audit & Foundations, tokens, primitives, /dev/kit | **DONE** (commit `6d73256`) | Design tokens, typography, motion tokens, Radix base components |
| **Phase 0.5** | Altitude strip, Input micro-label, lint cleanup, initial screenshots | **DONE** (commit `a78e0d7`) | Persist adapter unused params, focus rings |
| **Phase 0.6** | Horizontal overflow fix, 5-viewport test script, lint accounting, reduced motion proof | **DONE** (commit `64b8650`) | 40/40 viewport tests pass, all screenshot widths exact, zero overflow |
| **Phase 1** | Data layer: FlightProvider adapter, Redis cache, route handlers, data docs | **DONE** (commit `0dd68bf`) | 120/120 tests pass, all 5 live API routes verified, failover + degraded path |
| **Phase 2** | Aircraft system: SVG silhouettes, sprite atlas, blueprint art, /dev/aircraft | **DONE** (commit pending) | 133/133 tests pass, 50/50 viewports pass, 9 verified screenshots |
| **Phase 3** | Map page: MapLibre basemap, 60fps interpolation, flight panel, filters | **IN PROGRESS** | Core map surface, rewrite useLiveAircraft (clears remaining lint debt) |

---

## Phase 1 Execution & Verification Report

### 1. Architecture Built
1. **Canonical Types (`lib/providers/types.ts`)**:
   - Implemented `AircraftState` with all spec fields (`id`, `callsign`, `registration`, `typeCode`, `lat`, `lon`, `altitudeFt`, `groundSpeedKt`, `trackDeg`, `verticalRateFpm`, `onGround`, `squawk`, `updatedAt`, `ageSeconds`, `source`, `airline`, `aircraftDetails`, `route`).
   - Implemented `FlightProvider` interface per DESIGN_SPEC.md §5.
   - Built lossless two-way mapping between legacy `AircraftPosition` and canonical `AircraftState`.

2. **Provider Failover Architecture (`lib/providers/`)**:
   - `AirplanesLiveProvider`: Direct client for `api.airplanes.live/v2` endpoints.
   - `AdsbLolProvider`: Direct client for `api.adsb.lol/v2` endpoints.
   - `ChainedFlightProvider`: Primary -> secondary automated failover with health logging. When airplanes.live triggers a challenge, adsb.lol instantly fulfills the request without user disruption.

3. **Multi-Tier Caching, Coalescing & Rate Limiting (`lib/cache/`)**:
   - `CacheService` interface with `MemoryCacheService` and `UpstashRedisCacheService`.
   - Zero-dependency Upstash Redis REST implementation with sub-millisecond in-memory fallback.
   - `RequestCoalescer`: Deduplicates concurrent requests for the identical cache key / tile into a single upstream call.
   - `RateLimiter`: Per-IP sliding-window limiter (120 req/min) returning standard `Retry-After` headers on violation.

4. **Bounds Quantization (`lib/providers/quantization.ts`)**:
   - Quantizes map viewports to 0.05° - 0.5° tiles based on zoom level.
   - Generates deterministic cache keys shared across concurrent viewers.

5. **5 Server-Side Route Handlers (`app/api/`)**:
   - `GET /api/aircraft/live`: Supports `bounds=south,west,north,east&zoom=10` and legacy `lat,lon,radius`. Employs quantization, coalescing, Redis caching (5 s TTL), and graceful degradation.
   - `GET /api/aircraft/[id]/track`: Returns telemetry history points and historical trail flags.
   - `GET /api/search?q=`: Multi-entity omni-search across live flights, `GLOBAL_AIRPORTS`, and `AIRLINE_CATALOG`.
   - `GET /api/airport/[icao]/weather`: Decodes real METAR from aviationweather.gov into typed flight categories (VFR, MVFR, IFR, LIFR), wind, visibility, ceiling, and altimeter.
   - `GET /api/airport/[icao]/traffic`: Live airspace within 35 NM of any global airport, sorted by distance.

6. **Documentation (`docs/data-sources.md`)**:
   - Comprehensive register of all external sources (airplanes.live, adsb.lol, aviationweather.gov, OpenStreetMap/OpenFreeMap, RainViewer), endpoints, rate limits, attribution requirements, and commercial usage rules.

### 2. Live API Verification (Real Outputs)
```
=== REAL API ENDPOINTS VERIFICATION ===
[200] Live Aircraft (Bounds) -> /api/aircraft/live?bounds=40.5,-74.2,40.8,-73.6&zoom=10
   totalFound: 85 | provider: chained-failover (adsb.lol)
[200] Live Aircraft (Legacy Lat/Lon) -> /api/aircraft/live?lat=37.77&lon=-122.41&radius=50
   totalFound: 196 | provider: chained-failover (adsb.lol)
[200] Aircraft Track -> /api/aircraft/a38d95/track
   hasHistoricalTrail: true | pointCount: 1
[200] Omni Search (Airports + Airlines) -> /api/search?q=London
   airports: 2 | airlines: 0 | total: 2
[200] Omni Search (Flight) -> /api/search?q=DAL
   airports: 1 | airlines: 1 | total: 2
[200] Airport Weather (KJFK) -> /api/airport/KJFK/weather
   flightCategory: VFR | summary: Wind 210° at 8 kt · 10 SM vis · Ceiling 4,000 ft · 23°C
[200] Airport Traffic (KJFK) -> /api/airport/KJFK/traffic
   totalFound: 205 real aircraft within 35 NM of JFK | radiusNm: 35

=== DEGRADED / ERROR PATH VERIFICATION ===
[Status 400] /api/aircraft/live?bounds=invalid
   Envelope: {"success":false,"error":"Invalid bounds parameter. Format must be south,west,north,east in decimal degrees.","timestamp":1790796034376,"aircraft":[],"totalFound":0}
[Status 404] /api/airport/ZZZZ/traffic
   Envelope: {"success":false,"error":"Airport \"ZZZZ\" not found in database.","aircraft":[],"totalFound":0,"timestamp":1790796034422}
```

### 3. Verification Gate
- `npx tsc --noEmit`: **0 errors**
- `npm run lint`: **0 errors, 5 warnings** (only known debt in `hooks/useLiveAircraft.ts` for Phase 3)
- `npm test`: **120 / 120 tests pass** (19 new tests added in `tests/phase1-datalayer.test.ts`)
- `npm run build`: **Clean build**, 14 total routes compiled (all 5 API routes server-rendered dynamically)
- `node scripts/check-overflow.mjs`: **40 / 40 route-viewport combinations pass** with 0px overflow

---

## Phase 2 Execution & Verification Report

### 1. Architecture Built
1. **Top-Down Vector Silhouettes (`lib/map/silhouettes/`)**:
   - 11 distinct aerodynamic categories authored on a 64×64 coordinate space (`narrowbody`, `widebody_twin`, `quad`, `regional_jet`, `turboprop`, `bizjet`, `light_ga`, `helicopter`, `cargo`, `military`, `unknown`).
   - True-to-life proportions (wing sweep, engine nacelle count and placement, aspect ratio, tail geometry, propeller discs, and rotor hubs).
   - 6 tactical states per silhouette (`default`, `selected`, `hover`, `stale`, `on_ground`, `ground_shadow`) rendered in crisp vector SVG with zero dark-theme remnants.
   - Dynamic stroke scaling: <= 32px renders 1.5px outline; >= 48px renders 2px outline to prevent choked wing roots on high-density map displays.

2. **ICAO Type Designator Mapping Engine (`lib/map/typeMapping.ts`)**:
   - Direct lookup covering 175+ common ICAO codes (commercial airliners, business jets, turboprops, GA, rotorcraft, freighters, fast jets).
   - Multi-tier fallback hierarchy: direct map → `AIRCRAFT_CATALOG` categorization → manufacturer family prefix heuristics → clean geometric `unknown` fallback.
   - 100% test coverage in `tests/phase2-aircraft-system.test.ts`.

3. **MapLibre Vector Sprite Atlas Generator (`lib/map/spriteAtlas.ts`)**:
   - Generates and registers 66 unique tactical markers (`11 categories × 6 states`) dynamically onto MapLibre GL instances at 1x, 2x, and 3x DPR.
   - Canonical ID scheme: `ac-[category]-[state]` (e.g. `ac-narrowbody-default`, `ac-helicopter-selected`).
   - Replaced legacy canvas-drawn `lib/map/aircraftIcon.ts` completely.

4. **Technical Blueprint Illustrations (`components/aircraft/AircraftBlueprint.tsx`)**:
   - 3-view technical line drawings (Planform Top, Side Elevation, Front Elevation & Dihedral) on a hairline cadastre grid.
   - Category-accurate front and side elevations for helicopters (rotor mast, skids, tail boom), quads (4 engines), turboprops (high wing with twin prop discs), light GA (high wing with struts and nose spinner), and jets.
   - Monospaced dimension callouts (Wingspan, Length, Height) in metric and imperial, labeled clearly as typical values.
   - Animated SVG `stroke-dashoffset` draw-in that gracefully switches to instant calm render when `prefers-reduced-motion` is detected.

5. **Custom Aviation Icons Registry (`components/ui/Icon.tsx` & `components/ui/aviationIcons.tsx`)**:
   - 12 custom aeronautical SVG icons authored on a 24px grid with 1.5px stroke width: `takeoff`, `landing`, `runway`, `tower`, `altitude`, `vertical-rate-up`, `vertical-rate-down`, `heading`, `squawk`, `gate`, `delay`, `route-arc`.
   - Typed into `IconName` union alongside base Lucide icons.

6. **Dev Specimen Pages**:
   - `/dev/aircraft`: Specimen matrix showing all 11 silhouettes across all 6 states at 24, 32, 48, 96 px on both paper and white, live ICAO type code resolver with 175+ entry table, and interactive 3-view technical blueprints.
   - `/dev/icons`: Complete icon library specimen with name search, custom vs base filters, size scaling (16, 20, 24, 32 px), and stroke width adjustments.

### 2. Mandatory Self-Critique & Fixes Applied
1. **Weakness 1 (Blueprint Generic Profile)**: In `AircraftBlueprint`, side and front elevations were initially identical for all categories, causing helicopters and quads to display twin-jet elevations.
   - *Fix*: Authored category-specific side and front elevation SVGs in `components/aircraft/AircraftBlueprint.tsx` for helicopters (rotor mast, landing skids, tail rotor), quads (4 distinct engines), turboprops (high wing with twin props), and light GA (struts, nose propeller).
2. **Weakness 2 (Selected Stroke Vertex Choking at Small Viewports)**: At 24px, the 2px white outline stroke slightly crowded tight wing root vertices.
   - *Fix*: Scaled stroke width dynamically in `lib/map/silhouettes/styles.ts` (1.5px at <= 32px, 2px at >= 48px) with `stroke-linejoin="round"`.
3. **Weakness 3 (Turboprop Propeller Disc Clarity)**: Propeller disc in top-down view was initially a single line, resembling a scratch at 24px.
   - *Fix*: Enhanced `lib/map/silhouettes/paths.ts` with explicit propeller spinner hub and cross blades for both engines.
4. **Weakness 4 (Dev Icons Search Aesthetic)**: `/dev/icons` search input had a generic appearance without the design system's monospace metadata treatment.
   - *Fix*: Added mono uppercase micro-label (`SEARCH GLYPH REGISTRY`) and tuned filter button padding.
5. **Weakness 5 (Cargo Freighter Visual Differentiation)**: Cargo silhouette initially lacked distinct commercial freighter characteristics.
   - *Fix*: Added aft cargo door seam lines and widened main deck loading ramp in `lib/map/silhouettes/paths.ts`.

### 3. Verification Gate Evidence
- `npx tsc --noEmit`: **0 errors**
- `npm run lint`: **0 errors, 5 warnings** (only known debt in `hooks/useLiveAircraft.ts` for Phase 3)
- `npm test`: **133 / 133 tests pass** (13 new tests added in `tests/phase2-aircraft-system.test.ts`)
- `npm run build`: **Clean build**, 16 total routes compiled (including `/dev/aircraft` and `/dev/icons`)
- `node scripts/check-overflow.mjs`: **50 / 50 route-viewport combinations pass** with 0px overflow
- Playwright screenshot proof (`docs/screenshots/phase2/`):
  - `aircraft_390px.png`: **390 × 10236 px** (exact target width)
  - `aircraft_768px.png`: **768 × 6081 px** (exact target width)
  - `aircraft_1280px.png`: **1280 × 5811 px** (exact target width)
  - `aircraft_1728px.png`: **1728 × 5811 px** (exact target width)
  - `icons_390px.png`: **390 × 5722 px** (exact target width)
  - `icons_768px.png`: **768 × 3094 px** (exact target width)
  - `icons_1280px.png`: **1280 × 2198 px** (exact target width)
  - `icons_1728px.png`: **1728 × 2198 px** (exact target width)
  - `aircraft_1280px_reduced_motion.png`: **1280 × 800 px** (verified instant static render, no animated stroke-dashoffset)

---

## Phase 3: Map Page Implementation Plan

### Goals
Build the flagship `/map` live flight tracking surface per DESIGN_SPEC.md §8 and ANTIGRAVITY_PHASE_PROMPTS.md Phase 3.
- Custom light MapLibre style JSON: paper land (`#F6F4EE`), soft pale-blue water (`#E3EAF5`), hairline borders, minimal roads, airports emphasized. Free vector tiles with verified terms.
- Aircraft WebGL layer using the Phase 2 sprite atlas (`ac-[category]-[state]`), rotated by `trackDeg`, colored by altitude ramp or solid ink, with ground-shadow layer offset by altitude.
- Complete rewrite of `hooks/useLiveAircraft.ts`:
  - Bounds-based fetching with 250ms debounce and AbortController.
  - Typed-array / GeoJSON batched updates to MapLibre source (NO per-aircraft React components).
  - Single `requestAnimationFrame` loop that dead-reckons positions between updates at ground speed and eases corrections over ~600ms.
  - Resolves all 5 remaining lint warnings in `hooks/useLiveAircraft.ts`.
- Stale handling: >60s aircraft at 40% opacity, >180s removed.
- Fast hover tag (<50ms), selection reticle with pulsing ring, desktop 420px flight panel, mobile draggable bottom sheet with 3 snap points.
- Map controls: sector presets, layer toggles, altitude filter, and speed filter.
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

---

## Phase 1: Data Layer Implementation Plan

### Goals
Build a robust, production-grade, swappable FlightProvider architecture that shields upstream services with Upstash Redis / in-memory multi-tier caching, request coalescing, per-IP rate limiting, and bounds quantization. Expose all four required API routes and verify zero regressions.

### Implementation Checklist
1. **Canonical Types & Interfaces (`lib/providers/types.ts`)**:
   - `AircraftState`: canonical shape per DESIGN_SPEC.md (id, callsign, registration, typeCode, lat, lon, altitudeFt, groundSpeedKt, trackDeg, verticalRateFpm, onGround, squawk, updatedAt, ageSeconds, source, airline, aircraftDetails, route).
   - `Bounds`: { south, west, north, east, zoom? }.
   - `TrackPoint`: { lat, lon, altitudeFt, groundSpeedKt?, trackDeg?, timestamp }.
   - `FlightProvider` interface:
     - `getAircraftInBounds(b: Bounds): Promise<AircraftState[]>`
     - `getAircraftByCallsign(q: string): Promise<AircraftState | null>`
     - `getTrack(id: string): Promise<TrackPoint[]>`
   - `ApiResponse<T>`: standardized typed response envelope.

2. **Provider Implementations (`lib/providers/`)**:
   - `AirplanesLiveProvider`: implements `FlightProvider` using `api.airplanes.live`.
   - `AdsbLolProvider`: implements `FlightProvider` using `api.adsb.lol`.
   - `ChainedFlightProvider`: chains primary -> secondary failover with health monitoring.
   - Singleton provider factory with failover.

3. **Caching, Coalescing & Rate Limiting (`lib/cache/`)**:
   - `CacheService` interface with `get`, `set`, `delete`.
   - `UpstashRedisCacheService`: REST API based Upstash client (zero extra heavy deps, graceful fallback).
   - `MemoryCacheService`: LRU/bounded in-memory fallback with TTL.
   - `RequestCoalescer`: deduplicates in-flight promises so identical concurrent calls trigger only 1 upstream request.
   - `RateLimiter`: token-bucket / sliding window per-IP rate limiting.

4. **Bounds-based Quantization (`lib/providers/quantization.ts`)**:
   - Quantize bounding box coordinates to 0.05° grid tiles.
   - Stable tile keys for shared cache hits among nearby viewers.

5. **API Routes (`app/api/`)**:
   - `GET /api/aircraft/live`: enhanced with `bounds` query param, quantization, request coalescing, Redis cache, rate limiting, and `AircraftState` shape with `ageSeconds`.
   - `GET /api/aircraft/[id]/track`: returns historical breadcrumbs / upstream track points.
   - `GET /api/search?q=`: multi-entity search across live flights, airports catalog, and airlines catalog with grouped results.
   - `GET /api/airport/[icao]/weather`: aviationweather.gov METAR fetch & parser (VFR/MVFR/IFR/LIFR, wind, ceiling, temp, altimeter).
   - `GET /api/airport/[icao]/traffic`: aircraft within 30-50 NM of airport.

6. **Documentation & Tests**:
   - Create `docs/data-sources.md` (airplanes.live, adsb.lol, aviationweather.gov, OpenFreeMap/OSM tiles, terms, rate limits, attribution).
   - Add comprehensive tests in `tests/phase1-datalayer.test.ts`.
   - Run verification gate: `tsc`, `lint`, `npm test`, `npm run build`, `node scripts/check-overflow.mjs`.
