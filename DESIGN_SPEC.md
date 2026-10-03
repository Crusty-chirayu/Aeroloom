# MASTER PROMPT — Flight-Tracker Complete Redesign

Paste this whole file as the first message (or save it in the repo as `DESIGN_SPEC.md` and tell the agent: "Read DESIGN_SPEC.md fully before doing anything, and re-read the relevant section before every phase"). Then run ONE phase per task using the phase prompts at the bottom.

---

## 0. ROLE AND MISSION

You are a principal-level product engineer and design engineer with a decade of experience shipping award-level web products (think Awwwards SOTD, Linear, Vercel, Stripe, Apple, Flighty, Arc-level craft). You are redesigning and rebuilding the entire UI of an existing project: a real-time flight tracking platform (working name: **Aeroloom**; use this name unless the codebase already has a better one).

The existing UI is being **thrown away completely**. It is dark, heavy, and looks like a template. Rebuild every visual surface from scratch: landing page, live map page, aircraft markers and aircraft artwork, flight detail, airport page, search, navigation, icons, motion, empty/loading/error states, mobile.

The result must feel like it was hand-built by an obsessive senior developer. It must not look AI-generated, template-derived, or "vibe coded". If a choice looks like something a generator would produce by default, choose differently.

Quality bar: every pixel intentional, every animation purposeful, every interaction instant. Be slow and careful rather than fast and sloppy. Cost and time are not constraints. Correctness and craft are.

---

## 1. HARD RULES (violating any of these is a failure)

**Removed forever — delete the code, not just hide it:**
1. The dark theme. No dark backgrounds anywhere as the base look. No dark mode toggle in v1. Light only.
2. The dotted-grid 3D terrain / ground plane.
3. Any layer, background, or object that reacts to mouse movement or cursor position: ripples, displacement, parallax tied to cursor, tilt-on-mouse, magnetic cursor backgrounds, cursor glow trails on backgrounds. Also delete the Three.js/R3F code that powered it if nothing else uses it.
4. Scroll-jacking that fights the user's scroll, and any background that "jumps", jitters, or lags behind scroll. Scroll must feel native and smooth.

**Never do (generic-AI tells):**
- Purple/blue gradient blobs, gradient text on headlines, glassmorphism cards stacked on gradients, neon glows.
- Three identical feature cards with an icon in a colored circle.
- Emoji used as icons. Stock illustration packs. Lorem ipsum. "Welcome to…" / "Unleash the power of…" / "Seamless" / "Revolutionize" copy.
- Default shadcn/ui look. shadcn is allowed only as an accessibility/behavior layer; every component must be restyled to this spec.
- Drop shadows that are big, blurry, and grey. Use the shadow tokens below only.
- Fake data presented as real. If data is unavailable, show an honest empty/unknown state. Any demo/sample data must be clearly labelled "Sample" in the UI.
- Layout shift, flash of unstyled content, flash of wrong theme, janky reflow on load.

**Always do:**
- TypeScript strict mode, zero `any` without a comment justifying it, zero console errors/warnings in production build.
- Animate only `transform`, `opacity`, and (sparingly) `clip-path`/`filter` on small elements. Never animate layout properties (`width`, `height`, `top`, `left`, `margin`).
- Respect `prefers-reduced-motion` everywhere with a designed reduced alternative (fades/instant states), not just "turn it off".
- Full keyboard access, visible focus rings, semantic HTML, ARIA where needed, WCAG AA contrast minimum.
- Mobile-first responsive at 360, 390, 768, 1024, 1280, 1440, 1728 px widths and up to 2560.

---

## 2. STACK (keep what exists if it's already good; otherwise use this)

- Next.js (App Router) + TypeScript strict, React Server Components where sensible.
- Tailwind CSS v4 with design tokens defined as CSS variables in one `tokens.css` file. No arbitrary magic numbers in components; use tokens.
- Radix primitives (via shadcn/ui) for dialog, popover, tooltip, dropdown, tabs, command palette (`cmdk`). Fully restyled.
- Motion: **GSAP + ScrollTrigger** for landing page choreography, **Lenis** for smooth scroll (landing page only, disabled inside the map/app), **Motion (framer-motion)** for app UI transitions and layout animations.
- Map: **MapLibre GL JS** (2D). Keep the architecture extensible so a globe projection can be added later. No Mapbox token dependency.
- Aircraft rendering on the map: WebGL via MapLibre symbol layers with a generated sprite atlas (or a custom layer if needed for smooth interpolation). Must handle 5,000+ aircraft at 60 fps.
- Charts: hand-built SVG/canvas sparklines and altitude profiles (no default chart-library look).
- Data/back end: Next.js route handlers, Redis (Upstash free tier) for caching/rate-limit shielding, Supabase Postgres for later phases. Keep infra cost near $0.
- Icons: see section 6.

**Before writing any code (Phase 0), audit the repo.** List what exists, what is worth keeping (working backend/data code), and what will be deleted. Do not delete working data-fetching logic without replacing it. Produce this audit as an artifact/plan and proceed.

---

## 3. DESIGN LANGUAGE — "Editorial Aviation"

Concept: an airline-timetable / aeronautical-chart sensibility rendered with modern precision. Warm paper backgrounds, ink-black typography, hairline rules, one confident signal color, and beautiful monospaced data. Calm, bright, confident, expensive. Think Swiss timetable meets flight deck instrument, not sci-fi HUD.

### 3.1 Color tokens (light only)

```css
:root {
  /* surfaces */
  --paper:        #F6F4EF;  /* page background, warm off-white */
  --paper-2:      #EFECE4;  /* recessed areas */
  --surface:      #FFFFFF;  /* cards, panels */
  --surface-2:    #FBFAF7;  /* hover/secondary surface */
  /* ink */
  --ink:          #0E1116;  /* primary text */
  --ink-2:        #3B4250;  /* secondary text */
  --ink-3:        #6E7686;  /* tertiary/meta text (AA on paper) */
  --ink-4:        #A3A9B5;  /* disabled/placeholder */
  /* lines */
  --line:         rgba(14,17,22,0.08);
  --line-strong:  rgba(14,17,22,0.16);
  /* brand signal */
  --signal:       #FF4F1F;  /* vermilion: primary accent, selected aircraft, CTAs */
  --signal-ink:   #C93A10;  /* accent text on light */
  --signal-wash:  #FFE9E1;  /* accent tint backgrounds */
  /* secondary: altitude/sky */
  --sky:          #2B62F0;
  --sky-wash:     #E6EDFF;
  /* status */
  --ok:           #1F9D6B;
  --warn:         #E8A317;
  --bad:          #D64545;
  /* altitude ramp for trails/markers (low → high) */
  --alt-0: #FF4F1F; --alt-1: #F5A524; --alt-2: #7BC96F; --alt-3: #2FB7C9; --alt-4: #2B62F0; --alt-5: #6B3FD1;
}
```
Use `--signal` sparingly: one dominant accent moment per screen. The overall look is ~85% neutral.

### 3.2 Typography

Load via `next/font` with `display: swap`, subsetted, preloaded, zero layout shift.
- **Display:** Instrument Serif (regular + italic) for hero and section headlines. Mix roman and italic words inside one headline for editorial rhythm.
- **UI/Body:** Geist Sans (or Inter Tight if Geist is unavailable).
- **Data/Mono:** Geist Mono (or JetBrains Mono) with `font-variant-numeric: tabular-nums` for every number that can change.

Scale (fluid with `clamp()`): display-xl 96–200px / line-height 0.92 / letter-spacing −0.03em; display-l 64–112; h1 40–56; h2 28–36; body 16/1.55; small 14; micro 12 mono uppercase tracking +0.06em for labels. Max line length 62ch for prose.

### 3.3 Spacing, radius, shadow, borders
- 4px base unit; layout on an 8pt rhythm. Page max-width 1360px, side gutters clamp(20px, 4vw, 64px).
- Radius: `--r-sm 8px`, `--r-md 14px`, `--r-lg 22px`, `--r-pill 999px`. Map panels use `--r-lg`.
- Borders are 1px hairlines (`--line`). Prefer lines over shadows to separate content.
- Shadows (only these): `--sh-1: 0 1px 0 rgba(14,17,22,.04), 0 1px 2px rgba(14,17,22,.06)`; `--sh-2: 0 1px 0 rgba(14,17,22,.04), 0 8px 24px -8px rgba(14,17,22,.14)`; `--sh-3: 0 24px 64px -24px rgba(14,17,22,.28)` (floating panels only).
- Subtle paper grain: a single 3% opacity static noise texture on `--paper`, pre-rendered PNG/SVG, **not animated**, not reactive.

### 3.4 Motion principles
- Easing tokens: `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` (default entrances), `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)` (transitions), `--ease-spring` via Motion spring `{stiffness: 260, damping: 30}` for panels.
- Durations: micro 120–180ms, UI 240–360ms, section reveals 700–1100ms, hero choreography up to 1800ms total. Nothing decorative is slower than 1.2s.
- Stagger: 40–70ms between siblings. Headlines reveal by line with mask (`overflow: clip` wrapper, text translates from 105% → 0). Never fade-in-up-everything.
- Every hover/press has feedback within 100ms. Buttons: press scale 0.98, 120ms.
- Motion tells a story: aircraft move, lines draw, numbers count. Things don't wiggle for decoration.
- Scroll-linked animation is allowed on the landing page **only** for storytelling (pinned sections, path drawing, number tickers). It must be scrubbed 1:1 with scroll, never lag, and never move a full-page background.

---

## 4. INFORMATION ARCHITECTURE

Routes:
- `/` Landing
- `/map` Live map (the core product surface)
- `/flight/[id]` Flight detail (also opens as a side panel on `/map`)
- `/airport/[icao]` Airport page
- `/search` (also ⌘K command palette everywhere)
- `/about/data` Data sources & coverage (honest transparency page)
- 404, 500, offline states, all designed.

Auth, saved flights, notifications, AI features, history: **out of scope for v1**, but leave clean seams (empty nav slot, typed interfaces) so they slot in later.

Global chrome:
- Landing: floating pill nav (logo, links, "Open live map" CTA). Transparent until scroll, then paper-colored with hairline.
- App (`/map`, `/flight`, `/airport`): slim 64px left rail with icon buttons + tooltips (Map, Search, Airports, Data), top-center command bar trigger ("Search flights, airports, routes ⌘K"), and no heavy header.

---

## 5. DATA LAYER (must be real, not mocked)

Build a **provider adapter interface** so sources are swappable:

```ts
interface FlightProvider {
  getAircraftInBounds(b: Bounds): Promise<AircraftState[]>;
  getAircraftByCallsign(q: string): Promise<AircraftState | null>;
  getTrack(id: string): Promise<TrackPoint[]>;
}
```

Candidate free sources (verify current terms, rate limits, and commercial-use rules yourself before choosing, and record the decision in `docs/data-sources.md`): OpenSky Network, adsb.lol, airplanes.live for live positions; aviationweather.gov for METAR/TAF; a schedule/route source only if a genuinely free tier exists.

Rules:
- All provider calls go through server route handlers, never from the browser. Cache in Redis with short TTLs (2–10 s for positions) and request-coalesce so 1,000 viewers cost one upstream call.
- Fetch by viewport bounds. Debounce map movement (250 ms), abort in-flight requests on new ones.
- Normalize into one `AircraftState` type: `id (icao24), callsign, registration?, typeCode?, lat, lon, altitudeFt, groundSpeedKt, trackDeg, verticalRateFpm, onGround, squawk?, updatedAt, source`.
- **Client-side interpolation:** between updates, dead-reckon each aircraft along its track at its ground speed in a `requestAnimationFrame` loop so aircraft glide continuously instead of teleporting every few seconds. When a fresh update arrives, ease the correction over ~600 ms (no snapping).
- Stale handling: aircraft not updated for >60 s fade to 40% opacity; >180 s removed.
- Honest UI: if the source doesn't provide schedules, origin/destination, or aircraft age, **do not invent them**. Show only what's real. Design the detail page so it still looks complete with partial data (fields collapse gracefully, no "N/A" walls).
- Error/rate-limit states: the map keeps showing last-known data with a small "Live feed delayed" chip, then recovers silently.

---

## 6. ICONS AND AIRCRAFT ARTWORK

### 6.1 UI icons
One consistent family: Phosphor (Light weight) or Lucide at 1.5px stroke on a 24px grid, plus **custom-drawn aviation icons** in the identical stroke style: takeoff, landing, runway, tower, altitude, vertical-rate up/down, heading/compass, squawk, gate, delay, route-arc, layers, filter. Ship all as a typed `<Icon name="…" />` component from a single SVG sprite. No mixed styles, no emoji, no filled/outlined mixing.

### 6.2 Aircraft silhouettes ("proper aircraft")
Hand-craft a set of clean, accurate **top-down SVG silhouettes**, each drawn on a 64×64 grid with correct proportions (wingspan-to-length, sweep, engine count/placement, tail):
- Narrowbody (A320/B737 family), Widebody twin (B787/A350/B777), Quad (A380/B747), Regional jet (E175/CRJ), Turboprop (ATR/Dash 8), Business jet, Light GA (C172-style), Helicopter (with rotor disc), Cargo/freighter, Military/other (neutral), Unknown (neutral simple dart).
- Map ICAO type codes → silhouette through a lookup table with a sensible fallback by size/engine category. Unit-test the mapping.
- Each silhouette has: `default`, `selected` (signal color + 2px white outline), `hover` (scale 1.15), `stale` (40% opacity), `on-ground` (smaller, ink-3) states, generated into the map sprite atlas at 1x/2x/3x DPR.
- Rotation follows `trackDeg`. A soft ground shadow (same silhouette, 12% ink, offset proportional to altitude, up to 10px down-right) sells altitude. Static offset direction, not cursor-dependent.
- On the flight detail page, render a large **technical blueprint illustration** of the aircraft type: thin ink linework, top view + side view + front view, dimension callouts in mono type, subtle draw-in animation on load (stroke-dashoffset). If a specific type is missing, use the closest category blueprint and label it accordingly.
- Optional, only if a properly licensed high-quality glTF exists: a single non-reactive 3D aircraft on the detail page with a slow turntable. Otherwise skip. Do not ship low-quality 3D.

---

## 7. LANDING PAGE — the flagship

Goal: the best landing page someone has seen. Bright, editorial, typographic, cinematic through **choreography and real data**, not through a dark 3D playground.

Use Lenis smooth scroll + GSAP ScrollTrigger. Total page weight budget: <350 KB JS on first load for the hero (lazy-load below the fold), LCP < 1.8 s on a mid phone over 4G, CLS = 0.

### Section 0 — Preloader (max 1.1 s, skippable, shown once per session)
Paper background. A single hairline great-circle arc draws left to right; a tiny aircraft silhouette rides it; a mono counter ticks to the real live-aircraft count; wipe up to reveal the hero. If assets are already ready, skip entirely (never delay a fast load for the sake of the animation).

### Section 1 — Hero
- Headline (display-xl, mixed roman/italic): **"Every flight. *Right now.*"** Line-masked reveal, 90 ms stagger. Subline (one sentence, max 18 words, plain and specific, no buzzwords).
- Primary CTA "Open the live map" (ink pill, arrow that slides on hover) and a secondary inline **search field** ("Try AI 101, BLR, or Lufthansa") that opens the real command palette with real results.
- Background: a **calm, light-themed, real MapLibre map** of the world, non-interactive on the hero, with **real live aircraft** gliding across it as small ink silhouettes and a few signal-colored ones. The camera performs a slow, scripted, time-based drift (not cursor, not scroll) between busy corridors (North Atlantic, Europe, India–Gulf, East Asia). Edges fade into paper with a soft mask. If the feed is unavailable, fall back to a beautiful static pre-rendered map image with subtle animated flight arcs, clearly not claiming to be live.
- Live stat strip under the headline in mono: `12,481 aircraft airborne · 187 countries · updated 3 s ago`, numbers tick with tabular figures.
- No mouse-reactive anything.

### Section 2 — "Follow one flight" (pinned storytelling, ~300vh)
The section pins. On scrub, one long-haul route (real current flight if available, else a clearly labeled sample) draws along a great-circle arc across a large map; the aircraft silhouette rotates along the tangent; a side panel updates altitude, speed, distance remaining with number tickers and a mini altitude profile that draws itself. Headline copy changes in 3 beats (Takeoff → Cruise → Descent) with masked line transitions. Unpins cleanly.

### Section 3 — Capabilities (asymmetric bento, not 3 equal cards)
Six tiles of varying sizes on a 12-col grid, each containing a **real live component** (not a screenshot): a mini map with moving aircraft, a rolling altitude ramp, a vertical-rate gauge, an airport board, a search with typing animation, a delay indicator. Tiles lift 2px and reveal detail on hover (hover on the tile only). Hairline borders, `--surface` fill, generous padding.

### Section 4 — Airport board (horizontal pinned scroll)
A split-flap departures board built in CSS/transform (each character a flap with a mechanical flip, 30–50 ms stagger, tasteful sound OFF, no audio). Scroll advances through 4 airports (use real busy hubs including one in India). Numbers and destinations flip as you scroll. Data real if available, otherwise labeled Sample.

### Section 5 — The aircraft library
A typographic specimen page: the custom silhouettes set in a precise grid with type codes, wingspan, and typical range in mono. Hover on an aircraft reveals its blueprint line-drawing (hover on the item itself is fine). This is where the custom artwork gets to shine.

### Section 6 — Trust & data
Honest section: where data comes from, coverage, latency, limits. Three numbers, a small coverage map, link to `/about/data`. Calm tone.

### Section 7 — Final CTA + footer
Giant wordmark in Instrument Serif filling the width, a single "Open the live map" button, minimal footer links. Wordmark letters rise in on enter.

Landing copy rules: specific, short, confident, human. No filler. Write real copy for every block.

---

## 8. MAP PAGE — the core product

Full-viewport MapLibre map, light custom style (build a restrained style JSON: paper land, soft pale-blue water `#DCE6F0`, hairline borders, muted labels in Geist; use a free vector tile source such as OpenFreeMap or another with permissive terms; attribution present and tasteful). Roads/POIs minimized; airports and country/city labels emphasized.

**Aircraft layer:** silhouettes per section 6, rotated by track, interpolated at 60 fps, colored by a user-selectable scheme: *Solid ink (default) / By altitude (ramp) / By speed*. Selected aircraft = signal color + pulsing ring (one ring, 2 s loop, opacity only) + label.

**Interactions:**
- Hover: small floating tag (callsign, type, altitude) within 50 ms.
- Click: right-side flight panel slides in (desktop, 420px, `--sh-3`), or draggable bottom sheet with 3 snap points (mobile). Map re-centers with easeTo, padding compensated for the panel.
- Selected flight shows: completed track as a gradient polyline by altitude, projected route as dashed great-circle arc, aircraft blueprint thumbnail, live stats (altitude, ground speed, vertical rate with up/down glyph, heading with mini compass, squawk), altitude+speed sparklines from track history, aircraft details available from data, and links to origin/destination airports.
- Filters (top-left, collapsible chip bar): altitude range slider, aircraft category, speed, on-ground toggle, airline/callsign prefix. Filters animate results with opacity, not layout.
- Layers menu: day/night terminator (subtle), airports, optional precipitation radar (RainViewer free tiles), labels density.
- Search: ⌘K palette with instant local results + server results, grouped (Flights / Airports / Airlines), keyboard navigable, recent searches.
- Keyboard: `/` or ⌘K search, `F` follow selected, `Esc` deselect, `+`/`−` zoom, `L` layers.
- "Follow" mode: camera locks to selected aircraft smoothly; breaking manually pans exits follow.
- Density handling: at world zoom, render a soft density heat layer + sparse silhouettes; fade in full silhouettes as you zoom. Never a wall of overlapping icons.
- URL is the state: `/map?lat=…&lng=…&z=…&flight=…` shareable and restored on load.
- Empty state (no aircraft in view), loading (skeleton shimmer on panels only, never blocking the map), and error states all designed.

Performance: 60 fps pan/zoom with 5,000 aircraft on a mid laptop; no main-thread long tasks >50 ms during interaction; interpolation loop runs in one rAF, batched GeoJSON/typed-array updates, no per-aircraft React components.

---

## 9. FLIGHT AND AIRPORT PAGES

**`/flight/[id]`:** editorial layout. Big route header in display type (BLR → LHR style with city names when known), a progress line with the aircraft silhouette positioned at real progress, stat grid in mono, the aircraft blueprint illustration, altitude/speed profile (hand-built SVG, draw-in on view), embedded mini-map with the track, honest "data from" footnote. Gracefully handles partial data.

**`/airport/[icao]`:** header with name/codes, live METAR decoded into plain language with wind arrow and flight-category chip (VFR/MVFR/IFR/LIFR using status colors), map of nearby aircraft, departures/arrivals boards (real data only; otherwise show "aircraft near this airport" list), local time.

---

## 10. STATES, ACCESSIBILITY, PERFORMANCE

- Skeletons match final layout exactly. Every list, panel, and page has loading, empty, error, and partial-data states.
- Focus rings: 2px `--signal` offset 2px. All interactive elements ≥44px touch target on mobile.
- Screen-reader labels for aircraft selection and live counters (`aria-live="polite"`, throttled to avoid spam).
- Reduced motion: replace choreography with simple 200 ms fades; disable Lenis, map camera drift, and interpolation easing (still show positions).
- Lighthouse targets (mobile): Performance ≥ 90 on landing, ≥ 85 on map; Accessibility ≥ 98; Best Practices 100; SEO ≥ 95. CLS 0.
- Images: AVIF/WebP, sized, lazy below the fold. Fonts subsetted. No unused dependencies. Bundle analyzed and reported.
- SEO: real metadata, Open Graph image designed in this style, sitemap, robots.

---

## 11. WORKFLOW — HOW YOU MUST WORK

1. Work in **phases**. After each phase, stop and produce a report artifact. Do not start the next phase until told to.
2. Before each phase, write a short implementation plan (files to create/delete, risks). Then execute.
3. **Verification gate at the end of every phase (required, not optional):**
   - `tsc --noEmit`, lint, and a production build must pass with zero errors and zero warnings.
   - Use the browser to load every changed route and take screenshots at 390, 768, 1280, and 1728 px widths. Inspect them yourself; fix visible flaws (misalignment, clipping, overflow, weak hierarchy, awkward spacing) before reporting.
   - Record a short screen capture of the key animation(s) and check for jank, flashes, and layout shift.
   - Test with reduced-motion enabled.
   - Run Lighthouse on changed routes and report scores.
   - List anything unfinished or uncertain honestly. Do not claim something works unless you verified it.
4. Do not silently substitute a simpler approach when something is hard. If you must deviate, state it in the report with the reason and the trade-off.
5. Commit in small, meaningful commits with clear messages.
6. If a requirement is ambiguous, choose the option that best serves the goal ("world-class, honest, fast") and note the decision; ask only if it blocks progress.

### Phases
- **Phase 0 — Audit & foundations:** audit repo, delete old UI + dark theme + reactive terrain code, set up tokens, fonts, Tailwind, icon sprite system, motion utilities, base components (Button, Chip, Input, Panel, Tooltip, Tabs, Command palette, Skeleton) restyled to spec, a `/dev/kit` page showing all of them.
- **Phase 1 — Data layer:** provider adapter, route handlers, Redis caching, normalization, types, tests, `docs/data-sources.md`.
- **Phase 2 — Aircraft system:** silhouettes, sprite atlas, type mapping + tests, blueprint illustrations, `/dev/aircraft` specimen page.
- **Phase 3 — Map page:** map style, aircraft layer with interpolation, selection, flight panel/sheet, filters, layers, URL state, search palette.
- **Phase 4 — Flight & airport pages.**
- **Phase 5 — Landing page:** every section in section 7, with real data wiring and fallbacks.
- **Phase 6 — Polish & QA:** motion tuning pass, mobile pass, a11y audit, performance pass, empty/error states, 404/500, OG images, final cross-browser check (Chromium, Safari/WebKit behavior, Firefox), cleanup.

---

## 12. DEFINITION OF DONE

- Zero remnants of the dark theme, dotted terrain, or cursor-reactive effects (grep for them and show the result).
- Every route responsive, accessible, fast, and visually consistent with sections 3 and 6.
- Real live data flowing end to end with honest fallbacks.
- No console errors, no layout shift, no jank in the recorded captures.
- A short `README` section documenting the design system, tokens, motion rules, and data sources.
- A final self-critique: you list the 10 weakest details still in the product and fix as many as you can.

Now begin with **Phase 0** only. Produce the audit and plan first.
