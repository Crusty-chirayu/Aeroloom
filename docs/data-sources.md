# Aeroloom — Data Sources & Upstream Attribution Register

This document registers every third-party data provider, telemetry stream, and tile service integrated into Aeroloom, including verified endpoints, licensing terms, rate limits, commercial usage rights, and required UI attributions.

---

## 1. Live Flight Telemetry: airplanes.live

| Property | Detail |
|---|---|
| **Primary URL** | `https://api.airplanes.live/v2/` |
| **Active Endpoints** | `/point/{lat}/{lon}/{radius}` (spatial queries), `/hex/{hex}` (aircraft telemetry & history), `/callsign/{callsign}` (flight search) |
| **Function in Aeroloom** | Primary live ADS-B telemetry provider for airborne and ground positions, ground speed, track, barometric altitude, and squawk. |
| **Rate Limits** | Fair-use public tier. Recommends ≥2–5 second polling intervals per client. Exceeded thresholds return `contact@airplanes.live` challenge. |
| **Server Mitigation** | Aeroloom employs an Upstash Redis/Memory 5-second cache, request coalescing (collapsing simultaneous bounds requests into 1 upstream call), and bounds quantization to minimize upstream load. |
| **Terms & Licensing** | Volunteer-operated ADS-B feeder collective. Free for open-source, non-commercial, personal, and research applications. High-volume commercial usage requires a dedicated feeder or contractual agreement. |
| **Commercial Use** | **Restricted / Clarification Required**: Free for community/non-commercial tiers. Commercial deployment requires prior written consent or hosting private receiver nodes. |
| **Required Attribution** | "Flight data courtesy of airplanes.live community feeders." Rendered on `/about/data` and product footnotes. |

---

## 2. Live Flight Telemetry Failover: adsb.lol

| Property | Detail |
|---|---|
| **Primary URL** | `https://api.adsb.lol/v2/` |
| **Active Endpoints** | `/point/{lat}/{lon}/{radius}`, `/hex/{hex}`, `/callsign/{callsign}` |
| **Function in Aeroloom** | Automated secondary failover provider in `ChainedFlightProvider`. Engaged if `airplanes.live` returns HTTP 5xx, network timeout, or rate-limit challenge. |
| **Rate Limits** | Community fair use. Server-side caching (5 s TTL) and coalescing strictly applied. |
| **Terms & Licensing** | Open-source community ADS-B aggregation network. Dedicated to unencumbered open aviation data. |
| **Commercial Use** | Permissible under fair-use guidelines for community and educational applications. Commercial reselling requires running feeder infrastructure. |
| **Required Attribution** | "ADS-B telemetry aggregated via adsb.lol open collective." |

---

## 3. Aviation Meteorological Data: aviationweather.gov (NOAA / NWS)

| Property | Detail |
|---|---|
| **Primary URL** | `https://aviationweather.gov/api/data/` |
| **Active Endpoints** | `/metar?ids={icao}&format=json` |
| **Function in Aeroloom** | Official aviation weather observations (METAR), wind velocity, cloud ceiling, barometric altimeter, temperature, and flight category (VFR / MVFR / IFR / LIFR). |
| **Rate Limits** | Public US government service. No authentication token required. Cached at 60 seconds per station on Aeroloom servers (routine METARs issue hourly or half-hourly). |
| **Terms & Licensing** | **Public Domain** (US Federal Government work under 17 U.S.C. § 105). |
| **Commercial Use** | **Unrestricted / Fully Permitted**: Open for worldwide commercial and non-commercial utilization without licensing fees. |
| **Required Attribution** | "Aviation meteorological observations provided by NOAA / National Weather Service." |

---

## 4. Basemap Cartography: OpenFreeMap & OpenStreetMap

| Property | Detail |
|---|---|
| **Primary URL** | `https://tiles.openfreemap.org` / `https://demotiles.maplibre.org` |
| **Function in Aeroloom** | Clean, light-themed vector basemap tiles rendered via MapLibre GL JS without vendor lock-in or proprietary tokens. |
| **Rate Limits** | Free public hosting tier funded by community sponsors. Zero API keys. |
| **Terms & Licensing** | Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), licensed under the Open Database License (ODbL). |
| **Commercial Use** | **Permitted** under ODbL compliance (proper copyright display and share-alike for database modifications). |
| **Required Attribution** | `© OpenStreetMap contributors` — must be visibly and tastefully displayed on all map surfaces. |

---

## 5. Precipitation Weather Radar: RainViewer Weather Maps API

| Property | Detail |
|---|---|
| **Primary Index URL** | `https://api.rainviewer.com/public/weather-maps.json` |
| **Tile Host** | `https://tilecache.rainviewer.com` (global CDN) |
| **Active Tile Pattern** | `{host}{path}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png` |
| **Function in Aeroloom** | Live weather radar reflectivity overlay, multi-frame Doppler precipitation timeline, and convective cell monitoring. |
| **Verified Zoom Levels** | **Zoom 0 to 7**. Radar tiles are capped at zoom level 7 per official RainViewer specifications. Above z7, MapLibre overscales z7 raster tiles cleanly. |
| **Tile Sizes** | 256px or 512px. Aeroloom uses 256px standard raster tiles. |
| **Frame Counts & Interval** | **13 past radar frames** spanning the previous 2 hours in **10-minute intervals**. Nowcast frames (`nowcast: []`) are empty on the public free tier. |
| **Color Schemes** | Schemes 0–8. Aeroloom employs Scheme `2` ("Universal Blue") or Scheme `4` ("TWC") with `{smooth=1}_{snow=1}` for high-contrast legibility on light paper cartography (`#F6F4EE`). |
| **Rate Limits** | Fair-use public tier. API index must be cached on server (5-minute TTL). Client tile requests are served directly from `tilecache.rainviewer.com`. |
| **Server Mitigation** | Aeroloom caches `/api/radar` for 300s (5 minutes) in Redis/Memory and enforces a 120 req/min per-IP rate limit. |
| **Terms & Licensing** | © RainViewer / MeteoLab Inc. Free for non-commercial, personal, and research applications. Commercial deployment strictly requires an active RainViewer API subscription. |
| **Commercial Use** | **Restricted**: Requires paid subscription from MeteoLab Inc. for commercial distribution. |
| **Required Attribution** | "Radar imagery © [RainViewer](https://www.rainviewer.com/api/weather-maps-api.html)." Tastefully integrated on map layer controls and `/about/data`. |

---

## 6. Curated Static Databases (Zero Network Dependency)

| Dataset | Contents | Source & Licensing |
|---|---|---|
| **`lib/airports/airportData.ts`** | Global hub airports (ICAO, IATA, coordinates, elevation, timezone) | Curated open aviation database (public domain) |
| **`lib/metadata/airlineCatalog.ts`** | Commercial airlines, ICAO 3-letter codes, telephony callsigns | OpenFlights Airline Dataset & ICAO Document 8585 |
| **`lib/metadata/aircraftCatalog.ts`** | Aircraft type designators, wake turbulence categories, engine types | ICAO Document 8643 Aircraft Type Designators |
| **`lib/routes/routeResolver.ts`** | Airline route schedules for authentic flight origin/destination | Curated schedule index with explicit "verified" confidence flags |

---

## 7. AI Flight Intelligence: OpenRouter (Free Inference Tier)

*Verified against OpenRouter documentation as of October 2026.*

| Property | Detail |
|---|---|
| **Primary API Endpoint** | `https://openrouter.ai/api/v1/chat/completions` |
| **Model Selection Mechanism** | Explicit `:free` suffix (e.g., `meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`, `qwen/qwen-2.5-coder-32b-instruct:free`) or the dynamic auto-fallback `openrouter/free` router. |
| **Free-Tier Rate Limits** | Standard Free Tier: **20 requests/minute** and **50 requests/day**. Accounts with ≥$10 lifetime credit purchase unlock **1,000 requests/day** while retaining the 20 req/min burst limiter. |
| **Streaming & Response Format** | OpenAI-compatible Server-Sent Events (`text/event-stream`). Chunks arrive as `data: {"choices":[{"delta":{"content":"..."}}]}` terminated by `data: [DONE]`. |
| **Tool Calling & Function Calling** | Supported natively on selected free models (e.g., Llama 3.3 70B, Qwen 2.5 Coder, Gemini 2.0 Flash) and dynamically routed via `openrouter/free` when `tools` schema is provided. |
| **Aeroloom Architecture Protection** | **Two-stage Deterministic Grounding & Retrieval**: Rather than trusting LLMs to initiate hallucinated network calls, Aeroloom's server-side tool orchestration classifies the intent, executes internal typed tools (`getFlight`, `searchFlights`, `getAirportWeather`, `getAirportTraffic`) against verified local/cached data, and injects strictly delimited, sanitized XML context `<flight_telemetry>` into the system prompt. |
| **Security & Injection Defense** | Upstream callsigns, pilot remarks, and user questions are treated as untrusted text strings: control characters stripped, length bounded (≤500 chars), and wrapped in non-executable data delimiters. |
| **Model Fallback Chain** | Configurable via `ASSISTANT_MODELS`. Default chain: `meta-llama/llama-3.3-70b-instruct:free` -> `google/gemini-2.0-flash-exp:free` -> `qwen/qwen-2.5-coder-32b-instruct:free` -> `openrouter/free`. Hard 20-second timeout per hop before cascading. |
| **Terms & Attribution** | Subject to OpenRouter Terms of Service and underlying model licenses (Llama 3 Community License, Gemma Terms, etc.). Commercial use governed by respective open-weights license agreements. |
| **Required UI Attribution** | "Inference powered by OpenRouter free model router. AI responses are generated from live ADS-B telemetry and METAR feeds; not for flight planning or operational safety." |

---

## Summary of Architectural Protections

1. **No Client-Side Upstream Calls**: Browsers **never** call external APIs directly. Every query routes through Next.js server route handlers (`/api/*`).
2. **Double-Layer Caching**: In-memory LRU + Upstash Redis cache shields upstream APIs from duplicate traffic.
3. **Request Coalescing**: `RequestCoalescer` merges simultaneous identical bounds or flight requests into a single in-flight Promise.
4. **Bounds Quantization**: Map viewports are gridded to 0.05° tiles, ensuring multiple users in the same metropolitan area hit identical cache slots.
5. **Circuit Breakers & Graceful Degradation**: Upstream failures automatically serve cached data with `degraded: true` and trigger short negative caches to prevent upstream hammering.
