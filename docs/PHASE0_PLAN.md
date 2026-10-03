Now I have a complete picture of the codebase. Let me produce the audit and plan.

---

## STEP 1: AUDIT

### What exists

**App routes:**
| Route | File | Status |
|---|---|---|
| `/` (landing) | `app/page.tsx` | **Delete all UI.** Currently a single-page app blending landing + observatory. Needs full replacement. |
| `/airport/[code]` | `app/airport/[code]/page.tsx` | **Delete entire file** — dark-themed UI |
| `/airports` | `app/airports/page.tsx` | **Delete UI** |
| `/flight/[flightId]` | `app/flight/[flightId]/page.tsx` | **Delete UI** |
| `/dashboard` | `app/dashboard/page.tsx` | **Delete** — not in spec's IA; was Supabase dashboard. Spec has `/map`, `/flight`, `/airport`, `/search`, `/about/data` |

**Layout:**
- `app/layout.tsx` — loads `dark` class on `<html>`, sets `bg-[#030712]`, loads only Geist Sans/Mono. Needs: remove `dark`, remove dark bg, add Instrument Serif font, remove dark body color.
- `app/globals.css` — **complete replacement**: all tokens are dark-theme. MapLibre overrides are dark. Everything goes.

---

### Components — **DELETE entirely (UI/theme code):**

| File | Reason |
|---|---|
| `components/hero/Terrain.tsx` | 3D dotted-grid terrain + cursor-reactive shader. Hard Rule 2 & 3. |
| `components/hero/terrain.frag.glsl` | Shader for the terrain. Same. |
| `components/hero/terrain.vert.glsl` | Shader for the terrain. Same. |
| `components/hero/terrainShaders.ts` | Imports and re-exports those shaders. Same. |
| `components/hero/LiveAircraftPing.tsx` | Three.js R3F component rendering aircraft on the terrain in 3D. Depends on `projection.ts` + terrain. |
| `components/landing/LandingScene.tsx` | Hosts the R3F Canvas with `DottedGridMesh` (cursor-reactive terrain clone) + `FocalAircraft`. |
| `components/landing/FocalAircraft.tsx` | 3D aircraft model that does parallax banking/pitching with `state.pointer.x/y` — cursor-reactive. Hard Rule 3. |
| `components/landing/LandingOverlay.tsx` | Dark-themed text overlay for the old landing. |
| `components/observatory/ObservatoryHeader.tsx` | Dark glassmorphism header. Full dark theme. Delete UI. |
| `components/observatory/HorizonDock.tsx` | Dark tactical dock UI. Delete. |
| `components/observatory/GlobalSearchModal.tsx` | Dark-themed search modal. Delete. |
| `components/deck/Header.tsx` | Dark header. Delete. |
| `components/deck/SelectedFlightDossier.tsx` | Dark dossier. Delete. |
| `components/auth/AuthModal.tsx` | Dark glassmorphism auth modal. Delete UI. Auth is out of v1 scope per spec. |
| `components/auth/ImportLocalDataModal.tsx` | Dark modal. Delete. |
| `components/map/FlightMap.tsx` | Dark basemap config (CARTO Dark Matter). Delete — will rebuild for light basemap. |
| `components/map/AircraftLayer.tsx` | Dark icon colors (`#38bdf8` cyan, `#080b11` stroke). Delete — will rebuild with new design tokens. |

---

### `lib/` code — **KEEP (backend/data logic, tested, works):**

| File | Keep | Notes |
|---|---|---|
| `lib/providers/positions/types.ts` | ✅ **Keep** | Good typed interfaces. `AircraftPosition` aligns with spec's `AircraftState`. Will extend slightly. |
| `lib/providers/positions/airplanesLive.ts` | ✅ **Keep** | Real data fetching from airplanes.live + adsb.lol. Tested. 101 tests pass. |
| `lib/providers/positions/validation.ts` | ✅ **Keep** | Spatial validation, ICAO hex, squawk validation. Tested. |
| `lib/providers/enrichment.ts` | ✅ **Keep** | Airline + aircraft + route enrichment pipeline. |
| `lib/airports/airportData.ts` | ✅ **Keep** | 570-line curated airport database. |
| `lib/metadata/aircraftCatalog.ts` | ✅ **Keep** | ICAO type → manufacturer/model catalog. |
| `lib/metadata/airlineCatalog.ts` | ✅ **Keep** | Callsign → airline resolver. |
| `lib/routes/routeResolver.ts` | ✅ **Keep** | Schedule route lookup. |
| `lib/map/aircraftGeoJson.ts` | ✅ **Keep** | GeoJSON converter; colors will change but logic is solid. |
| `lib/map/trailGeoJson.ts` | ✅ **Keep** | Trail/breadcrumb logic. Tested. |
| `lib/map/config.ts` | ✅ **Keep with modification** | `AviationSector` + `MAP_DEFAULTS` are good. `BASEMAP_PROVIDERS` must be updated — delete dark basemap entries, add light basemap (OpenFreeMap Liberty or CARTO Light). |
| `lib/supabase/client.ts` | ✅ **Keep** | Auth seam preserved per spec. |
| `lib/supabase/server.ts` | ✅ **Keep** | Server-side auth seam. |
| `lib/auth/authContext.tsx` | ✅ **Keep** | Auth context seam per spec instructions (leave clean seams). |
| `lib/storage/persistenceAdapter.ts` | ✅ **Keep** | Persistence layer. |
| `lib/storage/userStore.ts` | ✅ **Keep** | Alert/watchlist store. |
| `lib/alerts/alertEngine.ts` | ✅ **Keep** | Alert evaluation engine. Tested. |
| `hooks/useLiveAircraft.ts` | ✅ **Keep** | Live polling + selection + replay logic. Well-tested. Some lint warnings but logic is sound. |
| `app/api/aircraft/live/route.ts` | ✅ **Keep** | Server route handler with circuit breaker and cache. |

### Files that must be **DELETED** from lib:

| File | Reason |
|---|---|
| `lib/projection.ts` | Only used by `LiveAircraftPing.tsx` (Three.js terrain projection). Imports `three`. Not needed in the redesign. |
| `lib/deviceTier.ts` | Only used by `Terrain.tsx` and `LandingScene.tsx` for Three.js LOD. The terrain is deleted. This is dead code in the new design. |

### Tests — **KEEP all tests** (`tests/*.test.ts`). None test UI.

### Supabase migration SQL — **KEEP** (`supabase/migrations/`).

### Docs — keep `docs/` as-is. `DESIGN_SPEC.md` goes in root (already there).

---

## STEP 2: PHASE 0 IMPLEMENTATION PLAN

Here is exactly what Phase 0 does. **Waiting for your approval before touching anything.**

---

### Phase 0 — Audit & Foundations

**Objective:** Delete old UI. Establish new design system foundation. Create `/dev/kit` component showcase. No map, no data wiring. Everything verifies clean.

---

#### A. Files to delete

```
components/hero/Terrain.tsx
components/hero/terrain.frag.glsl
components/hero/terrain.vert.glsl
components/hero/terrainShaders.ts
components/hero/LiveAircraftPing.tsx
components/landing/LandingScene.tsx
components/landing/FocalAircraft.tsx
components/landing/LandingOverlay.tsx
components/observatory/ObservatoryHeader.tsx
components/observatory/HorizonDock.tsx
components/observatory/GlobalSearchModal.tsx
components/deck/Header.tsx
components/deck/SelectedFlightDossier.tsx
components/auth/AuthModal.tsx
components/auth/ImportLocalDataModal.tsx
components/map/FlightMap.tsx
components/map/AircraftLayer.tsx
app/dashboard/page.tsx
lib/projection.ts
lib/deviceTier.ts
```

`app/page.tsx`, `app/layout.tsx`, `app/globals.css`, and all other `app/*/page.tsx` files will be **rewritten, not just deleted** (they need stub content to hold the route).

---

#### B. Files to modify

1. **`next.config.ts`** — Remove the `turbopack.rules` GLSL loader sections (terrain shaders deleted; webpack GLSL loader also removed). Keep everything else.
2. **`app/layout.tsx`** — Remove `dark` class from `<html>`. Remove `bg-[#030712]` body. Add Instrument Serif font via `next/font`. Update metadata title/description to match spec copy.
3. **`app/globals.css`** → Full replacement with Editorial Aviation design tokens from spec section 3 + base body styles (light theme, Tailwind import, MapLibre GL CSS import, clean scrollbar, clean MapLibre controls override for light theme).
4. **`lib/map/config.ts`** — Replace dark basemap entries with light basemap providers (CARTO Light Matter + OpenFreeMap Liberty style). Keep `AviationSector` + `MAP_DEFAULTS` + sectors array unchanged.
5. **`tsconfig.json`** — Verify `strict: true` is set (it is). No changes needed.

---

#### C. New files to create

**Design system:**
- `app/tokens.css` — All CSS custom properties from spec section 3 (colors, radius, shadow, easing, font variables, spacing).
- `app/globals.css` — Rewritten. Imports `tokens.css`, sets up body, typography base, MapLibre light-theme overrides.

**Fonts (via `next/font`):**
- Added in `app/layout.tsx`: Instrument Serif (regular + italic), Geist Sans (already exists), Geist Mono (already exists).

**Base UI components** (all in `components/ui/`):
- `Button.tsx` — ink pill + signal pill variants, press scale 0.98, arrow-slide hover.
- `Chip.tsx` — small mono-label status chips.
- `Input.tsx` — hairline border, clean light styling.
- `Panel.tsx` — `--r-lg`, `--sh-2` or `--sh-3` floating panel.
- `Tooltip.tsx` — Radix primitive (install if not present), restyled.
- `Skeleton.tsx` — matches-layout skeleton shimmer.
- `Icon.tsx` — typed SVG sprite wrapper for Lucide icons (Lucide is already in deps as `lucide-react`).
- `Tabs.tsx` — Radix or HTML tabs, restyled.

**Stubs for replaced pages:**
- `app/page.tsx` — Minimal white placeholder: `<main>` with `--paper` bg, "Aeroloom · Coming in Phase 5" in Instrument Serif. No dark theme. No crash.
- `app/map/page.tsx` — New route stub: placeholder. (The old landing+map was on `/`; per spec `/map` is the core product route. Create this new route stub now so it exists for Phase 3.)
- `app/airports/page.tsx` — White placeholder stub.
- `app/airport/[code]/page.tsx` — White placeholder stub.
- `app/flight/[flightId]/page.tsx` — White placeholder stub.
- `app/search/page.tsx` — New route stub per spec IA.
- `app/about/data/page.tsx` — New route stub per spec IA.
- `app/not-found.tsx` — Styled 404 placeholder.

**Dev kit:**
- `app/dev/kit/page.tsx` — Shows every component at each state: Button (default, signal, disabled, loading), Chip (ok/warn/bad/signal), Input (empty, filled, error), Panel, Tooltip, Skeleton, Tabs, color swatches, type specimen (all scales in both Instrument Serif and Geist), spacing tokens, shadow tokens.

**Grep verification:**
- `scripts/grep-dark-theme.ts` (or inline shell) — used in the verification gate to confirm zero remnants.

---

#### D. Dependency changes

- **Remove** (from `package.json` + `node_modules`): `@react-three/drei`, `@react-three/fiber`, `@react-three/postprocessing`, `three`, `@types/three`, `postprocessing`. These only served the terrain and 3D aircraft. The GLSL type declaration `glsl.d.ts` also goes.
- **Add** (`npm install`): `@radix-ui/react-tooltip`, `@radix-ui/react-tabs` (for base components in kit). Check if already transitively present.
- **`raw-loader`** (devDep) — used only for GLSL in `next.config.ts`. Remove.
- **`lucide-react`** — already installed. Keep.

---

#### E. Verification gate (after execution)

1. `npx tsc --noEmit` — 0 errors.
2. `npm run lint` — 0 errors.
3. `npm run build` — passes, 0 errors.
4. Browser at 390/768/1280/1728: `localhost:3000` (stub), `localhost:3000/dev/kit` (full component kit). Screenshots taken and inspected for misalignment, overflow, contrast.
5. `prefers-reduced-motion` check on `/dev/kit`.
6. Grep for `#030712`, `#080b11`, `dark-matter`, `u_cursor`, `pointermove.*terrain`, `@react-three` — must return 0 results in source files.
7. Test count: run `npm test` — 101 tests must still pass (they test backend/data only).

---

**Risks / deviations to flag:**

1. **`useLiveAircraft.ts` lint warnings** — The hook has `react-hooks/refs` and `react-hooks/set-state-in-effect` lint warnings from Phase 1. These are pre-existing and will remain until Phase 3 rewrites the hook. I will note them but not fix them now (fixing requires understanding the map layer architecture which is Phase 3 work). The lint gate currently exits 0 (warnings ≠ errors).
2. **`app/airports/page.tsx`** exists and imports old dark UI — I will replace it with a stub. Same for `airport/[code]` and `flight/[flightId]`.
3. **Route structure change** — The spec moves the live map from `/` to `/map`. The stub on `/` will be the landing page placeholder. This is intentional.

---

**Awaiting your approval.** Once you say go, I will execute Phase 0 completely, run all verification gates, take browser screenshots, and give you the full report before stopping.