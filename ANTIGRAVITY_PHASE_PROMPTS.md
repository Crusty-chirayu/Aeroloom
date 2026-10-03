# Antigravity Phase Prompts (Phase 0 cleanup, then Phases 1–6)

How to use:
- One prompt per new Antigravity conversation, in **Planning mode**. Paste only the text inside each code block.
- Approve a phase only after you have opened the result yourself in the browser. Do not skip your own review.
- Before every phase: `git status` must be clean and you must be on `redesign/v2`.
- If credits run out mid-phase, use the RESUME prompt at the bottom.

---

## PHASE 0 — CLEANUP (run this first, it is short)

```
Read DESIGN_SPEC.md fully. Phase 0 is committed, but I found gaps. Fix them as Phase 0.5, then stop.

1. Lint: DESIGN_SPEC.md requires zero warnings. Fix the 13 unused-parameter warnings in lib/storage/persistenceAdapter.ts now (do not wait for Phase 6). Leave the 4 warnings in hooks/useLiveAircraft.ts, which Phase 3 rewrites, and list them as the only known debt.

2. Screenshot proof: your earlier screenshots may not have been taken at the required widths (I saw you checking image dimensions). Take NEW screenshots of /dev/kit and /, at exactly 390, 768, 1280, and 1728 px viewport width, using a method that really sets the viewport size (for example Playwright with setViewportSize, or Chrome DevTools device emulation). Prove each width by reading the image dimensions and printing them. Save them in docs/screenshots/phase0/.

3. Reduced motion: load /dev/kit with prefers-reduced-motion emulated and confirm the easing demo and any animation switch to fades/instant. Report what you observed.

4. You edited lib/map/aircraftIcon.ts only to make a grep pass. Tell me exactly what you changed and why, and confirm it does not reintroduce any dark-theme color.

5. Fix the three generic-tell items you flagged on the kit page that can be fixed now without waiting: (a) restyle the color swatches as an aeronautical altitude-scale strip instead of rounded cards, (b) give Input a mono micro-label above the field in the same style as the spec's labels, and (c) confirm the focus ring is visible on every interactive kit element.

Run tsc, lint, build, and tests, show the outputs, commit, and stop. Do not start Phase 1.
```

---

## PHASE 1 — DATA LAYER

```
Read DESIGN_SPEC.md fully, especially sections 5 and 11. Then do Phase 1 ONLY (Data layer). Plan first, wait for my approval, then execute.

Context: the repo already has a working provider (lib/providers/positions/airplanesLive.ts with adsb.lol fallback), validation, enrichment, catalogs, an API route at app/api/aircraft/live/route.ts with a circuit breaker and cache, and 101 passing tests. Do NOT rewrite what works. Audit it against spec section 5 and close the gaps.

Gaps to close (confirm each against the code first, and report if already satisfied):
1. Provider adapter interface: expose the FlightProvider interface from the spec (getAircraftInBounds, getAircraftByCallsign, getTrack) and make the existing code implement it. Add a second provider slot so sources can be swapped or chained with failover.
2. Normalization: ensure one AircraftState type (spec fields) is the only shape the UI sees. Keep the current AircraftPosition mapped to it cleanly, with no duplicate types.
3. Caching and request coalescing: add Upstash Redis caching (2–10 s TTL for positions) behind an interface, with an in-memory fallback when Redis env vars are absent so local dev works. Coalesce concurrent identical upstream requests into one. Add per-IP rate limiting to our own routes.
4. Bounds-based fetching: the route must accept bounds (and zoom) and quantize/tile the bounds so cache keys are shared between nearby viewers.
5. New routes (server-side only, never call upstream from the browser): 
   - GET /api/aircraft/[id]/track (recent track points from whatever real source exists; if none exists, return an honest empty result plus a flag the UI can use, and build a short server-side breadcrumb history as a fallback if that is feasible within free infra)
   - GET /api/search?q= (flights by callsign/registration from live data, airports from lib/airports, airlines from the catalog; grouped results)
   - GET /api/airport/[icao]/weather (METAR/TAF from aviationweather.gov, decoded into a typed object with flight category VFR/MVFR/IFR/LIFR, wind, visibility, ceiling, temperature)
   - GET /api/airport/[icao]/traffic (aircraft near the airport using the live provider)
6. Staleness fields: include updatedAt and a server-computed ageSeconds in responses so the client can apply the 60 s / 180 s rules.
7. Errors: a consistent typed error envelope, with upstream failure returning last-known cached data plus a degraded flag.
8. docs/data-sources.md: for every upstream (airplanes.live, adsb.lol, aviationweather.gov, any others), record the URL, what we use it for, rate limits, attribution/terms, and whether commercial use is allowed. Check the current terms yourself; do not guess. Flag any source whose terms are unclear.

Rules: no fake data anywhere. Add tests for every new piece (normalization, coalescing, cache fallback, bounds quantization, METAR decode, search grouping). All existing tests must still pass.

Verification gate: tsc, lint (report warnings), build, full test run with summary line shown. Call each new route with real requests (curl or the browser) and paste the response shapes and status codes. Test the degraded path by simulating an upstream failure. Commit, write the report, stop. Do not touch UI. Do not start Phase 2.
```

---

## PHASE 2 — AIRCRAFT SYSTEM

```
Read DESIGN_SPEC.md fully, especially sections 3, 6 and 11. Then do Phase 2 ONLY (Aircraft system). Plan first, wait for my approval, then execute.

Goal: the custom aircraft artwork and icon set. This is where the product stops looking generic, so quality matters more than speed.

1. Aircraft silhouettes: hand-author clean, accurate TOP-DOWN SVG silhouettes on a 64×64 grid with correct proportions (wingspan to length, wing sweep, engine count and placement, tail). Categories: narrowbody, widebody twin, quad (A380/747), regional jet, turboprop, business jet, light GA, helicopter (with rotor disc), cargo freighter, military/other, unknown. Reference real aircraft proportions; do not draw a generic "airplane emoji" shape repeated with small changes. Each category must be visibly distinct at 24px.
2. Type mapping: map ICAO type codes to categories through a lookup table (cover at least the 150 most common airliner, regional, bizjet, GA, and helicopter codes), with a fallback by the existing aircraftCatalog data, then to "unknown". Unit-test the mapping, including fallbacks and unknown codes.
3. Sprite atlas: generate a MapLibre sprite atlas at 1x, 2x, 3x DPR for all states per category: default, selected (signal color with 2px white outline), hover, stale (40% opacity), on-ground (smaller, ink-3). Replace the old lib/map/aircraftIcon.ts entirely. No dark-theme colors. Add a ground-shadow variant (same silhouette, 12% ink) for the altitude shadow effect.
4. Blueprint illustrations: for each category, a technical line drawing with top, side, and front views in thin ink linework, with mono dimension callouts (wingspan, length, height as typical values for the category, labeled as typical), and a stroke-dashoffset draw-in animation component that respects reduced motion. Label clearly when a category drawing is used as a stand-in for a specific type.
5. Custom aviation icons: add the custom icons from spec 6.1 (takeoff, landing, runway, tower, altitude, vertical-rate up/down, heading/compass, squawk, gate, delay, route-arc, layers, filter) into the Icon registry created in Phase 0, in the same 24px / 1.5px-stroke style as the base set. All icons render crisp at 16, 20, 24 px.
6. Dev pages: /dev/aircraft showing every silhouette in every state at 24, 32, 48 and 96 px on both paper and white, the type-mapping table, and the blueprint set; /dev/icons showing the whole icon set with names.

Quality checks: render every silhouette at 24 px and at 4× zoom; critique each honestly (proportions, distinctness, edge quality) and fix weak ones before reporting. Do not ship low-effort shapes.

Verification gate: tsc, lint, build, tests. Screenshots of /dev/aircraft and /dev/icons at 390, 768, 1280, 1728 px with proven dimensions. Reduced-motion check on the blueprint animation. Commit, write the report with your honest critique of the weakest 5 silhouettes, stop. Do not start Phase 3.
```

---

## PHASE 3 — MAP PAGE

```
Read DESIGN_SPEC.md fully, especially sections 5, 8, 10 and 11. Then do Phase 3 ONLY (Map page). Plan first, wait for my approval, then execute. This is the core product surface.

Build /map exactly per spec section 8:
1. Light custom map style (style JSON): paper land, soft pale-blue water, hairline borders, muted Geist labels, minimal roads/POIs, airports and cities emphasized. Choose a free vector tile source with permissive terms, verify its terms and attribution requirements, record them in docs/data-sources.md, and show attribution tastefully. Do not use a source that requires a paid token.
2. Aircraft layer using the Phase 2 sprite atlas, rotated by track, colored by scheme (solid ink default, by altitude ramp, by speed), with ground shadow offset by altitude. Selected aircraft = signal color plus one pulsing ring (opacity animation, 2 s loop) and label.
3. Rewrite hooks/useLiveAircraft.ts for this architecture: bounds-based fetching with 250 ms debounce and request abort, typed-array/GeoJSON batched updates, NO per-aircraft React components, and a single requestAnimationFrame loop that dead-reckons positions between updates and eases corrections over ~600 ms. This rewrite must also clear the 4 known lint warnings. Keep the existing tests passing or update them with justification.
4. Stale rules: >60 s aircraft at 40% opacity, >180 s removed.
5. Hover tag (<50 ms), click selection, right-side 420 px flight panel on desktop, draggable bottom sheet with 3 snap points on mobile, easeTo with padding compensation.
6. Selected-flight content: altitude-gradient completed track, dashed great-circle projected route only if origin/destination are really known, live stats (altitude, ground speed, vertical rate with up/down glyph, heading with mini compass, squawk), altitude and speed sparklines (hand-built SVG), aircraft info from real data only, links to airports.
7. Filters chip bar (altitude range, category, speed, on-ground, callsign prefix), layers menu (day/night terminator, airports, RainViewer radar, label density), command palette wired to /api/search with grouped results, recent searches, full keyboard shortcuts (/, Cmd/Ctrl+K, F follow, Esc, +/−, L).
8. Follow mode that smoothly locks the camera and exits on manual pan.
9. Density handling: soft heat layer and sparse silhouettes at world zoom, full silhouettes fade in as you zoom in. No wall of overlapping icons.
10. URL is state: /map?lat=&lng=&z=&flight= restored on load and shareable.
11. App chrome: 64 px left rail with icon buttons and tooltips, top-center command bar trigger. No Lenis on this route.
12. Designed loading, empty, error, and "Live feed delayed" states. Skeletons only on panels, never blocking the map.

Performance targets: 60 fps pan/zoom with 5,000 aircraft on a mid laptop. Measure with the browser performance profiler and report numbers: frame time during pan, long tasks over 50 ms, and JS heap over 2 minutes of running. Test with a simulated 5,000-aircraft dataset (clearly labeled test only, not shipped).

Verification gate: tsc, lint (expect zero warnings now), build, tests. Screenshots at 390, 768, 1280, 1728 px with proven dimensions for: idle map, hover, selected flight with panel, mobile bottom sheet in two snap states, filters open, palette open, empty state, degraded state. Reduced-motion check. Record a short screen capture of pan/zoom, selection, and follow mode, and report any jank you see. Commit, report honestly, stop. Do not start Phase 4.
```

---

## PHASE 4 — FLIGHT, AIRPORT, SEARCH, DATA PAGES

```
Read DESIGN_SPEC.md fully, especially sections 4, 5, 9, 10 and 11. Then do Phase 4 ONLY. Plan first, wait for my approval, then execute.

1. /flight/[id] (editorial layout per spec 9): large route header in Instrument Serif using real origin/destination when known, a progress line with the aircraft silhouette at real progress, mono stat grid, Phase 2 blueprint illustration for the aircraft category, altitude and speed profile charts (hand-built SVG, draw-in on view), embedded mini-map with the track, honest "data from" footnote. Must look complete and intentional with partial data: missing fields collapse cleanly, no "N/A" walls. If the flight is not currently tracked, show a designed "not airborne / not found" state with search suggestions.
2. /airport/[id or icao] using the existing airport database: name, codes, local time, decoded METAR in plain language with wind arrow and flight-category chip, nearby aircraft list plus mini-map, and arrivals/departures boards ONLY if a real free source exists. Otherwise show "aircraft near this airport" and say so honestly. Designed empty and error states.
3. /airports index: a searchable, filterable list of airports (region filter, type) with a clean typographic table, not a generic card grid.
4. /search: full-page search using the same /api/search, grouped results, keyboard navigation.
5. /about/data: honest transparency page from docs/data-sources.md: sources, what each provides, coverage, latency, limits, attribution.
6. Designed 404 and error pages in the editorial style with a small aircraft illustration and a useful link back.
7. Shared opening behavior: selecting a flight on /map still opens the side panel, and the panel has an "Open full page" link to /flight/[id]. Deep links work from a cold load.
8. Metadata for each route (title, description, Open Graph placeholder to be replaced in Phase 6).

Rules: real data only, samples clearly labeled. Mobile-first. Reduced motion respected. No new dark styles.

Verification gate: tsc, lint, build, tests. Test with at least three real live flights (different aircraft categories), one unknown flight ID, one airport with METAR, and one with METAR unavailable. Screenshots at 390, 768, 1280, 1728 px with proven dimensions for every route and state. Commit, report honestly, stop. Do not start Phase 5.
```

---

## PHASE 5A — LANDING PAGE (hero and storytelling)

```
Read DESIGN_SPEC.md fully, especially sections 3, 7 and 10. Then do Phase 5A ONLY: the landing page preloader, nav, hero, and the pinned "Follow one flight" section. Plan first, wait for my approval, then execute. This is the flagship; take the time to make it exceptional.

Build at route / with Lenis smooth scroll (mounted only on this route) and GSAP + ScrollTrigger:
1. Floating pill nav: transparent until scroll, then paper with hairline. Logo wordmark, links, "Open live map" CTA.
2. Preloader (max 1.1 s, once per session, skippable, skipped entirely if assets are ready): hairline great-circle arc draws, tiny aircraft rides it, mono counter ticks to the real airborne count, wipe up to reveal the hero.
3. Hero: display-xl headline "Every flight. Right now." with roman/italic mix and masked line reveal, one-sentence subline (max 18 words, specific, no buzzwords), primary "Open the live map" CTA with arrow slide, secondary inline search that opens the real command palette with real results, mono live stat strip with ticking tabular numbers.
4. Hero background: calm, light-themed real MapLibre map with REAL live aircraft gliding as small ink silhouettes (few in signal color), non-interactive, with a slow time-based scripted camera drift between busy corridors. NOT cursor-driven and NOT scroll-driven. Edges fade into paper with a soft mask. If the live feed fails, fall back to a pre-rendered static map with subtle animated flight arcs that does not claim to be live. Cap aircraft count for performance and pause rendering when the hero is off-screen.
5. "Follow one flight" pinned section (~300vh): pins, scrubs 1:1 with scroll, one long-haul great-circle path draws across a large map, the aircraft silhouette rotates along the tangent, a side panel updates altitude, speed and distance remaining with number tickers and a self-drawing altitude profile, headline changes in three masked beats (Takeoff, Cruise, Descent), unpins cleanly. Use a real current long-haul flight if available; otherwise a clearly labeled sample route.
6. Write real, specific, confident copy for every block. No filler words like seamless, revolutionize, unleash.

Hard requirements: no cursor-reactive element anywhere; no background that jumps or lags with scroll; only transform/opacity animations; reduced-motion version designed (fades, no Lenis, no pin). First-load JS for the hero under 350 KB, LCP under 1.8 s on throttled mobile, CLS 0. Lazy-load everything below the fold.

Verification gate: tsc, lint, build, tests. Lighthouse mobile scores for /, with numbers reported. Screenshots at 390, 768, 1280, 1728 px (proven dimensions) at hero, mid-pin, and end-of-pin states. A screen recording of preloader to hero to scroll through the pin; report any jank, flash or layout shift you see. Reduced-motion run. Grep the landing code for pointermove, mousemove, cursor-based logic and show the output (must be empty for background effects). Commit, report honestly, stop. Do not start 5B.
```

---

## PHASE 5B — LANDING PAGE (remaining sections)

```
Read DESIGN_SPEC.md fully, especially section 7. Phase 5A is done. Do Phase 5B ONLY: the remaining landing sections. Plan first, wait for my approval, then execute.

1. Capabilities: asymmetric 12-column bento (NOT three equal cards) with six tiles of different sizes, each containing a real live component, not a screenshot: a mini map with moving aircraft, a rolling altitude ramp, a vertical-rate gauge, an airport board, a search with typing animation, a delay/status indicator. Hairline borders, white surface, tile lifts 2 px on hover (hover on the tile only). Pause offscreen animations.
2. Airport board: horizontal pinned scroll with a CSS-transform split-flap departures board (per-character flap, 30–50 ms stagger, no audio). Scroll advances through 4 real hub airports including one in India. Real data if available; otherwise labeled Sample.
3. Aircraft library: typographic specimen grid of the Phase 2 silhouettes with type codes, typical wingspan and range in mono; hovering an item reveals its blueprint drawing.
4. Trust and data: honest section with where data comes from, coverage, latency, limits, three real numbers where they can be computed, a small coverage map, link to /about/data.
5. Final CTA and footer: full-width Instrument Serif wordmark that rises in on enter, one "Open the live map" button, minimal footer links.
6. Section transitions and rhythm: consistent vertical spacing, no two sections using the same reveal pattern back to back, scroll progress indicator that is subtle.

Same hard requirements as 5A: nothing cursor-reactive, only transform/opacity animation, reduced motion designed, lazy loading, performance budgets. Copy must be specific and human.

Verification gate: tsc, lint, build, tests, Lighthouse mobile for / with numbers, screenshots at four widths (proven dimensions) for every section, screen recording of the full scroll, reduced-motion run, and a long-task/CLS measurement during scroll. Commit, report honestly, stop. Do not start Phase 6.
```

---

## PHASE 6 — POLISH AND QA

```
Read DESIGN_SPEC.md fully, especially sections 1, 10, 11 and 12. Then do Phase 6 ONLY. Plan first, wait for my approval, then execute.

1. Motion tuning pass: go through every animation in the app and landing page. Check easing/duration tokens are used consistently, remove anything decorative that adds no meaning, fix anything slower than the spec allows. List changes.
2. Mobile pass: every route at 360, 390, 768 px. Touch targets at least 44 px, bottom sheet behavior, safe areas, no horizontal overflow, no hover-only functionality.
3. Accessibility audit: axe-core (or equivalent) on every route with zero serious/critical issues, full keyboard walkthrough of map, palette, filters, and flight panel, focus order, visible focus, aria-live for counters (throttled), screen-reader labels for aircraft selection, contrast check of every text/background pair in the token set.
4. Performance pass: bundle analysis with a report of the top 10 largest dependencies, removal of unused dependencies, image/font optimization, Lighthouse mobile on /, /map, /flight/[id], /airport/[icao] with targets: Performance 90+ on landing and 85+ on map, Accessibility 98+, Best Practices 100, SEO 95+, CLS 0. Fix what misses, or explain each miss honestly.
5. All states: verify loading, empty, error, partial-data, offline, and rate-limited states on every route. Add a designed offline banner.
6. SEO and sharing: real metadata per route, sitemap, robots, canonical URLs, and a designed Open Graph image (light editorial style, generated statically) for the landing and a dynamic one for flight pages if feasible on free infra.
7. Cross-browser: Chromium, Firefox, and WebKit (Playwright) run of key flows: landing scroll, map pan/select, palette. Report any differences and fix them.
8. Cleanup: remove dead code, unused assets and dev-only routes from production builds (keep /dev/* only in development), finalize README sections for the design system, tokens, motion rules, data sources, and how to run tests.
9. Final grep proof that no dark theme, dotted terrain, three.js, or cursor-reactive background code remains. Paste the outputs.
10. Final self-critique: list the 10 weakest details still in the product, fix as many as you can, and list what remains.

Verification gate: everything above with evidence (tool outputs, scores, screenshots at four widths with proven dimensions). Commit, report honestly, stop.
```

---

## RESUME PROMPT (use if credits run out mid-phase)

```
Read DESIGN_SPEC.md and docs/PHASE_PROGRESS.md if it exists. My previous session stopped mid-phase. Run `git status`, `git log --oneline -10`, and `git diff --stat` to see what was completed and what was left half-done. Report the state to me in 10 lines or less, then continue the SAME phase from where it stopped without redoing finished work. Write docs/PHASE_PROGRESS.md as you go (done, in progress, remaining) and commit after every meaningful chunk so nothing is lost if credits run out again.
```

---

## Credit-saving habits
- Tell the agent in every phase: "Commit after each major chunk and update docs/PHASE_PROGRESS.md."
- Do the landing page (5A, 5B) when you have a full credit window. It is the most expensive part.
- If a phase keeps failing the same check, stop and send me the report instead of letting the agent loop.
