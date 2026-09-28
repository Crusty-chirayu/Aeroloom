# Aeroloom — End-of-Day Handover & Continuation Guide
**Date**: September 28, 2026  
**Current Milestone**: Sprint 2 Complete (AeroCraft Live Vector Markers & Flight Selection)  
**Branch**: `feat/sprint-1-tactical-map`  
**Latest Verified Commit**: `96b5021` (`feat(aircraft): implement live ADS-B vector markers, heading rotation, flight selection dossier, and follow-mode (Sprint 2)`)  
**Design Direction**: **AeroCraft / Precision Telemetry (Direction A + C "Tactical Studio")** — Fully Approved & Enforced  

---

## 1. Project State & GitHub Synchronization

- **Local Working Tree**: Clean, 0 uncommitted changes.
- **Git Branch**: `feat/sprint-1-tactical-map` (dedicated feature branch, tracking `origin/feat/sprint-1-tactical-map`).
- **Remote Synchronization**: Fully pushed and up to date with remote `origin`.
- **Commit History**:
  1. `96b5021` — `feat(aircraft): implement live ADS-B vector markers, heading rotation, flight selection dossier, and follow-mode (Sprint 2)`
  2. `ca0f222` — `feat(map): implement MapLibre GL vector canvas, tactical deck header, and dark basemap engine (Sprint 1)`
  3. `f41b319` — `docs(design): establish AeroCraft Tactical Studio design system and UI/UX exploration`
  4. `c535b99` — `feat(aircraft): implement live ADS-B provider adapter, route cache, 3D beacon ping, and tests (Tasks 0.5-0.6)`
  5. `976bb3a` — `feat(terrain): implement R3F dotted terrain with GLSL cursor displacement, device tiers, and fallbacks (Tasks 0.2-0.4)`
- **Running Processes**: All dev servers (`next dev`), headless browser sessions, and background tasks are safely stopped.

---

## 2. Completed Deliverables

### Sprint 1 Deliverables (Map Canvas & Vector Basemap Engine)
- **MapLibre GL Vector Engine**: Integrated zero-key dark vector basemap with MapLibre GL 6.11.2.
- **Dual Basemap Providers**:
  - Primary: CARTO Dark Matter (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) with compliant attribution (`© CARTO, © OpenStreetMap contributors`).
  - Fallback: OpenFreeMap Dark (`https://tiles.openfreemap.org/styles/dark`) with OpenMapTiles / OSM attribution.
- **Airspace Sector Presets**: New York Tracon (`ny-metro`), SoCal Tracon (`socal`), Chicago Center (`midwest`), London TMA (`lon-metro`), Continental US (`conus`).
- **Tactical Controls HUD**: Bottom-left real-time coordinate monitor, zoom/pitch/heading readout, nautical scale control, compass reset, and top-right basemap switcher.
- **AeroCraft Command Header**: Clean aviation top bar with sector dropdown, callsign search input, pulsing ADS-B stream beacon, and live UTC clock.
- **Retired Aesthetic**: Replaced the rejected wave/terrain 3D visualization in `app/page.tsx` while preserving historical Phase 0 files in `components/hero/`.

### Sprint 2 Deliverables (Live Vector Markers & Flight Selection)
- **GeoJSON Telemetry Transformation Pipeline** (`lib/map/aircraftGeoJson.ts`):
  - Converts normalized `AircraftPosition` records into MapLibre-compatible GeoJSON features.
  - Formats tactical flight badges: Flight Level format ($\ge 18,000$ ft $\rightarrow$ `FL350`), altitude in feet ($< 18,000$ ft $\rightarrow$ `2,400 FT`), ground status (`GND`), and knots true airspeed (`420 KTS`).
  - Transponder track normalization to $[0, 360)^\circ$.
  - Dynamic status classifications:
    - **Crimson (`#ef4444`)**: Emergency squawk codes (`7700`, `7600`, `7500`).
    - **Amber (`#f59e0b`)**: Active climb or descent ($|vrate| > 400$ FPM).
    - **Emerald (`#10b981`)**: Cruising level flight ($\ge 10,000$ ft).
    - **Aero Cyan (`#38bdf8`)**: Standard active flight / terminal approach.
- **Tactical Vector Aircraft Sprites** (`lib/map/aircraftIcon.ts`):
  - High-DPI canvas vector aircraft silhouettes pointed North-up ($0^\circ$).
  - Registered into MapLibre WebGL texture atlas.
  - Dedicated selected flight reticle sprite (`ac-icon-selected`) with tactical crosshairs.
- **Resilient Polling Hook** (`hooks/useLiveAircraft.ts`):
  - 6s polling cadence matching server route cache TTL.
  - Uses `AbortController` for clean in-flight request cancellation on sector switch.
  - Selection retention across poll cycles if the aircraft remains in radar coverage.
- **MapLibre Aircraft Layer** (`components/map/AircraftLayer.tsx`):
  - GPU-accelerated symbol layers with authentic track rotation.
  - Zoom-dependent density: unadorned markers at low zoom ($< 8$), callsigns at mid zoom ($8-9.5$), full altitude/speed callouts at high zoom ($\ge 9.5$).
  - Multi-directional collision avoidance (`text-variable-anchor`).
  - Interactive marker click detection and cursor feedback.
- **Selected Flight Target Dossier** (`components/deck/SelectedFlightDossier.tsx`):
  - Floating tactical dossier card displaying callsign, aircraft type, hex code, squawk status, altitude tape with climb/descent arrow, true ground speed, heading, and coordinates.
  - **Camera Follow-Mode Toggle**: Automatically pans and locks camera onto the target aircraft as fresh ADS-B positions stream in.
  - **Center Action**: Instant flyTo camera center.
  - Dismissible via close button or `Escape` key.
- **Multi-Sector Server Cache** (`app/api/aircraft/live/route.ts`):
  - In-memory cache keyed by `${provider}_${lat}_${lon}_${radius}` with 6s TTL, preventing query collisions when jumping between different global airspace sectors.

---

## 3. Verification & Quality Assurance Summary

| Category | Command / Tool | Result |
| :--- | :--- | :--- |
| **Unit Test Suite** | `npm test` (`node --test`) | **32/32 Passed (0 Failures)** across 5 test suites |
| **Type Checking** | `npx tsc --noEmit` | **0 Errors** (Strict TypeScript mode) |
| **Production Build** | `npm run build` (Turbopack) | **Compiled successfully in 38.2s** (Static `/` + Dynamic `/api/aircraft/live`) |
| **Browser Stream Verification** | Headless Chrome via native CDP | **270+ live aircraft** rendered simultaneously across NY Tracon with authentic headings and callsigns |
| **Flight Selection Verification** | Target click simulation via CDP | **Verified**: Target Dossier rendered with live altitude tape, speed, squawk, heading, and follow-mode |
| **Sector Navigation (`flyTo`)** | Programmatic sector change | **Verified**: Smooth camera transition to SoCal Tracon (`33.9500°N, 118.3500°W`) |
| **Basemap Switching** | Runtime toggle button | **Verified**: Seamless switch between CARTO Dark Matter and OpenFreeMap Dark |
| **Mobile Responsiveness** | Viewport 390x844 | **Verified**: 100% responsive, adapted header, functional search, uncluttered markers |

### Visual Artifacts Stored
- [`aerocraft_desktop_map.png`](file:///C:/Users/Allah/.gemini/antigravity-ide/brain/a447b709-03f7-428f-b9cb-8ff7d665f8d6/aerocraft_desktop_map.png) (534 KB): Full dark vector basemap with tactical HUD.
- [`aerocraft_sprint2_live_markers.png`](file:///C:/Users/Allah/.gemini/antigravity-ide/brain/a447b709-03f7-428f-b9cb-8ff7d665f8d6/aerocraft_sprint2_live_markers.png) (589 KB): 288 real aircraft rendered with authentic track rotation and status colors.
- [`aerocraft_sprint2_selected_dossier.png`](file:///C:/Users/Allah/.gemini/antigravity-ide/brain/a447b709-03f7-428f-b9cb-8ff7d665f8d6/aerocraft_sprint2_selected_dossier.png) (564 KB): Selected target dossier displaying live telemetry tape and follow-mode.
- [`aerocraft_sprint2_mobile.png`](file:///C:/Users/Allah/.gemini/antigravity-ide/brain/a447b709-03f7-428f-b9cb-8ff7d665f8d6/aerocraft_sprint2_mobile.png) (337 KB): Mobile viewport layout with live aircraft markers.

---

## 4. Key Files to Inspect Before Resuming

Before beginning Sprint 3, review these core files:
1. [`app/page.tsx`](file:///e:/projects/Aeroloom/app/page.tsx): Main tactical deck assembly combining Header, FlightMap, AircraftLayer, and SelectedFlightDossier.
2. [`hooks/useLiveAircraft.ts`](file:///e:/projects/Aeroloom/hooks/useLiveAircraft.ts): Telemetry stream hook providing the complete list of aircraft and selection state.
3. [`components/map/FlightMap.tsx`](file:///e:/projects/Aeroloom/components/map/FlightMap.tsx): Full-viewport MapLibre GL canvas container with camera controls and sector flyTo.
4. [`components/deck/SelectedFlightDossier.tsx`](file:///e:/projects/Aeroloom/components/deck/SelectedFlightDossier.tsx): Tactical flight inspector card.
5. [`lib/map/aircraftGeoJson.ts`](file:///e:/projects/Aeroloom/lib/map/aircraftGeoJson.ts): GeoJSON transformation, altitude formatting, and status color logic.
6. [`docs/AEROLOOM_DESIGN_SYSTEM.md`](file:///e:/projects/Aeroloom/docs/AEROLOOM_DESIGN_SYSTEM.md): Design tokens, layout hierarchy, and styling constraints.

---

## 5. Tomorrow's Sprint 3 Execution Plan

### Milestone Objective: Telemetry Drawer, Flight List & Filter Bar
Build a collapsible, high-density flight list drawer that displays all tracked aircraft in the active sector, allows instant filtering and sorting, and synchronizes seamlessly with the map canvas and Target Dossier.

### Sprint 3 Scope:
1. **Collapsible Telemetry Drawer (`components/deck/FlightDrawer.tsx`)**:
   - Slide-out / collapsible side panel positioned on the left or bottom (desktop: left 360px panel; mobile: bottom swipeable sheet).
   - Toggle button on top bar or map canvas: "FLIGHT LIST (288)" with expand/collapse chevron.
2. **Airspace Telemetry Filters**:
   - Filter pills: **ALL** (default), **AIRBORNE**, **GROUND**, and **EMERGENCY** (squawks 7700/7600).
   - Callsign / Hex search input tied directly to the drawer list.
3. **Flight Sorting Controls**:
   - Sort dropdown or table column headers:
     - Sort by **Altitude** (highest to lowest / vice versa).
     - Sort by **Speed** (fastest to slowest).
     - Sort by **Callsign** (alphabetical A-Z).
4. **List Item Architecture**:
   - Callsign, Aircraft Type, Registration, Altitude badge (e.g. `FL350` or `GND`), Ground Speed (`420 KTS`), and Status color pip (Cyan, Emerald, Amber, Crimson).
   - Hover highlight matching the map marker.
5. **Two-Way Synchronization**:
   - Clicking an aircraft in the drawer highlights it on the map, centers the camera on it, and opens the Target Dossier.
   - Selecting an aircraft on the map automatically scrolls the drawer to the selected flight item.
6. **Responsive Layout**:
   - Desktop: Side deck panel with virtualized or smooth scrollable feed.
   - Mobile: Collapsible bottom sheet that does not obscure the primary map canvas when minimized.
7. **Verification & Testing**:
   - Unit tests for flight sorting algorithms and filter predicates (`tests/flightFilters.test.ts`).
   - Browser verification on desktop and mobile.
   - Production build check and Git commit/push.

### Sprint 3 Dependencies:
- Uses existing `aircraft` array and `selectedAircraftId` from `useLiveAircraft`.
- Uses existing `mapInstanceRef` for camera center transitions.
- Zero new third-party dependencies required.

---

## 6. Exact First Action for Tomorrow

When resuming on September 29, 2026:
1. Verify working tree is clean: `git status` on `feat/sprint-1-tactical-map`.
2. Review [`docs/SESSION_HANDOVER.md`](file:///e:/projects/Aeroloom/docs/SESSION_HANDOVER.md).
3. Begin Sprint 3 by implementing the flight filter/sort utility functions and their corresponding unit tests (`tests/flightFilters.test.ts`).
