# Aeroloom: Cohesive Design System & Architectural Specification

**Document Version**: 2.0 (Post-Phase 0 Redesign)  
**Status**: Approved UI/UX Foundation  
**Lead Engineer / Technical Product Lead**: Antigravity  
**Date**: September 28, 2026

---

## 1. Product Vision & Principles

Aeroloom is a full-stack flight-tracking and planetary aviation intelligence platform. It weaves raw ADS-B transponder telemetry into an intuitive, high-performance spatial interface.

### Core Principles
1. **Instrument-Grade Usability**: The map and flight data are the product. Every element on screen must serve clarity and utility. Zero decorative gimmicks.
2. **Accurate Real-Time Telemetry**: Real coordinates, true headings, authentic barometric altitudes, and squawk codes directly from live ADS-B streams.
3. **Restrained, Premium Aesthetic**: No neon glows, no excessive blur/glassmorphism, no fake sci-fi tropes. Clean dark slate surfaces, hairline borders (1px solid `#1f293d`), and high-contrast tabular typography.
4. **Fluid Responsiveness**: 60fps vector pan/zoom, responsive sidebar-to-bottom-sheet layout across desktop, tablet, and mobile.
5. **Architectural Separation**: Clean boundary between client map layers, server-side cached telemetry ingest, and provider adapters.

---

## 2. Design Tokens

### 2.1 Color Palette
- **Canvas / Base Background**: `#080b11` (Deep Obsidian)
- **Deck Surfaces**: `#0f141f` (Slate Deck), `#161e2e` (Elevated Panel)
- **Dividers & Hairlines**: `#1f293d` (Subtle Slate), `#2d3748` (Active Highlight)
- **Text & Content**:
  - Primary: `#f8fafc` (Clean Slate 50)
  - Secondary: `#94a3b8` (Muted Slate 400)
  - Subtle / Labels: `#64748b` (Slate 500)
- **Functional Telemetry Accents (Used with strict semantic intent)**:
  - **Aero Cyan** (`#0284c7` / `#38bdf8`): Active tracked flight, vector heading arrow, route line.
  - **Status Emerald** (`#10b981`): Live feed connected, normal cruising flight.
  - **Climb / Amber** (`#f59e0b`): Climbing or descending flight, provider sync delay.
  - **Alert Crimson** (`#ef4444`): Emergency transponder codes (Squawk 7700, 7600, 7500).

### 2.2 Typography
- **Headings & Navigation**: `var(--font-geist-sans)`, Inter, system-ui (Clean geometric sans).
- **Telemetry Data & Values**: `var(--font-geist-mono)`, JetBrains Mono (Tabular numerals for altitude, speed, coordinates, squawks, bearings).

---

## 3. UI Architecture & Components

```
+---------------------------------------------------------------------------------------------------+
|  [Logo] AEROLOOM   [Live Sector Selector v]   [ Universal Flight Search (Cmd+K) ]   [LIVE ADS-B]  |
+---------------------------------------------------------------------------------------------------+
|  [FLIGHT TELEMETRY DRAWER]            |  [INTERACTIVE MAP CANVAS (MapLibre GL)]                   |
|  - Flights in Sector (16 active)      |                                                           |
|  - Filters: All | Airborne | Ground   |     ✈ UAL383 [FL370] ↘                                   |
|  -----------------------------------  |                                                           |
|  > UAL383  •  B738  •  37,000 FT      |                    ✈ DAL397 [FL330] →                     |
|  > DAL397  •  A321  •  33,000 FT      |                                                           |
|  > ASA1465 •  B739  •  28,000 FT      |                                                           |
|  > SWA2104 •  B737  •  14,000 FT      |  -------------------------------------------------------  |
|  -----------------------------------  |  [SELECTED FLIGHT DOSSIER] (Follow-mode | Altitude Tape)   |
|  [Telemetry Status & Polling Engine]  |  Speed: 448 kts | Alt: 37,000 ft | Squawk: 4574           |
+---------------------------------------------------------------------------------------------------+
```

### 3.1 Full-Screen Map Canvas
- Powered by `maplibre-gl` utilizing high-performance vector/raster dark aviation tiles (Carto Dark Matter / OpenFreeMap).
- Custom SVG/Canvas vector markers oriented to the aircraft's authentic heading (`track`).
- Click-to-focus: clicking any marker smoothly pans and zooms the camera to center the flight.
- Follow-mode: automatically updates camera coordinates as new ADS-B telemetry arrives.

### 3.2 Top Aviation Bar
- Aeroloom brand mark with live sector counter.
- Quick Sector Switcher: KSFO (San Francisco Bay), KJFK (New York Metro), EGLL (London Heathrow), RJTT (Tokyo Haneda), or User Geolocation.
- Global Search: instant filter by callsign, tail number, or hex.
- Telemetry heartbeat: real-time provider sync indicator and last refresh timestamp.

### 3.3 Flight Telemetry Drawer
- Live list of all detected aircraft within the active bounding box.
- Compact flight cards showing:
  - Callsign (e.g. `UAL383`, `DAL397`)
  - Aircraft Type (e.g. `B738`, `A321`, `EC35`)
  - Altitude with directional indicator (▲ climbing, ▼ descending, ▬ level cruise, ⏏ ground)
  - Speed in knots and current heading in degrees
- Responsive behavior: docked collapsible sidebar on desktop; smooth swipeable bottom sheet on mobile.

### 3.4 Selected Flight Dossier (Inspector Panel)
- Displays deep telemetry on the actively tracked flight:
  - Tail registration number (e.g. `N984JB`)
  - Transponder Squawk code with emergency status validation
  - Vertical speed indicator (feet per minute)
  - Geographic coordinates with precision WGS84 coordinates
  - Direct camera lock button (`Lock Camera on Flight`)

---

## 4. Repository Code Migration Plan

### Retained Foundational Assets:
- `lib/providers/positions/airplanesLive.ts`: Server-side provider adapter with normalization, bounds checking, and fallback.
- `lib/providers/positions/types.ts`: Clean typed models (`AircraftPosition`, `PositionQuery`, `ProviderResponse`).
- `app/api/aircraft/live/route.ts`: Server-side route handler with 6s TTL caching.
- `tests/aircraftProvider.test.ts`: Automated test suite for data normalization and corrupted inputs.
- `scripts/verifyRealApi.ts`: Empirical verification runner.

### Replaced / Cleaned Up Assets:
- Deprecate `components/hero/Terrain.tsx`, `terrain.vert.glsl`, `terrain.frag.glsl`, `terrainShaders.ts` (the rejected wave/terrain prototype).
- Create `components/map/FlightMap.tsx` with MapLibre GL vector engine.
- Create `components/deck/FlightDrawer.tsx` (real-time telemetry flight list).
- Create `components/deck/FlightInspector.tsx` (dossier for selected aircraft).
- Create `components/deck/TopBar.tsx` (search bar, sector switcher, live telemetry heartbeat).
- Update `app/page.tsx` into the unified Aeroloom Operational Interface.
