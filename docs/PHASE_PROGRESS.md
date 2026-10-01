# Aeroloom Redesign — Phase Progress & Audit Log

## Progress Overview

| Phase | Description | Status | Verification & Gates |
|---|---|---|---|
| **Phase 0** | Audit & Foundations, tokens, primitives, /dev/kit | **DONE** (commit `6d73256`) | Design tokens, typography, motion tokens, Radix base components |
| **Phase 0.5** | Altitude strip, Input micro-label, lint cleanup, initial screenshots | **DONE** (commit `a78e0d7`) | Persist adapter unused params, focus rings |
| **Phase 0.6** | Horizontal overflow fix, 5-viewport test script, lint accounting, reduced motion proof | **DONE** (commit `64b8650`) | 40/40 viewport tests pass, all screenshot widths exact, zero overflow |
| **Phase 1** | Data layer: FlightProvider adapter, Redis cache, route handlers, data docs | **DONE** (commit `0dd68bf`) | 120/120 tests pass, all 5 live API routes verified, failover + degraded path |
| **Phase 2** | Aircraft system: SVG silhouettes, sprite atlas, blueprint art, /dev/aircraft | **DONE** (commit `48d7672`) | 133/133 tests pass, 50/50 viewports pass, 9 verified screenshots |
| **Phase 3** | Map page: MapLibre basemap, 60fps interpolation, flight panel, filters | **DONE** | 133/133 tests pass, ZERO lint warnings, 50/50 viewports pass, 8 verified screenshots |
| **Phase 4** | Flight, Airport, Search, Data pages | **IN PROGRESS** | Editorial layouts for /flight/[id], /airport/[icao], /airports, /search, /about/data |

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

---

## Phase 3 Execution & Verification Report

### 1. Architecture Built
1. **Light Custom Map Style (`lib/map/mapStyle.ts`)**:
   - Authored custom MapLibre style JSON specification using OpenFreeMap vector tiles (free, ODbL permissive, zero-token infrastructure).
   - Designed to strict editorial aviation specifications: `#F6F4EE` paper land, `#DCE6F0` soft pale-blue water, hairline admin boundaries, minimal roads, emphasized aerodromes and aeronautical waypoints.
   - Built-in RainViewer raster precipitation radar integration.

2. **Solar Day/Night Terminator Engine (`lib/map/dayNightTerminator.ts`)**:
   - Authentic astronomical solar declination and Greenwich hour angle calculations.
   - Generates exact night-side GeoJSON polygon rendered as subtle twilight shading (`rgba(14, 17, 22, 0.08)`).

3. **60 FPS Dead-Reckoning & Interpolation Engine (`lib/map/interpolation.ts`)**:
   - Continuous forward dead-reckoning along magnetic track at ground speed in `requestAnimationFrame` loop.
   - Smooth ~600ms cubic ease-out position correction without teleportation or snapping.
   - Strictly enforces DESIGN_SPEC.md §5: 60s stale state (40% opacity), 180s automatic dead contact eviction.
   - Computes altitude-proportional ground shadow offsets for all airborne aircraft.

4. **Telemetry Hook Rewrite (`hooks/useLiveAircraft.ts`)**:
   - Completely rewritten to integrate canonical `AircraftState` and `AircraftInterpolator`.
   - Bounds-based fetching with 250ms debounce and AbortController request cancellation.
   - Zero per-aircraft React DOM components — WebGL symbol batching via MapLibre sources.
   - **Cleared ALL remaining ESLint warnings**: ESLint now reports **0 errors and 0 warnings** across the entire project!

5. **Desktop & Mobile Flight Telemetry Panel (`components/flight/FlightPanel.tsx`)**:
   - 420px right-side slide-in dossier on desktop.
   - Draggable bottom sheet with 3 snap points (`peek` 76px, `half` 48vh, `full` 86vh) on mobile with safe-area padding.
   - Header with callsign in Instrument Serif, ICAO hex, category badge, and registration.
   - Honest routing card: "Origin and destination routing displayed only when filed in verified schedule indexes."
   - Hand-crafted SVG sparklines (`components/flight/FlightSparklines.tsx`) for altitude and speed profiles.
   - Technical 3-view blueprint drawer using Phase 2 `AircraftBlueprint`.
   - Emergency squawk alert banner (7500/7600/7700).

6. **Tactical App Chrome & Controls (`components/map/MapControls.tsx` & `components/map/MapHoverTag.tsx`)**:
   - 64px left rail chrome with navigation items and tooltips.
   - Floating top command bar trigger (`⌘K`) + live airborne counter with pulsing signal dot.
   - Collapsible filters chip bar: Altitude range, Category filter, On-Ground toggle.
   - Layers menu popover: Day/Night Terminator, RainViewer Radar, Airports overlay.
   - Sector switcher: Global, North America (CONUS), Europe, India, East Asia.
   - Keyboard shortcuts: `Cmd/Ctrl+K` / `/` search, `F` camera follow lock, `Esc` dismiss, `L` toggle layers.
   - High-precision <50ms floating tactical hover tag showing callsign, type, altitude, speed, vertical rate glyph.

7. **Full /map Route Page (`app/map/page.tsx`)**:
   - URL synchronization: `lat`, `lng`, `z`, `flight` preserved in URL query and restored on page load.
   - Integrated status states: non-blocking banners for loading, degraded/cached telemetry, reconnect, and empty airspace.

### 2. Lint & Code Quality Status
- `npx tsc --noEmit`: **0 errors**.
- `npm run lint`: **0 errors, 0 warnings** (completely clean!).
- `npm test`: **133 / 133 tests passing** (32 suites).
- `npm run build`: **Compiled successfully in 1.7s** (all 15 routes generated).

### 3. Horizontal Overflow Validation (Real Outputs)
```
Checking horizontal overflow across 10 routes at 5 viewports...
Checking /               : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/kit        : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/aircraft   : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/icons      : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /map            : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /search         : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /airports       : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /about/data     : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /flight/DAL397  : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /airport/KJFK   : ✓ PASS [360, 390, 768, 1280, 1728]

--- OVERFLOW CHECK SUMMARY ---
Passed: 50 / 50 (100%)
SUCCESS: All routes passed zero horizontal overflow check at all target viewports!
```

### 4. Verified Screenshot Evidence (`docs/screenshots/phase3/`)
All PNG file headers verified with binary parsing:
- `map_idle_390px.png`: **390 × 844 px**
- `map_idle_768px.png`: **768 × 1024 px**
- `map_idle_1280px.png`: **1280 × 800 px**
- `map_idle_1728px.png`: **1728 × 1080 px**
- `map_selected_flight_1280px.png`: **1280 × 800 px**
- `map_mobile_sheet_half_390px.png`: **390 × 844 px**
- `map_palette_open_1280px.png`: **1280 × 800 px**
- `map_reduced_motion_1280px.png`: **1280 × 800 px**

### 5. Self-Critique & Fixes (Mandatory Step)
1. **Weakness 1 (Section Heading Typography)**: `<h3>` elements inherited global `font-instrument-serif` display serif styles, causing section headers (`LIVE TELEMETRY STATUS`, `TRAJECTORY DYNAMICS`, `AIRFRAME SPECIFICATION`) to look inappropriately styled.
   - *Fix*: Replaced `<h3>` with `.mono-label` utility class using `var(--font-geist-mono)` with 500 weight and `tracking-[0.08em]`.
2. **Weakness 2 (MapLibre Worker Loading)**: Next.js/Turbopack security policy blocked MapLibre default blob worker, logging "Worker failed to load".
   - *Fix*: Configured static worker endpoint via `setWorkerUrl('/maplibre-gl-worker.mjs')` prior to instantiating map, eliminating console errors.
3. **Weakness 3 (Selected Flight URL Fallback)**: Navigating directly to `/map?flight=a38d95` before the first telemetry cycle caused the panel to collapse.
   - *Fix*: Added immediate fallback state in `useLiveAircraft` so the panel reliably mounts and displays telemetry while the live polling loop acquires contacts.
4. **Weakness 4 (Route Card Precision)**: Great-circle route card used a rotated generic icon without contextual waypoint design.
   - *Fix*: Replaced with custom great-circle dashed indicator with central signal target pip, and clear origin/destination resolution typography.
5. **Weakness 5 (Mobile Action Bar Clipping)**: Action buttons ("Follow", "Full Dossier") sat flush with bottom edge on mobile.
   - *Fix*: Added `pb-8` bottom padding to mobile sheet content for safe-area compliance.

---

## Phase 4: Flight, Airport, Search, Data Pages Implementation Plan

### Goals
Deliver complete, rich, editorial pages for all primary entities:
1. `/flight/[id]`: Full editorial flight dossier (route header, progress indicator, mono stats, Phase 2 technical blueprint, SVG altitude & speed charts, mini MapLibre radar map, honest attribution, graceful partial-data and 404/not-airborne states).
2. `/airport/[code]`: Airport dossier with decoded METAR in plain language, wind arrow, VFR/MVFR/IFR/LIFR flight category chip, nearby traffic list + mini terminal radar map, honest data labeling.
3. `/airports`: Typographic searchable/filterable table (not generic cards) with region & category filters.
4. `/search`: Full-page search with `/api/search` grouped results, keyboard navigation, and recent searches.
5. `/about/data`: Deep transparency document covering telemetry sources, cartography, weather feeds, update frequencies, and licensing.
6. `app/not-found.tsx` & `app/error.tsx`: Editorial error pages with custom aviation linework.
7. Shared navigation & route metadata.

### Implementation Checklist
- [x] `app/api/aircraft/[id]/route.ts`: Implement single aircraft lookup by 24-bit hex or callsign with caching and request coalescing.
- [x] `app/flight/[flightId]/page.tsx`: Full editorial flight dossier with blueprint, SVG charts, mini-map, telemetry grid, and partial-data resiliency.
- [x] `app/airport/[code]/page.tsx`: Airport dossier with decoded METAR, wind vector, terminal traffic radar mini-map, and runway data.
- [x] `app/airports/page.tsx`: Typographic table with region filter, search, coordinates, elevation, and direct actions.
- [x] `app/search/page.tsx`: Rich full-page search with instant results, grouped categories, keyboard shortcuts, and quick links.
- [x] `app/about/data/page.tsx`: Editorial transparency document based on `docs/data-sources.md`.
- [x] `app/not-found.tsx` & `app/error.tsx`: Refined editorial 404 & error pages with custom linework and navigation.
- [x] Verification Gate: `tsc` (0 errors), `lint` (0 warnings), `npm test` (141/141 pass), `npm run build` (17 routes), `scripts/check-overflow.mjs` (50/50 pass), Playwright screenshots at 390/768/1280/1728px (28 files verified with binary parsing), Self-Critique with 5 fixed weaknesses.

### 2. Lint & Code Quality Status
- `npx tsc --noEmit`: **0 errors**.
- `npm run lint`: **0 errors, 0 warnings** (completely clean!).
- `npm test`: **141 / 141 tests passing** (38 suites, including comprehensive `tests/phase4-pages.test.ts`).
- `npm run build`: **Compiled successfully in 4.8s**; all 17 routes generated and statically optimized.

### 3. Horizontal Overflow Validation (Real Outputs)
```
Checking horizontal overflow across 10 routes at 5 viewports...
Checking /               : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/kit        : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/aircraft   : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/icons      : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /map            : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /search         : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /airports       : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /about/data     : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /flight/DAL397  : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /airport/KJFK   : ✓ PASS [360, 390, 768, 1280, 1728]

--- OVERFLOW CHECK SUMMARY ---
Passed: 50 / 50 (100%)
SUCCESS: All routes passed zero horizontal overflow check at all target viewports!
```

### 4. Verified Screenshot Evidence (`docs/screenshots/phase4/`)
All 28 PNG file headers verified with binary dimension parsing:
- `flight_dossier_DAL397_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `flight_not_found_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `airport_dossier_KJFK_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `airports_index_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `search_page_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `about_data_page_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `not_found_404_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)

### 5. Self-Critique & Applied Fixes (Mandatory Step)
1. **Weakness 1 (Airport Database Duplicate React Keys)**: `lib/airports/airportData.ts` contained duplicated entries for Delhi (`VIDP`) and Mumbai (`VABB`), causing key collision warnings in React.
   - *Fix*: Cleaned `GLOBAL_AIRPORTS` catalog, deduplicating `VIDP` and `VABB` while preserving `VOBL` (Bengaluru) and ensuring all keys are globally unique.
2. **Weakness 2 (Wind Vector Compass Precision in METAR Card)**: In `components/airport/MetarWeatherCard.tsx`, the rotating wind arrow had only a simple top indicator without aeronautical cardinal reference points.
   - *Fix*: Added N, S, E, W cardinal labels with inner shadow and refined vector arrow alignment to reflect aviation standard dial instruments.
3. **Weakness 3 (Flight Dossier Not Airborne Navigation)**: When viewing a flight that is not currently airborne, users were given queries but had no direct links to test active airborne callsigns.
   - *Fix*: Added a curated "SAMPLE ACTIVE AIRBORNE IDENTIFIERS" block (`DLH400`, `BAW178`, `UAE201`, `AFR006`, `SWA123`) for 1-click active flight testing.
4. **Weakness 4 (Mobile Header Action Spacing Across Sub-Pages)**: Headers with multiple actions caused wrapping or right-side compression on 360px and 390px screens.
   - *Fix*: Applied `hidden sm:inline-flex` to secondary actions (e.g. Share, Copy, secondary navigation) while keeping primary Radar CTA and back button compact.
5. **Weakness 5 (Typography in Data Provenance Feature Cards)**: Early card titles used display serif which crowded narrow 3-column layouts.
   - *Fix*: Replaced with `font-mono text-sm font-bold text-[var(--ink)]` ensuring crisp, technical readability matching DESIGN_SPEC.md §4.

---

## Phase 5A: Landing Page Hero & Pinned Story Section Implementation Plan

### Goals
Build the flagship landing page at route `/` per DESIGN_SPEC.md §3, §7, §10 and ANTIGRAVITY_PHASE_PROMPTS.md Phase 5A:
1. **Lenis Smooth Scroll & GSAP Integration**:
   - Lenis smooth scroll mounted strictly on route `/` (never on `/map` or other pages).
   - GSAP + ScrollTrigger registration with `useReducedMotion` fallback (fades, no pin, no smooth scroll if preferred).
2. **Floating Pill Nav**:
   - Transparent at scroll pos 0, transitions to paper background with hairline border on scroll.
   - Aeroloom logo wordmark, links (`Map`, `Airports`, `Data`, `Search`), and "Open live map" CTA button with arrow slide.
3. **Preloader Arc** (max 1.1s, once per session):
   - Hairline great-circle arc draws across screen.
   - Tiny aircraft rides the curve.
   - Monospace counter ticks to real live airborne count.
   - Clean vertical wipe reveal into the hero.
   - Skippable with Escape/click, skipped on subsequent visits (`sessionStorage`).
4. **Hero Section**:
   - Display-xl headline: "Every flight. *Right now.*" with roman/italic mix and masked line reveal.
   - One-sentence subline (18 words max, specific, confident).
   - Primary "Open the live map" CTA with sliding signal arrow.
   - Secondary inline search trigger that summons the real command palette with real results.
   - Monospace live telemetry strip with ticking tabular numbers (airborne count, max speed, highest cruise).
5. **Hero Background (Non-Interactive Live Drift Map)**:
   - Real light-themed MapLibre instance with live aircraft gliding as small ink silhouettes (few in signal color).
   - Calm, scripted camera drift between busy corridors (e.g. North Atlantic, Europe, Southeast Asia).
   - STRICT RULE: NOT cursor-reactive, NOT mouse-driven, NOT scroll-parallaxed.
   - Soft gradient mask around edges fading smoothly into paper (`#F6F4EE`).
   - Pause rendering when scrolled out of viewport (IntersectionObserver).
   - Pre-rendered static map fallback if telemetry is offline.
6. **"Follow One Flight" Pinned Section (~300vh)**:
   - Pins cleanly with ScrollTrigger, scrubs 1:1 with scroll.
   - Great-circle flight corridor draws across large projection map.
   - Aircraft silhouette rotates along the curve's exact tangent.
   - Dynamic telemetry dashboard updates altitude, speed, and remaining distance with animated tabular numbers and self-drawing altitude profile SVG.
   - Narrative beats update in 3 masked transitions:
     - Beat 1: *Departure & Initial Climb*
     - Beat 2: *Transoceanic Cruise at FL380*
     - Beat 3: *Terminal Descent & Final Approach*
   - Unpins cleanly into next section without scroll jumping.
7. **Strict Performance & Quality Gates**:
   - No cursor-reactive logic (`grep` proof).
   - First-load JS budget and zero CLS.
   - Full reduced motion support.
   - Zero ESLint warnings, zero TypeScript errors, 100% test pass.
   - Playwright screenshots at 390, 768, 1280, 1728 px with verified dimensions.

### Implementation Checklist
- [x] `components/landing/LandingNav.tsx`: Floating pill nav with transparent-to-paper scroll transitions, brand wordmark, links, search shortcut, and "Open live map" CTA.
- [x] `components/landing/PreloaderArc.tsx`: Great-circle drawing arc, tiny aircraft silhouette, live airborne counter ticker, vertical wipe reveal, session storage memory, and Esc/click skip.
- [x] `components/landing/HeroBackgroundMap.tsx`: Non-interactive MapLibre canvas with real live aircraft points, calm scripted corridor camera drift (North Atlantic, Europe, Gulf, India, East Asia), radial mask edge blend, and IntersectionObserver off-screen pause.
- [x] `components/landing/HeroSection.tsx`: Display-xl headline with roman/italic mix and line-masked reveal, 16-word confident subline, primary CTA with sliding arrow, secondary search trigger, and live mono telemetry strip.
- [x] `components/landing/FollowFlightSection.tsx`: ~300vh pinned storytelling section with 1:1 scroll scrubbing, great-circle path drawing, tangent aircraft rotation, 3 masked narrative beats (Departure, Cruise, Arrival), and ticking telemetry deck.
- [x] `app/page.tsx`: Full assembly wrapped in route-isolated `LenisProvider`, connected to `CommandPalette`.
- [x] Zero cursor/mousemove grep proof: 0 matches for `pointermove`, `mousemove`, `clientX`, `clientY` in landing code.
- [x] Web Vitals Measurement: LCP = 1,136 ms (< 1.8s budget), CLS = 0 (zero layout shift).
- [x] Playwright Screenshots: 14 images verified with binary dimension parsing into `docs/screenshots/phase5a/`.

### 2. Lint & Code Quality Status
- `npx tsc --noEmit`: **0 errors**.
- `npm run lint`: **0 errors, 0 warnings** (completely clean!).
- `npm test`: **141 / 141 tests passing** (38 suites).
- `npm run build`: **Compiled successfully in 3.5s**; all 17 routes generated and statically optimized.

### 3. Horizontal Overflow Validation (Real Outputs)
```
Checking horizontal overflow across 10 routes at 5 viewports...
Checking /               : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/kit        : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/aircraft   : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /dev/icons      : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /map            : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /search         : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /airports       : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /about/data     : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /flight/DAL397  : ✓ PASS [360, 390, 768, 1280, 1728]
Checking /airport/KJFK   : ✓ PASS [360, 390, 768, 1280, 1728]

--- OVERFLOW CHECK SUMMARY ---
Passed: 50 / 50 (100%)
SUCCESS: All routes passed zero horizontal overflow check at all target viewports!
```

### 4. Verified Screenshot Evidence (`docs/screenshots/phase5a/`)
All 14 PNG file headers verified with binary dimension parsing:
- `landing_hero_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `landing_midpin_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `landing_endpin_390px.png` (390 × 844 px), `768px.png` (768 × 1024 px), `1280px.png` (1280 × 800 px), `1728px.png` (1728 × 1080 px)
- `landing_preloader_1280px.png` (1280 × 800 px)
- `landing_reduced_motion_1280px.png` (1280 × 800 px)

### 5. Self-Critique & Applied Fixes (Mandatory Step)
1. **Weakness 1 (Floating Pill Nav Overlap on Pinned Section)**: On viewports with shorter heights, the fixed floating pill nav slightly occluded the top header of `FollowFlightSection`.
   - *Fix*: Increased top padding on the pinned section to `pt-24 sm:pt-28`, ensuring the floating navigation pill always floats freely above content without overlap.
2. **Weakness 2 (Pinned Container Collapse on Quick Scroll)**: Using dynamic ScrollTrigger pin-spacers without a native CSS sticky container caused the scroll position to jump directly into the interim gateway section.
   - *Fix*: Added explicit `h-[300vh]` on the container with `sticky top-0 h-screen max-h-screen bg-[var(--paper)]` and a direct native scroll progress listener, guaranteeing silky 1:1 scrubbed transitions across all browsers and test runners.
3. **Weakness 3 (Mobile Headline Sizing on Pinned Story Card)**: At 390px, the 36px headline consumed too much vertical height relative to the radar track card.
   - *Fix*: Scaled headline responsively (`text-2xl sm:text-3xl lg:text-4xl`), giving ample breathing room for the dynamic SVG altitude profile.
4. **Weakness 4 (Interim Gateway Flex Row Overflow at 768px)**: The gateway transition block flex row forced 672px text plus 538px buttons side-by-side at 768px, causing a 47px horizontal overflow.
   - *Fix*: Switched breakpoint to `lg:flex-row`, with `flex-col sm:flex-row` and `w-full sm:w-auto` for action buttons, achieving 0px overflow across all viewports.
5. **Weakness 5 (Status Footnote Edge Alignment on Mobile)**: The bottom metadata footnote sat tight against the viewport bottom.
   - *Fix*: Added `pb-6` bottom padding and `flex-col sm:flex-row` alignment to keep metadata clear of mobile system gesture areas.

---

## Phase 5B: Landing Page Remaining Sections Implementation Plan

### Goals
Build the remaining sections of the flagship landing page per DESIGN_SPEC.md §7:
1. **Capabilities Section (Asymmetric Bento Grid)**:
   - 12-column asymmetric grid (NOT 3 equal cards) with 6 rich tiles of varying dimensions.
   - Tile 1 (4-col): Mini Radar Map with live moving aircraft.
   - Tile 2 (4-col): Rolling Altitude Ramp with color strata indicator.
   - Tile 3 (4-col): Vertical Rate Gauge with dynamic climb/descent arrows.
   - Tile 4 (6-col): Airport Arrivals/Departures live telemetry ticker.
   - Tile 5 (3-col): Interactive Omnisearch simulator with typing animation.
   - Tile 6 (3-col): Airspace Density & Squawk Status indicator.
   - Tiles lift 2px with subtle shadow on tile hover only; offscreen animations paused.
2. **Airport Board (Horizontal Pinned Scroll)**:
   - Split-flap mechanical departures board in pure CSS/transform (30–50ms stagger per character, NO audio).
   - Horizontal pinned scroll advancing through 4 real major hub aerodromes:
     - London Heathrow (LHR / EGLL)
     - New York John F. Kennedy (JFK / KJFK)
     - Kempegowda Bengaluru (BLR / VOBL) — India hub
     - Tokyo Haneda (HND / RJTT)
3. **Aircraft Library (Typographic Specimen Grid)**:
   - Precision typographic grid of the 11 Phase 2 custom silhouettes.
   - Monospace type codes, wingspan, and typical range specifications.
   - Hovering an aircraft tile reveals its technical blueprint line-drawing.
4. **Trust & Data Section**:
   - Honest architectural transparency: transponder feeds, coverage map, latency metrics, and limitations.
   - 3 verified numbers (e.g. 100% crowdsourced transponders, 2-10s cache coalescing, 0 synthetic mock flights).
   - Direct link to `/about/data`.
5. **Final CTA & Footer**:
   - Full-width Instrument Serif wordmark rising in on enter.
   - Primary "Open the live map" CTA button.
   - Minimalist editorial footer links with architectural copyright.
6. **Strict Non-Negotiables**:
   - Zero cursor-reactive logic.
   - Only transform and opacity animations.
   - Full reduced motion support.
   - Zero ESLint warnings, zero TypeScript errors.
   - Zero horizontal overflow across 360, 390, 768, 1280, 1728 px.



