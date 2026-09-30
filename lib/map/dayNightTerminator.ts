/**
 * Solar Day/Night Terminator GeoJSON Generator
 *
 * Computes authentic astronomical day/night boundary coordinates for any given UTC timestamp.
 * Generates a GeoJSON polygon covering nighttime earth for MapLibre rendering.
 */

export interface TerminatorFeatureCollection {
  type: 'FeatureCollection';
  features: [
    {
      type: 'Feature';
      properties: { name: 'solar-night-shade' };
      geometry: {
        type: 'Polygon';
        coordinates: [number, number][][];
      };
    },
  ];
}

/**
 * Calculates solar declination and Greenwich hour angle to generate terminator coordinates
 */
export function getTerminatorGeoJson(date: Date = new Date()): TerminatorFeatureCollection {
  const d = date.getTime();
  // Julian Day
  const jd = d / 86400000 + 2440587.5;
  const dSinceJ2000 = jd - 2451545.0;

  // Mean anomaly of the Sun
  const g = (357.529 + 0.98560028 * dSinceJ2000) % 360;
  const gRad = (g * Math.PI) / 180;

  // Sun's mean longitude
  const q = (280.459 + 0.98564736 * dSinceJ2000) % 360;

  // Sun's ecliptic longitude
  const l = (q + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad)) % 360;
  const lRad = (l * Math.PI) / 180;

  // Obliquity of the ecliptic
  const e = 23.439 - 0.00000036 * dSinceJ2000;
  const eRad = (e * Math.PI) / 180;

  // Sun's declination
  const sinDelta = Math.sin(eRad) * Math.sin(lRad);
  const delta = Math.asin(sinDelta); // radians

  // Greenwich Mean Sidereal Time in degrees
  const gmst = (280.46061837 + 360.98564736629 * dSinceJ2000) % 360;

  // Sun's right ascension
  const ra = (Math.atan2(Math.cos(eRad) * Math.sin(lRad), Math.cos(lRad)) * 180) / Math.PI;

  // Solar longitude (subsolar point longitude)
  let subsolarLon = (ra - gmst) % 360;
  if (subsolarLon > 180) subsolarLon -= 360;
  if (subsolarLon < -180) subsolarLon += 360;

  // Generate longitude step points
  const points: [number, number][] = [];
  const tanDelta = Math.tan(delta);

  for (let lon = -180; lon <= 180; lon += 3) {
    const lonDiffRad = ((lon - subsolarLon) * Math.PI) / 180;
    // Lat = -atan(cot(delta) * cos(lon - subsolarLon))
    // Note: cot(delta) = 1 / tan(delta)
    const latRad = Math.atan(-Math.cos(lonDiffRad) / (tanDelta || 0.0001));
    let latDeg = (latRad * 180) / Math.PI;

    // Clamp
    latDeg = Math.max(-85, Math.min(85, latDeg));
    points.push([lon, latDeg]);
  }

  // Close the polygon over the dark hemisphere
  const southPoleDark = delta > 0;
  const capLat = southPoleDark ? -90 : 90;

  const polygonCoordinates: [number, number][] = [
    ...points,
    [180, capLat],
    [-180, capLat],
    points[0],
  ];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'solar-night-shade' },
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoordinates],
        },
      },
    ],
  };
}

export const computeDayNightTerminator = getTerminatorGeoJson;
