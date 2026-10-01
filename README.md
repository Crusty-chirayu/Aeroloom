# Aeroloom — Live Airspace Intelligence & Observability

Aeroloom is a live, crowdsourced ADS-B airspace observatory engineered with editorial cartography, sub-pixel dead-reckoning vector flight dynamics, and radical data honesty.

---

## 1. Architectural Philosophy

Aeroloom adheres to a strict editorial aviation design language:
- **Paper & Ink Light Theme**: Designed exclusively for a warm off-white paper canvas (`#F6F4EF` Paper, `#0E1116` Ink, `#FF4F1F` Vermilion Signal). Zero dark-mode toggles. Zero dark matter.
- **Radical Data Honesty**: 100% of tracked aircraft are physically received by community Software-Defined Radio (SDR) feeders. Aeroloom never fabricates synthetic route arcs, generates phantom aircraft, or obscures antenna reception latency.
- **Physical Authenticity**: Top-down hand-authored vector silhouettes scaled to real airframe dimensions, authentic solar day/night terminator boundaries, and mechanical split-flap concourse boards.
- **Performance Budget**: Sub-pixel dead reckoning glides at 60 fps without server polling stutters. Initial landing page JavaScript bundle stays strictly under 350 KB with zero Three.js/WebGL heavy overhead.

---

## 2. Design System & Design Tokens

All design tokens are defined in `app/tokens.css` as CSS Custom Properties:

### Color Palette & WCAG AA Contrast Compliance
| Token | Hex / Value | Operational Usage | WCAG AA Ratio |
|---|---|---|---|
| `--paper` | `#F6F4EF` | Primary canvas background | Base surface |
| `--paper-2` | `#EFECE4` | Recessed panels & inputs | 1.1:1 on paper |
| `--surface` | `#FFFFFF` | Cards, flyouts, and dialogs | 1.1:1 on paper |
| `--ink` | `#0E1116` | Primary headlines & body text | **17.2:1** on paper |
| `--ink-2` | `#3B4250` | Secondary descriptions | **9.6:1** on paper |
| `--ink-3` | `#525A69` | Tertiary metadata, captions, kbd | **6.3:1** on paper |
| `--signal` | `#FF4F1F` | Vermilion accent, active markers | Brand signal |
| `--signal-cta` | `#D33A0E` | High-contrast button background | **4.6:1** against white |
| `--signal-ink` | `#B32E0A` | High-contrast accent text | **5.1:1** on paper |
| `--ok-ink` | `#116943` | Operational status text | **5.8:1** on paper |
| `--warn-ink` | `#8A5200` | Cautionary advisories | **6.1:1** on paper |
| `--bad-ink` | `#A82525` | Critical emergency squawks | **6.9:1** on paper |

### Precision Typography
- **Display Serif**: `Instrument Serif` (Google Fonts) — editorial headings, display numbers, aerodrome titles.
- **Interface Sans**: `Geist Sans` (Vercel) — legibility-first body text, controls, tables.
- **Telemetry Mono**: `Geist Mono` (Vercel) — transponder squawks, flight levels, coordinates, METAR raw strings.

### Paper Grain & Tactile Surface
- Real static paper grain texture applied via pre-rendered SVG `feTurbulence` (fractalNoise, 3% opacity), ensuring zero GPU overhead.
- Universal focus ring: `outline: 2px solid var(--signal); outline-offset: 2px;` active on all interactive elements.

---

## 3. Aircraft Silhouette System

Authored in `lib/map/silhouettes/` on a 64×64 precision vector coordinate grid:
- **11 Aerodynamic Categories**:
  1. `narrowbody` — Single-aisle mainline transport (A320, B737, A220)
  2. `widebody_twin` — Twin-aisle twin-engine airliner (B787, A350, B777, A330)
  3. `quad` — Four-engine heavy transport (A380, B747, A340, C-17)
  4. `regional_jet` — Regional jet (Embraer E175/E190, CRJ-900)
  5. `turboprop` — Regional twin turboprop (ATR 72, Dash 8 Q400)
  6. `bizjet` — Business aviation (Global 7500, Citation X, Gulfstream G650)
  7. `light_ga` — General aviation single piston (Cessna 172, Piper PA-28, Cirrus SR22)
  8. `helicopter` — Rotorcraft (Airbus H145, Sikorsky S-76, Bell 206)
  9. `cargo` — Dedicated freighter transport (B747-8F, B777F, A330-200F)
  10. `military` — Tactical fast jet / combat aircraft (F/A-18, Eurofighter, F-16)
  11. `unknown` — Clean geometric delta silhouette fallback
- **6 Tactical States**: `default`, `selected`, `hover`, `stale`, `on_ground`, `ground_shadow`.
- **Dynamic Sprite Atlas**: `lib/map/spriteAtlas.ts` generates all 66 combinations on the fly onto MapLibre GL instances at 1x, 2x, and 3x DPR.
- **ICAO Type Mapping Engine**: `lib/map/typeMapping.ts` directly resolves 175+ ICAO codes with heuristic family fallbacks.

---

## 4. Live Cartography & Dead Reckoning

- **MapLibre GL Vector Engine**: Keyless, light-mode cartography served via OpenFreeMap / OpenStreetMap vectors.
- **60fps Dead Reckoning (`hooks/useDeadReckoning.ts`)**: Calculates instantaneous vector velocity from ground speed and heading, smoothly interpolating aircraft positions across transponder reception intervals without visual jumping.
- **Astronomical Day/Night Solar Terminator (`lib/map/terminator.ts`)**: Real-time solar declination and Greenwich Hour Angle equations projecting precise sunrise/sunset shadow curves across global projections.

---

## 5. Data Architecture & Provenance

Aeroloom routes telemetry through a multi-tier server architecture (`lib/providers/` and `lib/cache/`):
- **Chained Failover**: Primary client connects to `api.airplanes.live/v2`. If an upstream challenge or timeout occurs, requests seamlessly fail over to `api.adsb.lol/v2`.
- **Spatial Quantization**: Bounding box queries are quantized into 0.05°–0.5° deterministic grid bins based on map zoom levels.
- **Request Coalescer**: Concurrent queries for the identical spatial bin share a single in-flight promise.
- **Sliding-Window Rate Limiter**: 120 requests/minute per client IP with standard RFC HTTP 429 and `Retry-After` headers.
- **METAR Decoder**: Live aviation weather parsed directly from `aviationweather.gov` into FAA flight categories (VFR, MVFR, IFR, LIFR), wind barb vectors, ceiling, and altimeter settings.

---

## 6. Route Architecture

- `/` — Landing page with Lenis smooth scroll, Preloader arc, masked Hero, 300vh scrubbed flight storytelling, 12-col Capabilities Bento, CSS 3D Split-Flap board, Aircraft Specimen library, and Trust register.
- `/map` — Live full-screen airspace observatory with search, filters, layer toggles, flight dossiers, and mobile swipeable sheet.
- `/airports` — Typographic aerodrome directory indexed by country and hub size.
- `/airport/[icao]` — Dedicated aerodrome dossier with decoded METAR, runway telemetry, and 35 NM airspace radar.
- `/flight/[id]` — Deep-linkable flight dossier with route, altitude profile, airframe blueprints, and transponder diagnostics.
- `/search` — Omnisearch directory with tri-entity resolver (flights, aerodromes, carriers).
- `/about/data` — Radical transparency register documenting feeds, licenses, latency, and antenna coverage boundaries.
- `/dev/*` — Isolated engineering workbenches (`/dev/kit`, `/dev/aircraft`, `/dev/icons`) gated in production via `app/dev/layout.tsx`.

---

## 7. Quality Gates & Verification

Run the verification suites locally:

```bash
# 1. Type Check (0 errors expected)
npx tsc --noEmit

# 2. ESLint Check (0 errors, 0 warnings expected)
npm run lint

# 3. Vitest Test Suite (141 tests expected to pass)
npm test

# 4. Zero Horizontal Overflow Check across 10 routes at 5 viewports (50/50 pass)
node scripts/check-overflow.mjs

# 5. Automated axe-core Accessibility Audit across all routes (0 critical/serious)
node scripts/audit-accessibility.mjs

# 6. Capture Visual Screenshot Proof across all viewports
node scripts/take-phase5b-screenshots.mjs
```

---

## 8. Development & Production Build

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Compile production bundle
npm run build

# Start production server
npm start
```

---

## License

Code is distributed under the MIT License. Geographic cartography © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and [OpenFreeMap](https://openfreemap.org). Crowdsourced ADS-B transponder telemetry via [airplanes.live](https://airplanes.live) and [adsb.lol](https://adsb.lol).
