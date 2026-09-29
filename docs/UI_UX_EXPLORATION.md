# Aeroloom: UI/UX Strategic Redesign & Product Architecture Proposal

**Status**: Proposal & Alignment Draft  
**Author**: Lead Engineer / Technical Product Lead  
**Date**: September 28, 2026  
**Context**: Phase 0 Signature Slice verified; Wave/Terrain concept deprecated per user direction. Restarting UI/UX from zero while retaining robust backend telemetry pipelines and verified ADS-B integrations.

---

## 1. Executive Summary & Problem Framing

### 1.1 Why the Previous Wave/Terrain Direction Was Deprecated
The Phase 0 Signature Slice accomplished its technical goal (proving GPU shader integration and live ADS-B data streaming concurrently). However, from a product design and utility perspective, the animated dotted wave terrain suffered from key fundamental shortcomings:
1. **Lack of Geographic Legibility**: An undulating wavy plane abstracts away actual geography, runways, airspaces, and coastlines. Users tracking an aircraft need to know where it is relative to land, airports, and weather.
2. **Visual Gimmick vs. Tool Utility**: The wave ripple effect drew attention to the background mesh rather than the flight telemetry and operational intelligence.
3. **Information Density Friction**: Real flight tracking is an information-rich problem. A decorative 3D floor constrained the screen space available for flight lists, route elevation profiles, and search workflows.

### 1.2 Retained Core Strengths (What We Keep)
We do not discard working foundational engineering:
- **Verified ADS-B Telemetry Pipeline**: `lib/providers/positions/airplanesLive.ts` with normalization, bounds validation, and fallback mechanisms.
- **Server-Side API Route**: `/api/aircraft/live` with TTL caching protecting upstream rate limits.
- **Production-Ready Next.js 16 + React 19 + TypeScript + Tailwind Stack**: Clean build, zero lint warnings, strict typechecks.
- **Automated Test Suite**: 17 tests verifying parsing, normalization, and coordinate calculation.

---

## 2. Three Distinct UI/UX Strategic Directions

Below are three distinct, coherent design directions for Aeroloom. Each solves the flight tracking experience with a different focus, target user persona, and visual language.

```
+---------------------------------------------------------------------------------------+
|                                AEROLOOM UI/UX MATRIX                                  |
+--------------------------+----------------------------+-------------------------------+
| Direction A:             | Direction B:               | Direction C:                  |
| Precision Tactical Deck  | Spatial Vector Globe       | Modern Flight Studio          |
+--------------------------+----------------------------+-------------------------------+
| • Instrument-grade dark  | • Orthographic 3D Earth    | • Hybrid Vector/Satellite Map |
| • High data density      | • Physical 3D arcs & ribbons| • Consumer & traveler focus  |
| • Bloomberg/Garmin feel  | • Global route awareness   | • Linear/Apple Maps elegance  |
| • Command-palette first  | • Atmospheric terminator   | • Bottom sheet / Side drawer  |
+--------------------------+----------------------------+-------------------------------+
```

---

### Direction A: The Precision Tactical Deck ("Glass Cockpit")

#### Concept & Philosophy
Inspired by modern glass cockpit avionics (Garmin G3000, Collins Pro Line Fusion) and professional flight dispatch operations. Built for high data throughput, instant responsiveness, and zero visual clutter.

#### Visual Aesthetics
- **Color Palette**: Deep obsidian (`#07090e`), cold steel dividers (`#1e293b`), crisp phosphor amber (`#f59e0b`) and radar cyan (`#38bdf8`) indicators, subtle emerald status flags.
- **Typography**: Tabular monospace numbers (Geist Mono) paired with clean geometric sans (Inter / Geist Sans).
- **Map Surface**: High-contrast dark vector cartography showing sectors, waypoint intersections, airport runways, and precise aircraft vector chevrons.

#### Key Features & Layout
1. **Full-Viewport Operational Canvas**: Edge-to-edge interactive vector map with smooth GPU pan/zoom and altitude clustering.
2. **Collapsible Telemetry Drawer (Left)**: Active flight feed showing real-time callsign, altitude tape, ground speed tape, and vertical rate indicator (VSI).
3. **Command Palette (`Cmd+K`)**: Instant keyboard-driven search for flight numbers, airlines, airports (ICAO/IATA), or active hex transponders.
4. **Altitude / Climb Ribbon**: Clicking an aircraft reveals an elevation cross-section graph at the bottom, comparing cruise level against ground terrain elevation.
5. **Emergency & Alert Watchdog**: Automatic highlight ribbon for squawks 7700 (General Emergency), 7600 (Radio Failure), and 7500 (Hijack).

#### Trade-offs
- **Pros**: Highest information density; fastest for power users and aviation spotters; professional and serious feel.
- **Cons**: High initial visual density can feel complex to casual passengers looking for a simple flight status.

---

### Direction B: The Spatial Vector Earth ("Planetary Sky")

#### Concept & Philosophy
Replaces the flat wave terrain with an authentic 3D spatial globe. Instead of a decorative wave, the 3D capability is harnessed to render true great-circle flight arcs, real atmospheric altitude layers, and planetary daylight/night terminator lines.

#### Visual Aesthetics
- **Color Palette**: Pitch black deep space (`#020408`), matte slate continent vectors (`#1e293b`), illuminated flight trails, and a soft atmospheric blue glow rim (`#0284c7`).
- **3D Mechanics**: Lightweight Three.js / WebGL sphere with vector country boundaries, dynamic rotation, and smooth camera framing (`flyTo`) when locking onto an aircraft.
- **Altitude Realism**: Flight paths rise out of origin airports, arc through the stratosphere at accurate proportional elevations, and descend to destination runways.

#### Key Features & Layout
1. **Interactive 3D Earth**: Smooth inertia rotation, pinch-to-zoom from regional airports out to transoceanic view.
2. **Day / Night Solar Terminator**: Visualizes real-time solar illumination across the globe, showing night flights traversing the shadow line.
3. **Flight Trajectory Ribbons**: 3D spatial arcs colored by altitude (e.g. green for climb, cyan for cruise at FL360+, amber for descent).
4. **Slide-Over Aircraft Dossier**: Right-hand glass panel showing aircraft model, operator, live telemetry, and origin/destination coordinates.

#### Trade-offs
- **Pros**: Visually stunning and scientifically coherent; leverages the installed Three.js/R3F engine with actual geographic meaning; unmatched for long-haul tracking.
- **Cons**: Regional tracking (e.g. airport taxiways or close formation flying) requires deep zoom where 2D flat projections are traditionally clearer.

---

### Direction C: The Modern Flight Studio ("Clean Consumer Pro")

#### Concept & Philosophy
The refined, minimalist evolution of Flightradar24 and FlightAware. It prioritizes clarity, rapid search, clean card hierarchies, and passenger-friendly journey tracking with the polish of Apple Maps and Linear.

#### Visual Aesthetics
- **Color Palette**: Refined dark mode (deep charcoal `#0a0d14`), clean slate cards, crisp typography with generous white space, subtle frosted glass blurs (`backdrop-blur-md`).
- **Map Surface**: Smooth multi-layer vector map with toggleable satellite imagery, terrain contours, and real-time precipitation/weather radar overlays.

#### Key Features & Layout
1. **Interactive Map with Smart Clustering**: Aircraft group into density clusters when zoomed out, expanding into crisp branded chevrons as the user zooms into a sector.
2. **Unified Search & Filter Bar**: Floating top bar supporting "Search any flight, airline, or route (e.g., SFO -> JFK)", with quick pills: *Commercial*, *Cargo*, *Military*, *High Altitude*.
3. **Contextual Flight Bottom Sheet / Modal**: Displays scheduled vs. actual departure/arrival times, estimated time en route (ETE), gate/terminal data, and progress bar along route.
4. **Zero-Friction Mobile Experience**: Fluid responsive gestures, native bottom drawer sheet, and zero keyboard traps.

#### Trade-offs
- **Pros**: Most universally accessible; beautiful for both casual travelers and enthusiasts; clean, fast, and easy to navigate.
- **Cons**: Less differentiated if styled too similarly to existing commercial flight apps.

---

## 3. Recommended Design Direction: Hybrid Tactical Studio (A + C)

### The Vision
We recommend a synthesized **"Tactical Studio"** direction that combines the **precision, tabular telemetry, and speed of Direction A** with the **clean typography, modern layout, and accessibility of Direction C**:

1. **Map-First Architecture**: An edge-to-edge interactive vector map powered by MapLibre GL / Canvas, with custom dark aviation styling (runway outlines, airspace boundaries, navigation fixes).
2. **Floating Tactical Telemetry Deck**:
   - **Top Navigation Bar**: Aeroloom brand, global active flight counter, live ADS-B status pill, and instant Command Search.
   - **Left Telemetry Feed**: Real-time stream of flights within the active viewport, sortable by altitude, speed, or distance.
   - **Selected Flight Inspection Card**: Floating bottom-right or docked right drawer detailing active callsign, ICAO hex, registration, true altitude with climb/descent tape, ground speed, and heading compass rose.
3. **Live Sector Scopes**: Ability to switch active observation sectors (e.g., KSFO Bay Area, KJFK New York Metro, EGLL London, or user's current geo-bounds) seamlessly.

---

## 4. Proposed Phased Roadmap

| Phase | Milestone | Deliverables |
| :--- | :--- | :--- |
| **Phase 1** | **Tactical Map & Telemetry Deck** | • Integrate full-screen vector map surface.<br>• Wire live `/api/aircraft/live` feed to dynamic map markers.<br>• Build Tactical Telemetry Deck (Flight list, aircraft selection, altitude/speed tapes).<br>• Implement Command Search (`Cmd+K`) by callsign/hex. |
| **Phase 2** | **Spatial Flight Paths & History** | • Render historic trail breadcrumbs and projected heading vectors.<br>• Flight details modal with route endpoints and aircraft metadata.<br>• Regional sector presets (Major international aviation hubs). |
| **Phase 3** | **Aviation Intelligence & Alerts** | • Squawk 7700/7600 emergency detection and alerts.<br>• Weather / METAR overlay integration.<br>• Multi-provider federation (airplanes.live registered feeder + open ADS-B). |

---

## 5. Decision Points for User Alignment

To proceed with maximum alignment, please consider the following design choices:

1. **Map Engine Choice**:
   - **Option 1 (Recommended)**: Vector Map Engine (MapLibre GL / Canvas vector tiles) — Ultra-crisp geographic detail, airport taxiways, fast 60fps panning.
   - **Option 2**: 3D Vector Globe (Three.js/R3F Earth) — True spherical Earth with 3D flight arcs and day/night terminator.
2. **Interface Density**:
   - **Tactical High-Density** (compact monospace tables, altitude/VSI tapes, professional dispatch console feel).
   - **Clean Studio** (spacious cards, softer typography, traveler-centric progress bars).
