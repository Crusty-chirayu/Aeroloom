import {
  getAirportWeather,
  getAirportTraffic,
  getSelectedFlightContext,
  searchFlights,
} from './tools.ts';
import { GLOBAL_AIRPORTS } from '../airports/airportData.ts';
import type { AssistantContextHint, AssistantToolSource } from './types.ts';

/**
 * Sanitizes untrusted user inputs or external telemetry strings.
 * Strips ASCII control characters, delimiters that simulate model system tags,
 * and caps the character length to prevent buffer/context attacks.
 */
export function sanitizeUntrustedInput(text: string, maxLength: number = 500): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // Remove control characters (0x00-0x1F, 0x7F-0x9F) except space and newline
    .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ' ')
    // Neutralize prompt-injection system tags and markdown exploits
    .replace(/<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\]|<\/?system>|<\/?prompt>/gi, '')
    // Normalize excessive whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Strips XML angle brackets to prevent escaping out of enclosing XML data tags.
 */
export function escapeXmlData(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface GroundedRetrievalResult {
  groundedXml: string;
  sources: AssistantToolSource[];
  timestampIso: string;
  utcTimeStr: string;
}

/**
 * Deterministically classifies intent, dispatches typed internal tools against
 * live telemetry layers, and structures the retrieved context into an isolated XML envelope.
 */
export async function classifyAndRetrieveContext(
  query: string,
  context?: AssistantContextHint
): Promise<GroundedRetrievalResult> {
  const cleanQuery = sanitizeUntrustedInput(query, 500);
  const now = new Date();
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
  const utcTimeStr = `${utcHours}:${utcMins} UTC`;
  const timestampIso = now.toISOString();

  const sources: AssistantToolSource[] = [];
  const telemetrySections: string[] = [];

  const upperQuery = cleanQuery.toUpperCase();

  // 1. Detect selected flight or explicit flight callsign/hex
  let targetFlightId = context?.selectedFlightId || context?.selectedCallsign;

  // Pattern for commercial airline callsign (e.g. BAW123, UAL852, DLH400, AFR12)
  const callsignMatch = upperQuery.match(/\b([A-Z]{3}\d{1,4}[A-Z]?)\b/);
  // Pattern for 6-char hex address (e.g. 400A01, A1234F)
  const hexMatch = upperQuery.match(/\b([0-9A-F]{6})\b/);

  if (callsignMatch) {
    targetFlightId = callsignMatch[1];
  } else if (!targetFlightId && hexMatch) {
    targetFlightId = hexMatch[1];
  }

  // 2. Detect airport codes in query or context
  let targetAirportIcao = context?.airportIcao?.toUpperCase();
  if (!targetAirportIcao) {
    const tokens = upperQuery.split(/[^A-Z0-9]+/);
    for (const token of tokens) {
      if (token.length === 4) {
        const found = GLOBAL_AIRPORTS.find((a) => a.icao === token);
        if (found) {
          targetAirportIcao = found.icao;
          break;
        }
      }
    }
    if (!targetAirportIcao) {
      for (const token of tokens) {
        if (token.length === 3) {
          const found = GLOBAL_AIRPORTS.find((a) => a.iata === token);
          if (found) {
            targetAirportIcao = found.icao;
            break;
          }
        }
      }
    }
  }

  // Check intent types
  const isWeatherIntent = /WEATHER|METAR|WIND|VISIBIL|CEILING|RAIN|STORM|CLOUD|TEMPERAT|CONDITIONS|OK/i.test(upperQuery);
  const isTrafficIntent = /TRAFFIC|BUSY|HOW MANY|AIRSPACE|CONGEST/i.test(upperQuery);

  // Dispatch tools
  const promises: Promise<void>[] = [];

  // A. Selected flight or target flight query
  if (targetFlightId) {
    promises.push(
      (async () => {
        const { result, source } = await getSelectedFlightContext(targetFlightId);
        sources.push(source);
        if (result.found && result.flight) {
          const f = result.flight;
          let flightXml = `  <flight id="${escapeXmlData(f.id)}" callsign="${escapeXmlData(f.callsign || 'UNKNOWN')}">\n`;
          flightXml += `    <aircraft_type>${escapeXmlData(f.typeCode || 'Unknown')}</aircraft_type>\n`;
          flightXml += `    <origin>${escapeXmlData(f.route?.origin?.iata || 'Unknown')}</origin>\n`;
          flightXml += `    <destination>${escapeXmlData(f.route?.destination?.iata || 'Unknown')}</destination>\n`;
          flightXml += `    <altitude_ft>${f.altitudeFt ?? 'Unknown'}</altitude_ft>\n`;
          flightXml += `    <ground_speed_kts>${f.groundSpeedKt ?? 'Unknown'}</ground_speed_kts>\n`;
          flightXml += `    <heading_deg>${f.trackDeg ?? 'Unknown'}</heading_deg>\n`;
          flightXml += `    <squawk>${escapeXmlData(f.squawk || 'None')}</squawk>\n`;
          flightXml += `    <vertical_rate_fpm>${f.verticalRateFpm ?? 0}</vertical_rate_fpm>\n`;
          flightXml += `    <on_ground>${f.onGround ? 'true' : 'false'}</on_ground>\n`;
          if (result.destinationWeather) {
            flightXml += `    <destination_weather icao="${escapeXmlData(result.destinationAirport?.icao || '')}">\n`;
            flightXml += `      <category>${result.destinationWeather.flightCategory}</category>\n`;
            flightXml += `      <summary>${escapeXmlData(result.destinationWeather.summary)}</summary>\n`;
            flightXml += `      <raw_metar>${escapeXmlData(result.destinationWeather.rawMetar || '')}</raw_metar>\n`;
            flightXml += `    </destination_weather>\n`;
          }
          flightXml += `  </flight>`;
          telemetrySections.push(flightXml);
        } else {
          telemetrySections.push(
            `  <flight_not_found identifier="${escapeXmlData(targetFlightId)}">${escapeXmlData(result.summary)}</flight_not_found>`
          );
        }
      })()
    );
  }

  // B. Airport weather query
  if (targetAirportIcao && (isWeatherIntent || !targetFlightId)) {
    promises.push(
      (async () => {
        const { result, source } = await getAirportWeather(targetAirportIcao);
        sources.push(source);
        if (result.found && result.weather) {
          const w = result.weather;
          let weatherXml = `  <airport_weather icao="${escapeXmlData(w.icao)}">\n`;
          weatherXml += `    <category>${w.flightCategory}</category>\n`;
          weatherXml += `    <summary>${escapeXmlData(w.summary)}</summary>\n`;
          weatherXml += `    <wind_deg>${w.wind.directionDeg}</wind_deg>\n`;
          weatherXml += `    <wind_speed_kt>${w.wind.speedKt}</wind_speed_kt>\n`;
          if (w.wind.gustKt) weatherXml += `    <wind_gust_kt>${w.wind.gustKt}</wind_gust_kt>\n`;
          weatherXml += `    <visibility_sm>${w.visibilitySm}</visibility_sm>\n`;
          if (w.ceilingFt !== undefined) weatherXml += `    <ceiling_ft>${w.ceilingFt}</ceiling_ft>\n`;
          if (w.temperatureC !== undefined) weatherXml += `    <temp_c>${w.temperatureC}</temp_c>\n`;
          if (w.rawMetar) weatherXml += `    <raw_metar>${escapeXmlData(w.rawMetar)}</raw_metar>\n`;
          weatherXml += `  </airport_weather>`;
          telemetrySections.push(weatherXml);
        } else {
          telemetrySections.push(
            `  <weather_not_found icao="${escapeXmlData(targetAirportIcao)}">${escapeXmlData(result.summary)}</weather_not_found>`
          );
        }
      })()
    );
  }

  // C. Airport traffic query
  if (targetAirportIcao && (isTrafficIntent || !targetFlightId)) {
    promises.push(
      (async () => {
        const { result, source } = await getAirportTraffic(targetAirportIcao, 30);
        sources.push(source);
        if (result.found) {
          let trafficXml = `  <airport_traffic icao="${escapeXmlData(targetAirportIcao)}" count="${result.count}" radius_nm="30">\n`;
          for (const ac of result.aircraft.slice(0, 5)) {
            trafficXml += `    <aircraft callsign="${escapeXmlData(ac.callsign || ac.id)}" type="${escapeXmlData(ac.typeCode || 'UNK')}" alt="${ac.altitudeFt ?? 0}" spd="${ac.groundSpeedKt ?? 0}" />\n`;
          }
          trafficXml += `  </airport_traffic>`;
          telemetrySections.push(trafficXml);
        }
      })()
    );
  }

  // D. General query search if neither flight nor airport was matched
  if (!targetFlightId && !targetAirportIcao) {
    promises.push(
      (async () => {
        const { result, source } = await searchFlights(cleanQuery);
        sources.push(source);
        let searchXml = `  <search_results query="${escapeXmlData(cleanQuery)}">\n`;
        for (const fl of result.flights.slice(0, 3)) {
          searchXml += `    <flight id="${escapeXmlData(fl.id)}" callsign="${escapeXmlData(fl.callsign || '')}" alt="${fl.altitudeFt ?? 0}" />\n`;
        }
        for (const ap of result.airports.slice(0, 3)) {
          searchXml += `    <airport icao="${escapeXmlData(ap.icao)}" iata="${escapeXmlData(ap.iata)}" name="${escapeXmlData(ap.name)}" city="${escapeXmlData(ap.city)}" />\n`;
        }
        searchXml += `  </search_results>`;
        telemetrySections.push(searchXml);
      })()
    );
  }

  await Promise.allSettled(promises);

  const groundedXml = [
    `<grounded_telemetry as_of="${utcTimeStr}" timestamp_iso="${timestampIso}">`,
    ...telemetrySections,
    `</grounded_telemetry>`,
  ].join('\n');

  return {
    groundedXml,
    sources,
    timestampIso,
    utcTimeStr,
  };
}
