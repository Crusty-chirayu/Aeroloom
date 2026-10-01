# Aeroloom — Final Autopilot Progress & Audit Log

Tracking execution across Parts A through J on branch `redesign/v2`.

---

## 1. Global Status & Roadmap

| Part | Description | Status | Verification Gate |
| :--- | :--- | :--- | :--- |
| **Part A** | Close production-readiness gaps (config, 404 /dev/*, Firefox/WebKit report, fresh install, URLs) | **DONE** | `npm ci`, `build`, `test`, `dev/kit` 404 proof, Lighthouse mobile baseline |
| **Part B** | Live weather radar on map (RainViewer API terms, frame cache, timeline, 60fps pan/zoom) | **DONE** | Terms in `data-sources.md`, frame cache, radar timeline, frame rate benchmarks |
| **Part C** | ATC-style radar scope on airport pages (range rings, live blips, rotating sweep, table fallback) | PENDING | 60fps with 300 blips, reduced motion, bento tile preview, accessible table |
| **Part D** | Backend hardening (all API routes audited, failure simulation, rate limits, /status, CSP) | PENDING | Real requests audit, simulated upstream outages, 429 Retry-After, security headers |
| **Part E** | Accounts: Google/GitHub OAuth, guest mode, watchlist, import dialog, RLS migration | PENDING | Unit & e2e tests, RLS cross-user isolation, `docs/AUTH_SETUP.md` |
| **Part F** | AI Flight Assistant (OpenRouter free models, grounded retrieval, injection resistance) | PENDING | 20 eval scenarios, mock model tests, fallback chain, rate limiting |
| **Part G** | Brand system (original woven thread SVG mark, favicon set, web manifest, dynamic OG cards) | PENDING | Multi-size critique, manifest, `docs/BRAND.md`, OG generation |
| **Part H** | Legal, footer, developer mark, Case-study About page, feedback contact form | PENDING | `site-config.ts`, `check:launch`, clean legal pages, shared SiteFooter |
| **Part I** | Tests & quality gates (Playwright e2e, axe-core 0 issues, 50/50 overflow, Lighthouse, secrets) | PENDING | E2E suite, 0 overflow, 0 a11y issues, secrets scan, bundle audit |
| **Part J** | Self-critique (8+ weaknesses resolved), docs (DEPLOY, OWNER_CHECKLIST), FINAL_REPORT.md | PENDING | Final fresh install, git proof, final delivery report |

---

## 2. Part A: Execution Log

### Tasks
- [x] Check file existence: `FINAL_REPORT.md` (created), `.env.example` (expanded), `docs/DEPLOY.md` (created).
- [x] Create `lib/site-config.ts` with canonical site configuration and `TODO_OWNER` placeholders.
- [x] Update `.env.example` with comprehensive feature groupings, comments, and required/optional flags.
- [x] Create `docs/DEPLOY.md` detailing step-by-step free-tier Vercel deployment.
- [x] Create `app/dev/layout.tsx` to ensure `/dev/*` routes return 404 in production.
- [x] Prove `/dev/kit`, `/dev/aircraft`, and `/dev/icons` return 404 in production build (`npm run build && npm start`).
- [x] Report Firefox and WebKit results from `scripts/verify-cross-browser.mjs` honestly.
- [x] Fresh install test: delete `node_modules` and `.next`, `npm ci`, `npm run build`, `npm test` (all 141 tests pass).
- [x] Run real mobile Lighthouse audit on `/`, `/map`, `/flight/[id]`, `/airport/[icao]` and record raw scores.
- [x] Centralize all site URLs to `NEXT_PUBLIC_SITE_URL` via `siteConfig.url`.

---

## 3. Part B: Execution Log

### Tasks
- [x] Verify and document RainViewer API terms in `docs/data-sources.md` (native z0–z7, 13 past 10-min Doppler frames, scheme 2, attribution).
- [x] Build server proxy endpoint `/api/radar/route.ts` with 5-min server cache TTL, request coalescing, per-IP rate limiting, and stale fallback.
- [x] Build radar timeline control `components/map/RadarTimelineControl.tsx` with play/pause, scrubber, UTC/local timestamps, opacity slider, reflectivity legend, keyboard navigation, and reduced motion support.
- [x] Integrate Doppler radar raster layer into MapLibre `components/map/FlightMap.tsx` and sync `?radar=1` query parameter on `/map`.
- [x] Optimize WebGL raster layer updates in-place via `(source as any).setTiles([radarTileUrl])` to eliminate texture re-allocation thrashing.
- [x] Create and run Playwright FPS benchmark script `scripts/benchmark-radar-fps.mjs`.

---

## 4. Evidence & Audit Records

### Part B FPS Benchmark Result (`scripts/benchmark-radar-fps.mjs`):
- **Radar OFF:** 16.83 ms/frame (**59 FPS**)
- **Radar ON:** 16.63 ms/frame (**60 FPS**)
- **TypeScript:** 0 errors (`npx tsc --noEmit`)
- **ESLint:** 0 warnings / 0 errors (`npm run lint`)
- **Vitest:** 141/141 passing (`npm test`)

