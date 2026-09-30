# Aeroloom Redesign — Phase Progress & Audit Log

## Progress Overview

| Phase | Description | Status | Verification & Gates |
|---|---|---|---|
| **Phase 0** | Audit & Foundations, tokens, primitives, /dev/kit | **DONE** (commit `6d73256`) | Design tokens, typography, motion tokens, Radix base components |
| **Phase 0.5** | Altitude strip, Input micro-label, lint cleanup, initial screenshots | **DONE** (commit `a78e0d7`) | Persist adapter unused params, focus rings |
| **Phase 0.6** | Horizontal overflow fix, 5-viewport test script, lint accounting, reduced motion proof | **DONE** (commit `64b8650`) | 40/40 viewport tests pass, all screenshot widths exact, zero overflow |
| **Phase 1** | Data layer: FlightProvider adapter, Redis cache, route handlers, data docs | **DONE** (commit pending) | 120/120 tests pass, all 5 live API routes verified, failover + degraded path |
| **Phase 2** | Aircraft system: SVG silhouettes, sprite atlas, blueprint art, /dev/aircraft | **IN PROGRESS** | Top-down silhouettes, ICAO type mapping, sprite atlas |

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

## Phase 2: Aircraft System Implementation Plan

### Goals
Author the custom aviation visual identity: handcrafted top-down SVG silhouettes, type code mapping, MapLibre sprite atlas (1x, 2x, 3x DPR) across all states, technical blueprint line drawings with animated stroke-dashoffset, and custom aviation UI icons. Expose on `/dev/aircraft` and `/dev/icons`.

### Implementation Checklist
1. **Top-Down SVG Silhouettes (`lib/map/silhouettes/`)**:
   - 11 distinct proportional categories on a 64×64 grid:
     1. Narrowbody (A320 / B737 family)
     2. Widebody Twin (B787 / A350 / B777)
     3. Quad (A380 / B747)
     4. Regional Jet (E175 / CRJ900)
     5. Turboprop (ATR 72 / Dash 8 Q400)
     6. Business Jet (Global 7500 / Citation X)
     7. Light GA (Cessna 172 Skyhawk)
     8. Helicopter (H145 / S-76 with rotor disc)
     9. Cargo Freighter (747F / 777F with cargo deck)
     10. Military / Other (neutral angular dart)
     11. Unknown (clean geometric chevron)
   - Variants per silhouette: `default` (ink), `selected` (signal color with 2px white outline), `hover` (scale 1.15), `stale` (40% opacity), `on-ground` (smaller, ink-3), and `ground-shadow` (12% ink soft shadow offset).

2. **ICAO Type Code Mapping (`lib/map/typeMapping.ts`)**:
   - Table covering 150+ common airliner, regional, bizjet, GA, and helicopter codes.
   - Comprehensive fallbacks via `lib/metadata/aircraftCatalog.ts`.
   - Unit tests covering direct mapping, category fallbacks, and unknown codes.

3. **MapLibre Sprite Atlas Generator (`lib/map/spriteAtlas.ts`)**:
   - Generates sprite PNGs and JSON metadata index at 1x, 2x, and 3x DPR for all categories and states.
   - Replaces old `lib/map/aircraftIcon.ts` entirely.
   - Zero dark-theme colors.

4. **Technical Blueprint Illustrations (`components/aircraft/AircraftBlueprint.tsx`)**:
   - Technical 3-view line drawings (top, side, front view) with hairline ink strokes.
   - Monospaced dimension callouts (wingspan, length, height) labeled as typical for the category.
   - Animated SVG stroke-dashoffset reveal that switches to instant/calm fades under `prefers-reduced-motion`.

5. **Custom Aviation Icons (`components/ui/Icon.tsx`)**:
   - Hand-draw custom icons in 24px grid / 1.5px stroke: takeoff, landing, runway, tower, altitude, vertical-rate up/down, heading/compass, squawk, gate, delay, route-arc, layers, filter.
   - Integrated into typed `IconName` union.

6. **Dev Specimen Pages**:
   - `/dev/aircraft`: Specimen grid showing all silhouettes in all states at 24, 32, 48, 96 px on paper and white, type lookup tester, and technical blueprints.
   - `/dev/icons`: Complete icon library specimen with search and size toggles.

7. **Verification Gate**:
   - `tsc`, `lint`, `npm test`, `npm run build`, `check-overflow.mjs`, Playwright screenshots at 4 viewports for `/dev/aircraft` and `/dev/icons`, self-critique.
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
