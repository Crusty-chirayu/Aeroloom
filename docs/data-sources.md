# Aeroloom: Data Sources, Tile Attribution & Licensing Terms

This document tracks all external data sources, map tile providers, licenses, and attribution requirements across the Aeroloom system.

---

## 1. Map Basemap Tile Sources (Phase 0 Evaluation / Phase 3 Finalization)

> **Phase 0 Status**: Dark basemap configurations (`cartoDark`, `openFreeMapDark`) have been removed from the repository. Basemap configuration retains extensible multi-provider structure. The final custom light style will be designed and built in **Phase 3**.

### Candidate 1: OpenFreeMap (Primary Candidate)
- **Style**: Liberty (`https://tiles.openfreemap.org/styles/liberty`) / Custom Positron/Bright vector tiles.
- **Provider**: OpenFreeMap (open-source vector tile hosting).
- **Terms & Limits**: Free, no API key required, no tracking, open infrastructure.
- **License**: Map data is licensed under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/) by the OpenStreetMap Foundation.
- **Attribution Requirement**: Must display `© OpenStreetMap contributors, © OpenFreeMap` prominently in the map viewport attribution control.

### Candidate 2: CARTO Positron (Fallback / Reference Candidate)
- **Style**: Positron GL Style (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`).
- **Provider**: CARTO.
- **Terms & Limits**: Free for non-commercial and direct visualization use with standard attribution.
- **License**: Cartography & raster/vector design under [Creative Commons Attribution 4.0 International (CC-BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Underlying data © OpenStreetMap contributors (ODbL).
- **Attribution Requirement**: Must display `© CARTO, © OpenStreetMap contributors`.

---

## 2. Flight Position & ADS-B Telemetry

### airplanes.live & adsb.lol
- **Provider**: Community ADS-B feed aggregator network.
- **Integration**: Server-side Next.js route handlers (`app/api/aircraft/live/route.ts`), debounced with in-memory / Redis cache layers and circuit breaker.
- **Terms & Usage**: Non-commercial community access; strict rate-limiting shields on client proxies to ensure 1 upstream request per geographic cluster.
- **Honest Data Policy**: No simulated, fake, or synthetic coordinates are presented as live flights. If the feed is unreachable, stale counters or honest delayed indicators are displayed.

---

## 3. Aviation Metadata & Airports

### Airport Catalog (`lib/airports/airportData.ts`)
- Curated reference dataset of 42+ primary global hubs, coordinates, ICAO/IATA identifiers, elevation, and timezones based on public aviation documentation (OurAirports / FAA / ICAO open public domain).

### Aircraft Type Catalog (`lib/metadata/aircraftCatalog.ts`)
- Curated ICAO type-designator mapping based on official ICAO Doc 8643 (Aircraft Type Designators).

### Airline Telephony Catalog (`lib/metadata/airlineCatalog.ts`)
- ICAO 3-letter airline telephony designator mappings derived from ICAO Doc 8585.
