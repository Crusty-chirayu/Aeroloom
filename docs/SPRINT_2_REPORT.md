# Aeroloom — Sprint 2 Execution Report
**Milestone**: Sprint 2 — AeroCraft Live Vector Markers & Flight Selection  
**Branch**: `feat/sprint-1-tactical-map`  
**Design Direction**: AeroCraft / Precision Telemetry (Direction A + C "Tactical Studio")  
**Date**: 2026-09-28  

---

## 1. Executive Summary

Sprint 2 successfully connects the MapLibre GL vector engine to Aeroloom's live ADS-B backend, rendering hundreds of authentic aircraft as GPU-accelerated vector markers with genuine heading rotation, dynamic climb/descent/cruise status colors, collision-aware telemetry labels, flight target selection, and camera follow-mode.

All flight positions are genuine ADS-B transponder telemetry streamed via `/api/aircraft/live` (zero fabricated aircraft). The UI remains strictly true to the approved AeroCraft Tactical Studio design system (Deep Carbon `#080b11`, Slate Deck `#0f141f`, Aero Cyan `#38bdf8`, tabular monospaced numerals, and zero decorative wave/terrain artifacts).

---

## 2. Implemented Features & Architecture

### 2.1 GeoJSON Transformation & Telemetry Formatting ([`lib/map/aircraftGeoJson.ts`](file:///e:/projects/Aeroloom/lib/map/aircraftGeoJson.ts))
- **`aircraftToGeoJson(aircraftList, selectedId, searchFilter)`**:
  - Validates WGS84 coordinates (latitude [-90, 90], longitude [-180, 180]). Silently filters corrupted or NaN records.
  - Formats altitude: Flight Levels (`FL350`, `FL180`) for $\ge 18,000$ ft, comma-formatted ft (`2,400 FT`) for low altitude, and `GND` for ground status.
  - Formats speed (`420 KTS`) and vertical rate (`+1,800 FPM`, `-2,200 FPM`, `LEVEL`).
  - Normalizes transponder track to $[0, 360)^\circ$.
  - Dynamically assigns tactical status colors:
    - **Crimson (`#ef4444`)**: Emergency squawk codes (`7700`, `7600`, `7500`).
    - **Amber (`#f59e0b`)**: Active climb or descent ($|vrate| > 400$ FPM).
    - **Emerald (`#10b981`)**: Cruising level flight ($\ge 10,000$ ft).
    - **Aero Cyan (`#38bdf8`)**: Standard active flight / terminal approach.

### 2.2 Vector Aircraft Sprites ([`lib/map/aircraftIcon.ts`](file:///e:/projects/Aeroloom/lib/map/aircraftIcon.ts))
- Dynamically renders crisp, high-DPI canvas vector aircraft silhouettes pointed North-up ($0^\circ$).
- Registered directly into MapLibre GL's WebGL sprite texture atlas via `map.addImage()`.
- Includes distinct target reticle icon (`ac-icon-selected`) with tactical crosshairs for selected flights.

### 2.3 Resilient Telemetry Polling Hook ([`hooks/useLiveAircraft.ts`](file:///e:/projects/Aeroloom/hooks/useLiveAircraft.ts))
- Queries `/api/aircraft/live?lat=...&lon=...&radius=...` aligned to the active airspace sector.
- Polling cadence: 6,000ms (matching server-side cache TTL to respect upstream rate limits).
- Uses `AbortController` to cleanly terminate pending requests upon sector change or component unmount.
- **Selection Retention**: Preserves flight selection across polling cycles if the aircraft remains in coverage; marks stale if the flight leaves radar range without crashing.
- Manages `isRefreshing`, `isStale`, `error`, and `isFollowMode`.

### 2.4 MapLibre Aircraft Vector Layer ([`components/map/AircraftLayer.tsx`](file:///e:/projects/Aeroloom/components/map/AircraftLayer.tsx))
- **Symbol Layer (`aircraft-layer`)**:
  - `icon-image`: Matches aircraft status color (`ac-icon-emerald`, `ac-icon-amber`, `ac-icon-cyan`).
  - `icon-rotate`: Driven by `['get', 'heading']` for authentic heading alignment.
  - `icon-rotation-alignment`: `'map'` (markers rotate accurately with map pitch/bearing).
  - `text-field`: Stepwise zoom-density display:
    - Zoom $< 8$: Uncluttered icons only.
    - Zoom 8–9.5: Callsigns only.
    - Zoom $\ge 9.5$: Full callsign + altitude + speed callouts.
  - `text-variable-anchor`: Multi-directional automatic collision avoidance.
- **Selected Aircraft Layer (`aircraft-selected-layer`)**:
  - Renders reticle crosshairs and cyan halo around the active target.
- **Interactive Click Selection**:
  - Intercepts clicks on aircraft markers and opens the Target Dossier.
  - Exposes `pointer` cursor on marker hover.

### 2.5 Selected Flight Target Dossier ([`components/deck/SelectedFlightDossier.tsx`](file:///e:/projects/Aeroloom/components/deck/SelectedFlightDossier.tsx))
- Floating tactical dossier card in top-left deck:
  - Callsign, Registration, Aircraft Type, and Hex ICAO code.
  - Telemetry tape: Altitude with climb/descent arrow, True Ground Speed, Heading with compass icon, Squawk badge, Coordinates.
  - **Camera Follow-Mode Toggle**: Centers and tracks the aircraft as coordinates update.
  - **Center On Target Action**: Instantly flies camera to flight position.
  - Dismiss via close button or `Escape` key.

---

## 3. Verification & Quality Assurance

| Verification Check | Target / Tool | Result |
| :--- | :--- | :--- |
| **Unit Test Suite** | `node --test` ([`tests/aircraftGeoJson.test.ts`](file:///e:/projects/Aeroloom/tests/aircraftGeoJson.test.ts) + all prior suites) | **32/32 Passed (0 Failures)** |
| **Type Check** | `npx tsc --noEmit` | **0 TypeScript errors** |
| **Production Build** | `npm run build` (Turbopack) | **Compiled successfully in 38.2s** |
| **Live Stream Verification** | Headless Chrome via native CDP | **Verified**: 270+ live aircraft rendered on dark vector map with authentic headings and callsign labels. |
| **Flight Selection Verification** | Target click simulation | **Verified**: `SelectedFlightDossier` opened displaying altitude, speed, squawk, heading, and follow-mode toggle. |
| **Mobile Responsiveness** | Viewport 390x844 | **Verified**: Header, search bar, and aircraft markers remain crisp and uncluttered. |

### Visual Verification Artifacts
- **Live Vector Aircraft Markers (Desktop)**: [`aerocraft_sprint2_live_markers.png`](file:///C:/Users/Allah/.gemini/antigravity-ide/brain/a447b709-03f7-428f-b9cb-8ff7d665f8d6/aerocraft_sprint2_live_markers.png) (589 KB) — Demonstrates 288 real aircraft across NY Tracon with authentic headings and status colors.
- **Selected Flight Target Dossier**: [`aerocraft_sprint2_selected_dossier.png`](file:///C:/Users/Allah/.gemini/antigravity-ide/brain/a447b709-03f7-428f-b9cb-8ff7d665f8d6/aerocraft_sprint2_selected_dossier.png) (564 KB) — Demonstrates tactical flight inspector with live telemetry tape and follow-mode controls.
- **Mobile Viewport with Aircraft**: [`aerocraft_sprint2_mobile.png`](file:///C:/Users/Allah/.gemini/antigravity-ide/brain/a447b709-03f7-428f-b9cb-8ff7d665f8d6/aerocraft_sprint2_mobile.png) (337 KB) — Demonstrates responsive layout on 390x844 viewport.

---

## 4. Known Limitations & Edge Cases Handled

1. **Upstream Rate Limiting**: The upstream ADS-B provider allows requests every 5-10s; our in-memory cache route (`/api/aircraft/live`) enforces a 6s TTL per sector, ensuring 100% compliance with upstream policies.
2. **Missing Transponder Telemetry**: Aircraft with missing squawk, altitude, or registration are displayed gracefully with fallback placeholders (`SQ ----`, `GENERIC`) without throwing runtime errors.
3. **MapLibre Web Worker**: Static worker chunks configured via `setWorkerUrl('/maplibre-gl-worker.mjs')` prevent Next.js Turbopack worker resolution errors.

---

## 5. Next Steps — Sprint 3 Roadmap (Telemetry Drawer, Flight List & Filter Bar)

1. **Collapsible Telemetry Drawer**: Build `components/deck/FlightDrawer.tsx` displaying the complete scrollable list of tracked flights in the sector.
2. **Filters & Sorting**: Add quick filters (All, Airborne, Ground, Emergency Squawks 7700) and sorting (by altitude, speed, callsign).
3. **Flight List Click-to-Focus**: Clicking any flight in the drawer centers the map on that aircraft and opens its Target Dossier.
