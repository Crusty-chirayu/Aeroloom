# Aeroloom — Sprint 1 Execution Report
**Milestone**: Sprint 1 — Map Canvas & Vector Basemap Engine  
**Branch**: `feat/sprint-1-tactical-map`  
**Design Direction**: AeroCraft / Precision Telemetry (Direction A + C "Tactical Studio")  
**Date**: 2026-09-28  

---

## 1. Executive Summary

In accordance with the approved **AeroCraft / Precision Telemetry (Direction A + C)** design direction, Sprint 1 replaces the rejected 3D wave/terrain aesthetic with a high-performance, full-viewport WebGL vector map engine powered by **MapLibre GL**.

All historical Phase 0 terrain shaders and provider code remain safely preserved in the repository (`components/hero/`, `lib/providers/positions/`), while the active user interface (`app/page.tsx`, `components/deck/`, `components/map/`) has been completely transitioned to the Tactical Studio architecture.

---

## 2. Basemap Providers, Tile Availability & Licensing Audit

Before implementation, tile endpoints, availability, licensing, and attribution requirements were rigorously verified:

| Provider | Endpoint | Verification Status | Licensing & Usage Terms | Attribution Displayed |
| :--- | :--- | :--- | :--- | :--- |
| **CARTO Dark Matter (Primary)** | `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` | **HTTP 200 OK** | Free for non-commercial & data visualization with mandatory attribution. Zero API keys or credit cards required. | `© CARTO, © OpenStreetMap contributors` |
| **OpenFreeMap Dark (Fallback)** | `https://tiles.openfreemap.org/styles/dark` | **HTTP 200 OK** | Open-source community tile service (ODbL / CC-BY). Hosted freely with no rate limits or API keys. | `© OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors` |

### Airspace Sectors Configured
Predefined high-density tactical airspace sectors with real WGS84 geographic center coordinates, zoom, pitch, and bearing:
1. **New York Tracon (`ny-metro`)**: `[-73.95, 40.75]`, Zoom: 9.5 (JFK / EWR / LGA)
2. **SoCal Tracon (`socal`)**: `[-118.35, 33.95]`, Zoom: 9.2 (LAX / SAN / BUR)
3. **Chicago Center (`midwest`)**: `[-87.75, 41.90]`, Zoom: 9.0 (ORD / MDW)
4. **London TMA (`lon-metro`)**: `[-0.25, 51.50]`, Zoom: 9.2 (LHR / LGW / STN)
5. **Continental US (`conus`)**: `[-98.58, 39.83]`, Zoom: 4.2 (CONUS Transcontinental)

---

## 3. Implemented Components & Architecture

### 3.1 `lib/map/config.ts`
- Defines `BASEMAP_PROVIDERS`, `AVIATION_SECTORS`, and `MAP_DEFAULTS`.
- Centralizes zoom constraints (min: 2, max: 18), drag-rotate, pitch limits (max 60°), and sector metadata.

### 3.2 `components/map/FlightMap.tsx`
- Full-viewport MapLibre GL WebGL canvas container (`#aeroloom-flight-map`).
- **Resize Handling**: Implements `ResizeObserver` observing the canvas container to automatically call `map.resize()` on viewport changes or panel toggles.
- **Controls Integrated**:
  - `NavigationControl`: Zoom in/out, pitch visualization, North-up compass reset.
  - `ScaleControl`: Nautical miles display (`unit: 'nautical'`).
  - `FullscreenControl`: Browser-native full-screen toggle.
- **Tactical Overlays**:
  - Bottom-left telemetry HUD displaying real-time latitude/longitude coordinates (`40.7500°N, 73.9500°W`), zoom factor (`9.5x`), pitch, and heading.
  - Top-right basemap switcher toggle (`CARTO Dark Matter` <-> `OpenFreeMap Dark`).
  - Compliant legal attribution badge in bottom-right corner.
- **State Management**:
  - `isLoading`: Tactical overlay while basemap style initializes.
  - `mapError`: Graceful error container with "Retry Canvas" and "Switch to Fallback Basemap" buttons upon WebGL context disruption.
  - `children(map)` render prop: Modular slot ready for Sprint 2 live aircraft vector markers.

### 3.3 `components/deck/Header.tsx`
- Sleek aviation command top bar styled in Deep Carbon (`#080b11`) and Slate Deck (`#0f141f`) with hairline borders (`#1f293d`).
- Interactive Airspace Sector dropdown selector with quick-flyTo transitions.
- Live UTC clock updating every second (`HH:MM:SS UTC`).
- Real-time ADS-B connection status indicator with pulsing beacon (`ADS-B LIVE`).
- Responsive callsign search input (top bar on desktop, secondary drawer bar on mobile).

### 3.4 `app/globals.css`
- Imported `maplibre-gl/dist/maplibre-gl.css`.
- Overrode MapLibre default controls with high-contrast tactical styling: dark backgrounds (`rgba(15, 20, 31, 0.9)`), hairline borders (`#1f293d`), Aero Cyan hover states, and inverted icons.

### 3.5 Web Worker Configuration (`public/`)
- Deployed `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` to `public/` and configured via `setWorkerUrl('/maplibre-gl-worker.mjs')` to eliminate Turbopack blob worker loading restrictions.

---

## 4. Verification Results

### 4.1 Unit Test Suite (`npm test`)
All 22 automated test suites passed with 0 failures:
```
▶ lib/providers/positions/airplanesLive normalization tests (6 tests passed)
▶ lib/deviceTier evaluation tests (6 tests passed)
▶ MapLibre configuration & sector validation (5 tests passed)
  ✔ basemap providers have valid HTTPS style URLs and licensing attribution
  ✔ default basemap provider is CARTO Dark Matter with OpenStreetMap attribution
  ✔ fallback basemap provider is OpenFreeMap Dark
  ✔ all aviation sectors have valid WGS84 coordinates and zoom levels
  ✔ MAP_DEFAULTS defines standard constraints
▶ components/hero/LiveAircraftPing projection tests (5 tests passed)
ℹ tests 22 | pass 22 | fail 0 | cancelled 0 | duration_ms 502.8ms
```

### 4.2 TypeScript Type Check (`npx tsc --noEmit`)
- Result: **0 errors**. Strict typing verified across all map configurations, sector interfaces, and MapLibre event handlers.

### 4.3 Production Build (`npm run build`)
- Result: **Compiled successfully**.
- Server and client chunks optimized via Turbopack.
- Routes generated:
  - `○ /` (Static prerendered tactical page)
  - `ƒ /api/aircraft/live` (Dynamic live ADS-B provider endpoint)

### 4.4 Browser Verification Artifacts
Headless Chrome verification script (`scripts/capture-visuals.mjs`) verified:
- **Desktop (1440x900)**: Full dark vector basemap rendered with NYC coastline, waterways, telemetry HUD, and tactical controls.
- **Sector Switch**: Programmatically selected SoCal Tracon; camera flew to LAX/SAN coordinates (`33.9500°N, 118.3500°W`), and HUD updated seamlessly.
- **Basemap Toggle**: Switched between CARTO Dark Matter and OpenFreeMap Dark without WebGL error.
- **Mobile Viewport (390x844)**: Responsive header adapted, mobile search bar appeared, and vector map filled 100% of the mobile screen.

Screenshots captured to artifact storage:
- `aerocraft_desktop_map.png` (534 KB)
- `aerocraft_socal_map.png` (85 KB)
- `aerocraft_openfreemap_map.png` (36 KB)
- `aerocraft_mobile_map.png` (407 KB)

---

## 5. Files Changed & Staged
- `package.json` / `package-lock.json`: Added `maplibre-gl`.
- `lib/map/config.ts`: MapLibre basemap providers, sectors, and defaults.
- `components/map/FlightMap.tsx`: Full-viewport map component.
- `components/deck/Header.tsx`: Tactical command header.
- `app/page.tsx`: Replaced wave/terrain with Tactical Studio deck.
- `app/globals.css`: Dark tactical map control styling and tokens.
- `public/maplibre-gl-worker.mjs` & `public/maplibre-gl-shared.mjs`: Static worker chunks.
- `tests/mapConfig.test.ts`: Automated tests for providers, sectors, and constraints.
- `scripts/capture-visuals.mjs`: Automated browser verification suite.
- `docs/SPRINT_1_REPORT.md`: Comprehensive Sprint 1 verification document.
