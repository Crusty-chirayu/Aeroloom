# AEROLOOM: SYSTEM ARCHITECTURE & TECHNICAL BLUEPRINT
**Product:** Aeroloom — The Atmospheric Observatory  
**Version:** 0.1.0-RC1  
**Architecture Model:** Hybrid Serverless Next.js 16 + GPU WebGL Canvas + Open ADS-B Telemetry Pipeline  
**Target Infrastructure:** Zero-Cost Deployment (Vercel Serverless / Free Tier Supabase PostgreSQL / Open Data APIs)  

---

## 1. HIGH-LEVEL SYSTEM TOPOLOGY

```
                  ┌───────────────────────────────────────────────┐
                  │          USER BROWSER / CLIENT LAYER          │
                  │  (Next.js App Router 16.3 + React 19 Client)   │
                  └──────────────┬──────────────────┬─────────────┘
                                 │                  │
                WebGL / Canvas   │                  │  REST API & SSE
                Rendering Stream │                  │  Polling (6s TTL)
                                 ▼                  ▼
       ┌──────────────────────────────────┐   ┌──────────────────────────────────┐
       │   GPU OBSERVATORY PRESENTATION   │   │     NEXT.JS SERVERLESS ROUTE     │
       │  • Three.js R3F 3D Orbit Portal  │   │     • /api/aircraft/live         │
       │  • MapLibre GL Tactical Basemap  │   │     • WGS84 Spatial Validation   │
       │  • Vector Altitude Strata Engine │   │     • Bounded LRU Query Cache    │
       │  • Glowing Breadcrumb LineString │   │     • Circuit Breaker Fallback   │
       └──────────────────────────────────┘   └─────────────┬────────────────────┘
                                                            │
                                             Upstream Proxy │ (Composite ADS-B)
                                                            ▼
                                              ┌───────────────────────────┐
                                              │   OPEN AVIATION GATEWAY   │
                                              │   • Airplanes.live ReadsB │
                                              │   • ADSB.lol Open Fallback│
                                              └───────────────────────────┘
```

---

## 2. SUBSYSTEM ARCHITECTURAL BREAKDOWN

### 2.1 The Atmospheric Observatory (Frontend & Rendering Subsystems)
* **3D Orbit Landing Portal (`components/landing/LandingScene.tsx`)**:
  - Implements a cursor-reactive dotted grid terrain mesh driven by custom GLSL shaders (`u_cursor`, `u_intensity`, `u_time`).
  - Features real-time adaptive device benchmarking (`lib/deviceTier.ts`): queries WebGL context renderer, hardware concurrency, and runs a 30-frame GPU performance benchmark to select between `full` (10,000 points), `reduced` (5,400 points), and `static` (zero-overhead radar rings).
  - Handles WebGL context loss (`webglcontextlost`) gracefully by reverting to the 2D SVG topographic canvas without component crash.
* **MapLibre 2D Tactical Radar (`components/map/FlightMap.tsx` & `AircraftLayer.tsx`)**:
  - Uses vector basemap tiles from CARTO Dark Matter and OpenFreeMap Dark with zero paid API keys.
  - Dynamically renders live aircraft GeoJSON features, altitude-colored aircraft directional glyphs, and authentic breadcrumb historical flightpaths.
  - Incorporates canvas-level context loss recovery (`webglcontextrestored`) and window resize observers for responsive resizing.

### 2.2 Telemetry Ingestion, Validation & Enrichment (`lib/providers/` & `app/api/aircraft/live`)
* **Strict Validation (`lib/providers/positions/validation.ts`)**:
  - Validates all geographic parameters: WGS84 latitude (`[-90.0, 90.0]`), longitude (`[-180.0, 180.0]`), operational radius (`[1, 300]` NM).
  - Validates 24-bit ICAO Mode-S hexadecimal transponder addresses (`^[0-9a-fA-F]{6}$`) and Mode A/C octal squawk codes (`^[0-7]{4}$`).
* **Composite Failover & Negative Caching**:
  - Directs primary queries to Airplanes.live. If upstream rate limits or contact requirements are triggered, seamlessly fails over to ADSB.lol with identical schema normalization.
  - Implements bounded LRU memory caching (max 120 entries) with a 6-second positive cache TTL and a 3-second negative cache circuit breaker to protect upstream networks during outages.
* **Metadata & Route Resolver (`lib/metadata/` & `lib/routes/`)**:
  - Enricher checks ICAO airline codes (`DAL`, `BAW`, `SWA`, `JBU`) and aircraft type designators (`B738`, `A20N`, `C172`) against local catalogs.
  - Authentic route resolver queries known commercial schedule indexes. Unfiled general aviation flights explicitly display `"Route unfiled • Transponder-only telemetry"`—zero route hallucinations or destination guessing based on proximity.

### 2.3 User Persistence & Storage Architecture (`lib/storage/persistenceAdapter.ts`)
* **Persistence Tier Abstraction**:
  - Standardizes operations (`getSavedFlights`, `saveFlight`, `removeSavedFlight`, `getWatchlists`, `saveWatchlist`, `getAlerts`, `saveAlert`, `exportData`, `importData`) behind `IPersistenceAdapter`.
  - **Tier 1 (Device-Local)**: Operates out-of-the-box via browser `localStorage` with JSON import/export portability tools. No account or database configuration required.
  - **Tier 2 (Cloud-Synced)**: Connects to Supabase PostgreSQL with Row Level Security (RLS) policies when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are provided.
* **Database DDL (`supabase/migrations/20260929_aeroloom_core_schema.sql`)**:
  - Defines `profiles`, `saved_flights`, `watchlists`, and `airspace_alerts` tables with user ownership constraints and automated UUID primary keys.

---

## 3. SECURITY & PRIVACY BOUNDARIES

1. **Zero Secret Leakage**:
   - Client bundles contain no service-role secrets or private database tokens. Only public, anon-scoped keys are consumed.
2. **SSRF & Parameter Injection Prevention**:
   - Query coordinates and radii are validated and cast into strict numeric types before constructing upstream fetch URLs.
3. **Attribution & Terms Compliance**:
   - Responses include `X-Data-Source` headers, and map canvases display persistent attribution for CARTO, OpenFreeMap, and OpenStreetMap contributors.
