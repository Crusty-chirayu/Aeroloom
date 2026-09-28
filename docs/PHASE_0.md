# Aeroloom Phase 0: Signature Slice Checklist

Authoritative Blueprint: Flight-Tracker Implementation Blueprint v2 (Phase 0)

## Objectives
Build the smallest real working prototype combining:
1. Real GLSL-based cursor-reactive dotted terrain using React Three Fiber and Three.js.
2. At least one genuinely live aircraft position fetched from airplanes.live and rendered as a labeled point in that same 3D scene.

---

## Tasks & Progress

- [x] **Task 0.1 — Scaffold**
  - [x] Set up Next.js App Router, TypeScript, Tailwind CSS, development server
  - [x] Establish feature branch `feat/phase0-signature-slice`
  - [x] Clean minimal prototype layout and structure
  - [x] Add automated test runner configuration
  - [x] Verify `npm run dev` and `npm run build`

- [x] **Task 0.2 — R3F Terrain**
  - [x] Implement `components/hero/Terrain.tsx`
  - [x] Render grid-laid dotted terrain using Three.js Points buffer / InstancedMesh
  - [x] Point count configurable by device tier (Full: 8,000–10,000 [9,600], Reduced: 2,000–2,500 [2,400])
  - [x] Ensure efficient GPU rendering without per-frame React state churn
  - [x] Verify rendering in browser without console errors

- [x] **Task 0.3 — Real Cursor-Displacement Shader**
  - [x] Implement vertex shader in `components/hero/terrain.vert.glsl`
  - [x] Implement fragment shader in `components/hero/terrain.frag.glsl`
  - [x] Shader uniforms: `u_cursor` (vec3), `u_time` (float), `u_intensity` (float)
  - [x] Smooth damped cursor movement settling in ~300–600ms
  - [x] In-scene GPU evaluation via `useFrame` uniform updates
  - [x] FPS / performance debug overlay with toggle for screenshots
  - [x] Real pointer interaction tested in browser

- [x] **Task 0.4 — Device Tiers and Fallbacks**
  - [x] Implement `lib/deviceTier.ts` (Full, Reduced, Static tiers)
  - [x] Tier detection: `hardwareConcurrency >= 8` + FPS probe >= 50 FPS for Full (with bloom); Reduced without bloom; Static fallback for context loss or low FPS (< 20)
  - [x] Manual tier override support for testing (`?tier=full|reduced|static` and HUD interactive selector)
  - [x] Graceful WebGL context loss handling (page and UI remain fully usable)
  - [x] Avoid mapping touch events to synthetic cursor movements
  - [x] Test all three tiers and fallback states via browser subagent

- [x] **Task 0.5 — Real Aircraft Provider**
  - [x] Implement `lib/providers/positions/airplanesLive.ts` adapter
  - [x] Connect to public airplanes.live bounding box / point endpoint with ADS-B bridge
  - [x] Type definition: `AircraftPosition` with callsign, lat, lon, alt, heading, speed, timestamp
  - [x] Server-side route handler (`/api/aircraft/live`) to keep requests server-side and avoid client credential exposure
  - [x] Error handling, timeout handling, malformed response resilience
  - [x] Record 10 consecutive real API calls with timestamps, status, and aircraft count (saved to `docs/evidence_api_calls.json`)
  - [x] Unit tests for data normalization and malformed fixtures

- [x] **Task 0.6 — Real Aircraft in the Same Scene**
  - [x] Implement `components/hero/LiveAircraftPing.tsx`
  - [x] Render live aircraft inside the 3D terrain scene
  - [x] Documented decorative coordinate projection from geographic coordinates to 3D space (`lib/projection.ts`)
  - [x] Label with callsign/identifier, altitude, and live status indicator
  - [x] Periodic refresh respecting provider limits (8s interval with server caching)
  - [x] Graceful handling of zero aircraft, missing fields, network drops
  - [x] Browser verification of combined scene

- [x] **Verification & Definition of Done**
  - [x] Build and lint pass without warnings or errors
  - [x] Unit tests pass (17/17)
  - [x] Browser verification and FPS measurement recorded (52–60 FPS)
  - [x] Commit each task with conventional commit message
  - [x] Push to `feat/phase0-signature-slice`
  - [x] Create `docs/PHASE_0_REPORT.md`
  - [x] Tag `v0.1-phase0` once all criteria are met
