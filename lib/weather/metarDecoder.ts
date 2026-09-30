import type { WeatherReport } from '../providers/types.ts';

export interface AviationWeatherGovMetar {
  metar_id?: number;
  icaoId?: string;
  receiptTime?: string;
  obsTime?: number | string;
  reportTime?: string;
  temp?: number;
  dewp?: number;
  wdir?: number | string;
  wspd?: number;
  wgst?: number;
  visib?: number | string;
  altim?: number;
  slp?: number;
  qcField?: number;
  wxString?: string;
  presTend?: number;
  maxT?: number;
  minT?: number;
  maxT24?: number;
  minT24?: number;
  precip?: number;
  pcp3hr?: number;
  pcp6hr?: number;
  pcp24hr?: number;
  snow?: number;
  vertVis?: number;
  metarType?: string;
  rawOb?: string;
  mostRecent?: number;
  lat?: number;
  lon?: number;
  elev?: number;
  prior?: number;
  name?: string;
  clouds?: Array<{ cover?: string; base?: number }>;
  fltcat?: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
}

/**
 * Calculates FAA Standard Flight Rules Category:
 * VFR:  Ceiling > 3,000 ft AND Visibility > 5 SM
 * MVFR: Ceiling 1,000 to 3,000 ft OR Visibility 3 to 5 SM
 * IFR:  Ceiling 500 to < 1,000 ft OR Visibility 1 to < 3 SM
 * LIFR: Ceiling < 500 ft OR Visibility < 1 SM
 */
export function determineFlightCategory(
  visibilitySm?: number,
  ceilingFt?: number
): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' {
  const vis = visibilitySm ?? 10;
  const ceil = ceilingFt ?? 25000;

  if (ceil < 500 || vis < 1) return 'LIFR';
  if (ceil < 1000 || vis < 3) return 'IFR';
  if (ceil <= 3000 || vis <= 5) return 'MVFR';
  return 'VFR';
}

/**
 * Decodes raw METAR string tokens as an authentic fallback if structured upstream JSON is partial.
 */
export function parseRawMetarString(icao: string, raw: string): WeatherReport {
  const upper = raw.trim().toUpperCase();
  const tokens = upper.split(/\s+/);

  let windDir = 0;
  let windSpeed = 0;
  let windGust: number | undefined;
  let windVar = false;
  let visibilitySm: number | undefined;
  let ceilingFt: number | undefined;
  let tempC: number | undefined;
  let dewpointC: number | undefined;
  let altimeterInHg: number | undefined;

  for (const token of tokens) {
    // Wind: e.g. 28014G22KT or VRB04KT or 00000KT
    const windMatch = token.match(/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT$/);
    if (windMatch) {
      if (windMatch[1] === 'VRB') {
        windVar = true;
        windDir = 0;
      } else {
        windDir = parseInt(windMatch[1], 10);
      }
      windSpeed = parseInt(windMatch[2], 10);
      if (windMatch[3]) {
        windGust = parseInt(windMatch[3], 10);
      }
      continue;
    }

    // Visibility: e.g. 10SM or 1/2SM or 2 1/2SM
    const visMatch = token.match(/^(\d+(?:\/\d+)?)SM$/);
    if (visMatch) {
      if (visMatch[1].includes('/')) {
        const [n, d] = visMatch[1].split('/').map(Number);
        visibilitySm = d ? n / d : 1;
      } else {
        visibilitySm = parseFloat(visMatch[1]);
      }
      continue;
    }

    // Clouds / Ceiling: BKN045, OVC010, VV002
    const cloudMatch = token.match(/^(BKN|OVC|VV)(\d{3})/);
    if (cloudMatch) {
      const baseFt = parseInt(cloudMatch[2], 10) * 100;
      if (ceilingFt === undefined || baseFt < ceilingFt) {
        ceilingFt = baseFt;
      }
      continue;
    }

    // Temperature / Dewpoint: 21/14 or M02/M06
    const tempMatch = token.match(/^(M?\d{2})\/(M?\d{2})$/);
    if (tempMatch) {
      tempC = parseInt(tempMatch[1].replace('M', '-'), 10);
      dewpointC = parseInt(tempMatch[2].replace('M', '-'), 10);
      continue;
    }

    // Altimeter: A3012 (30.12 inHg) or Q1013 (QNH 1013 hPa)
    const altimMatch = token.match(/^A(\d{4})$/);
    if (altimMatch) {
      altimeterInHg = parseInt(altimMatch[1], 10) / 100;
      continue;
    }
  }

  const category = determineFlightCategory(visibilitySm, ceilingFt);
  const summaryParts = [
    `Wind ${windVar ? 'Variable' : `${windDir}°`} at ${windSpeed} kt${windGust ? ` (gusts ${windGust} kt)` : ''}`,
    visibilitySm !== undefined ? `${visibilitySm} SM vis` : null,
    ceilingFt !== undefined ? `Ceiling ${ceilingFt.toLocaleString()} ft` : 'Sky Clear',
    tempC !== undefined ? `${tempC}°C` : null,
  ].filter(Boolean);

  return {
    icao: icao.toUpperCase(),
    rawMetar: upper,
    flightCategory: category,
    wind: {
      directionDeg: windDir,
      speedKt: windSpeed,
      gustKt: windGust,
      variable: windVar,
    },
    visibilitySm: visibilitySm ?? 10,
    ceilingFt,
    temperatureC: tempC,
    dewpointC,
    altimeterInHg,
    summary: summaryParts.join(' · '),
  };
}

/**
 * Normalizes aviationweather.gov API response into a typed WeatherReport.
 */
export function normalizeAviationWeatherReport(
  icao: string,
  data: AviationWeatherGovMetar
): WeatherReport {
  const raw = data.rawOb || `${icao} NIL`;
  const parsed = parseRawMetarString(icao, raw);

  // Blend structured API fields with parsed fallback
  const windDir = typeof data.wdir === 'number' ? data.wdir : parsed.wind.directionDeg;
  const windSpeed = typeof data.wspd === 'number' ? data.wspd : parsed.wind.speedKt;
  const windGust = typeof data.wgst === 'number' ? data.wgst : parsed.wind.gustKt;

  let visibilitySm = parsed.visibilitySm;
  if (typeof data.visib === 'number') {
    visibilitySm = data.visib;
  } else if (typeof data.visib === 'string') {
    const num = parseFloat(data.visib.replace('+', ''));
    if (!isNaN(num)) visibilitySm = num;
  }

  // Lowest ceiling from clouds array
  let ceilingFt = parsed.ceilingFt;
  if (Array.isArray(data.clouds)) {
    for (const c of data.clouds) {
      if ((c.cover === 'BKN' || c.cover === 'OVC' || c.cover === 'VV') && typeof c.base === 'number') {
        if (ceilingFt === undefined || c.base < ceilingFt) {
          ceilingFt = c.base;
        }
      }
    }
  }

  const flightCategory =
    data.fltcat && ['VFR', 'MVFR', 'IFR', 'LIFR'].includes(data.fltcat)
      ? data.fltcat
      : determineFlightCategory(visibilitySm, ceilingFt);

  return {
    icao: icao.toUpperCase(),
    stationName: data.name,
    rawMetar: raw,
    flightCategory,
    wind: {
      directionDeg: windDir,
      speedKt: windSpeed,
      gustKt: windGust,
      variable: typeof data.wdir === 'string' && data.wdir === 'VRB',
    },
    visibilitySm,
    ceilingFt,
    temperatureC: typeof data.temp === 'number' ? data.temp : parsed.temperatureC,
    dewpointC: typeof data.dewp === 'number' ? data.dewp : parsed.dewpointC,
    altimeterInHg: typeof data.altim === 'number' ? Number((data.altim / 33.8639).toFixed(2)) : parsed.altimeterInHg,
    observationTime: data.reportTime || (data.obsTime ? new Date(Number(data.obsTime) * 1000).toISOString() : undefined),
    summary: parsed.summary,
  };
}
