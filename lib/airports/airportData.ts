import type { AirportInfo } from '@/lib/providers/positions/types';

/**
 * Curated open dataset of international and domestic aviation gateways.
 * Zero external API dependency, high-performance in-memory indexing.
 */
export const GLOBAL_AIRPORTS: AirportInfo[] = [
  // --- NORTH AMERICA ---
  {
    icao: 'KJFK',
    iata: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    latitude: 40.6413,
    longitude: -73.7781,
    elevationFt: 13,
    timezone: 'America/New_York',
  },
  {
    icao: 'KEWR',
    iata: 'EWR',
    name: 'Newark Liberty International Airport',
    city: 'Newark',
    country: 'United States',
    latitude: 40.6895,
    longitude: -74.1745,
    elevationFt: 18,
    timezone: 'America/New_York',
  },
  {
    icao: 'KLGA',
    iata: 'LGA',
    name: 'LaGuardia Airport',
    city: 'New York',
    country: 'United States',
    latitude: 40.7769,
    longitude: -73.874,
    elevationFt: 21,
    timezone: 'America/New_York',
  },
  {
    icao: 'KBOS',
    iata: 'BOS',
    name: 'Boston Logan International Airport',
    city: 'Boston',
    country: 'United States',
    latitude: 42.3656,
    longitude: -71.0096,
    elevationFt: 20,
    timezone: 'America/New_York',
  },
  {
    icao: 'KATL',
    iata: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    country: 'United States',
    latitude: 33.6407,
    longitude: -84.4277,
    elevationFt: 1026,
    timezone: 'America/New_York',
  },
  {
    icao: 'KMIA',
    iata: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    country: 'United States',
    latitude: 25.7959,
    longitude: -80.287,
    elevationFt: 8,
    timezone: 'America/New_York',
  },
  {
    icao: 'KORD',
    iata: 'ORD',
    name: "O'Hare International Airport",
    city: 'Chicago',
    country: 'United States',
    latitude: 41.9742,
    longitude: -87.9073,
    elevationFt: 668,
    timezone: 'America/Chicago',
  },
  {
    icao: 'KMDW',
    iata: 'MDW',
    name: 'Chicago Midway International Airport',
    city: 'Chicago',
    country: 'United States',
    latitude: 41.7868,
    longitude: -87.7522,
    elevationFt: 620,
    timezone: 'America/Chicago',
  },
  {
    icao: 'KDFW',
    iata: 'DFW',
    name: 'Dallas/Fort Worth International Airport',
    city: 'Dallas',
    country: 'United States',
    latitude: 32.8998,
    longitude: -97.0403,
    elevationFt: 607,
    timezone: 'America/Chicago',
  },
  {
    icao: 'KIAH',
    iata: 'IAH',
    name: 'George Bush Intercontinental Airport',
    city: 'Houston',
    country: 'United States',
    latitude: 29.9902,
    longitude: -95.3368,
    elevationFt: 97,
    timezone: 'America/Chicago',
  },
  {
    icao: 'KDEN',
    iata: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    country: 'United States',
    latitude: 39.8561,
    longitude: -104.6737,
    elevationFt: 5434,
    timezone: 'America/Denver',
  },
  {
    icao: 'KLAX',
    iata: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    latitude: 33.9416,
    longitude: -118.4085,
    elevationFt: 125,
    timezone: 'America/Los_Angeles',
  },
  {
    icao: 'KSFO',
    iata: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    latitude: 37.6213,
    longitude: -122.379,
    elevationFt: 13,
    timezone: 'America/Los_Angeles',
  },
  {
    icao: 'KOAK',
    iata: 'OAK',
    name: 'Oakland International Airport',
    city: 'Oakland',
    country: 'United States',
    latitude: 37.7214,
    longitude: -122.2208,
    elevationFt: 9,
    timezone: 'America/Los_Angeles',
  },
  {
    icao: 'KSJC',
    iata: 'SJC',
    name: 'San Jose International Airport',
    city: 'San Jose',
    country: 'United States',
    latitude: 37.3619,
    longitude: -121.929,
    elevationFt: 62,
    timezone: 'America/Los_Angeles',
  },
  {
    icao: 'KSEA',
    iata: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    country: 'United States',
    latitude: 47.4502,
    longitude: -122.3088,
    elevationFt: 433,
    timezone: 'America/Los_Angeles',
  },
  {
    icao: 'KSAN',
    iata: 'SAN',
    name: 'San Diego International Airport',
    city: 'San Diego',
    country: 'United States',
    latitude: 32.7338,
    longitude: -117.1933,
    elevationFt: 17,
    timezone: 'America/Los_Angeles',
  },
  {
    icao: 'CYYZ',
    iata: 'YYZ',
    name: 'Toronto Pearson International Airport',
    city: 'Toronto',
    country: 'Canada',
    latitude: 43.6777,
    longitude: -79.6248,
    elevationFt: 569,
    timezone: 'America/Toronto',
  },
  {
    icao: 'CYVR',
    iata: 'YVR',
    name: 'Vancouver International Airport',
    city: 'Vancouver',
    country: 'Canada',
    latitude: 49.1967,
    longitude: -123.1815,
    elevationFt: 14,
    timezone: 'America/Vancouver',
  },
  {
    icao: 'MMMX',
    iata: 'MEX',
    name: 'Mexico City International Airport',
    city: 'Mexico City',
    country: 'Mexico',
    latitude: 19.4363,
    longitude: -99.0721,
    elevationFt: 7316,
    timezone: 'America/Mexico_City',
  },

  // --- EUROPE ---
  {
    icao: 'EGLL',
    iata: 'LHR',
    name: 'Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.47,
    longitude: -0.4543,
    elevationFt: 83,
    timezone: 'Europe/London',
  },
  {
    icao: 'EGKK',
    iata: 'LGW',
    name: 'Gatwick Airport',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.1537,
    longitude: -0.1821,
    elevationFt: 202,
    timezone: 'Europe/London',
  },
  {
    icao: 'LFPG',
    iata: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    latitude: 49.0097,
    longitude: 2.5479,
    elevationFt: 392,
    timezone: 'Europe/Paris',
  },
  {
    icao: 'EHAM',
    iata: 'AMS',
    name: 'Amsterdam Airport Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    latitude: 52.3105,
    longitude: 4.7683,
    elevationFt: -11,
    timezone: 'Europe/Amsterdam',
  },
  {
    icao: 'EDDF',
    iata: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    latitude: 50.0379,
    longitude: 8.5622,
    elevationFt: 364,
    timezone: 'Europe/Berlin',
  },
  {
    icao: 'LEMD',
    iata: 'MAD',
    name: 'Adolfo Suárez Madrid-Barajas Airport',
    city: 'Madrid',
    country: 'Spain',
    latitude: 40.4839,
    longitude: -3.568,
    elevationFt: 1998,
    timezone: 'Europe/Madrid',
  },
  {
    icao: 'LIRF',
    iata: 'FCO',
    name: 'Leonardo da Vinci-Fiumicino Airport',
    city: 'Rome',
    country: 'Italy',
    latitude: 41.8003,
    longitude: 12.2389,
    elevationFt: 15,
    timezone: 'Europe/Rome',
  },
  {
    icao: 'LSZH',
    iata: 'ZRH',
    name: 'Zurich Airport',
    city: 'Zurich',
    country: 'Switzerland',
    latitude: 47.4582,
    longitude: 8.5555,
    elevationFt: 1416,
    timezone: 'Europe/Zurich',
  },
  {
    icao: 'LTFM',
    iata: 'IST',
    name: 'Istanbul Airport',
    city: 'Istanbul',
    country: 'Turkey',
    latitude: 41.2753,
    longitude: 28.7519,
    elevationFt: 325,
    timezone: 'Europe/Istanbul',
  },

  // --- ASIA & MIDDLE EAST ---
  {
    icao: 'OMDB',
    iata: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    latitude: 25.2532,
    longitude: 55.3657,
    elevationFt: 62,
    timezone: 'Asia/Dubai',
  },
  {
    icao: 'OTHH',
    iata: 'DOH',
    name: 'Hamad International Airport',
    city: 'Doha',
    country: 'Qatar',
    latitude: 25.2731,
    longitude: 51.6081,
    elevationFt: 13,
    timezone: 'Asia/Qatar',
  },
  {
    icao: 'WSSS',
    iata: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    latitude: 1.3644,
    longitude: 103.9915,
    elevationFt: 22,
    timezone: 'Asia/Singapore',
  },
  {
    icao: 'RJTT',
    iata: 'HND',
    name: 'Tokyo Haneda Airport',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.5494,
    longitude: 139.7798,
    elevationFt: 35,
    timezone: 'Asia/Tokyo',
  },
  {
    icao: 'RJAA',
    iata: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.7647,
    longitude: 140.3863,
    elevationFt: 141,
    timezone: 'Asia/Tokyo',
  },
  {
    icao: 'VHHH',
    iata: 'HKG',
    name: 'Hong Kong International Airport',
    city: 'Hong Kong',
    country: 'Hong Kong',
    latitude: 22.308,
    longitude: 113.9185,
    elevationFt: 28,
    timezone: 'Asia/Hong_Kong',
  },
  {
    icao: 'RKSI',
    iata: 'ICN',
    name: 'Incheon International Airport',
    city: 'Seoul',
    country: 'South Korea',
    latitude: 37.4602,
    longitude: 126.4407,
    elevationFt: 23,
    timezone: 'Asia/Seoul',
  },
  {
    icao: 'VIDP',
    iata: 'DEL',
    name: 'Indira Gandhi International Airport',
    city: 'New Delhi',
    country: 'India',
    latitude: 28.5562,
    longitude: 77.1,
    elevationFt: 777,
    timezone: 'Asia/Kolkata',
  },
  {
    icao: 'VABB',
    iata: 'BOM',
    name: 'Chhatrapati Shivaji Maharaj International Airport',
    city: 'Mumbai',
    country: 'India',
    latitude: 19.0896,
    longitude: 72.8656,
    elevationFt: 39,
    timezone: 'Asia/Kolkata',
  },

  // --- OCEANIA, SOUTH AMERICA & AFRICA ---
  {
    icao: 'YSSY',
    iata: 'SYD',
    name: 'Sydney Kingsford Smith Airport',
    city: 'Sydney',
    country: 'Australia',
    latitude: -33.9399,
    longitude: 151.1753,
    elevationFt: 21,
    timezone: 'Australia/Sydney',
  },
  {
    icao: 'NZAA',
    iata: 'AKL',
    name: 'Auckland Airport',
    city: 'Auckland',
    country: 'New Zealand',
    latitude: -37.0082,
    longitude: 174.785,
    elevationFt: 23,
    timezone: 'Pacific/Auckland',
  },
  {
    icao: 'SBGR',
    iata: 'GRU',
    name: 'São Paulo/Guarulhos International Airport',
    city: 'São Paulo',
    country: 'Brazil',
    latitude: -23.4356,
    longitude: -46.4731,
    elevationFt: 2459,
    timezone: 'America/Sao_Paulo',
  },
  {
    icao: 'FAOR',
    iata: 'JNB',
    name: 'O. R. Tambo International Airport',
    city: 'Johannesburg',
    country: 'South Africa',
    latitude: -26.1367,
    longitude: 28.2411,
    elevationFt: 5558,
    timezone: 'Africa/Johannesburg',
  },
  // --- INDIA & SOUTH ASIA ---
  {
    icao: 'VOBL',
    iata: 'BLR',
    name: 'Kempegowda International Airport',
    city: 'Bengaluru',
    country: 'India',
    latitude: 13.1986,
    longitude: 77.7066,
    elevationFt: 3000,
    timezone: 'Asia/Kolkata',
  },
];

// In-memory index maps for O(1) lookups
const IATA_MAP = new Map<string, AirportInfo>();
const ICAO_MAP = new Map<string, AirportInfo>();

for (const ap of GLOBAL_AIRPORTS) {
  if (ap.iata) IATA_MAP.set(ap.iata.toUpperCase(), ap);
  if (ap.icao) ICAO_MAP.set(ap.icao.toUpperCase(), ap);
}

/**
 * Lookup airport by 3-letter IATA code (e.g. 'JFK', 'LHR')
 */
export function getAirportByIata(iata?: string): AirportInfo | undefined {
  if (!iata) return undefined;
  return IATA_MAP.get(iata.trim().toUpperCase());
}

/**
 * Lookup airport by 4-letter ICAO code (e.g. 'KJFK', 'EGLL')
 */
export function getAirportByIcao(icao?: string): AirportInfo | undefined {
  if (!icao) return undefined;
  return ICAO_MAP.get(icao.trim().toUpperCase());
}

/**
 * Search airports across IATA, ICAO, airport name, and city
 */
export function searchAirports(query: string, limit: number = 8): AirportInfo[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const results: AirportInfo[] = [];
  for (const ap of GLOBAL_AIRPORTS) {
    if (
      ap.iata.includes(q) ||
      ap.icao.includes(q) ||
      ap.name.toUpperCase().includes(q) ||
      ap.city.toUpperCase().includes(q) ||
      ap.country.toUpperCase().includes(q)
    ) {
      results.push(ap);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/**
 * Great-circle distance between two geographic coordinates in Nautical Miles (nm).
 * Uses the Haversine formula.
 */
export function calculateDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Earth mean radius in Nautical Miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Finds airports closest to a given coordinate within a maximum radius.
 */
export function findNearestAirports(
  lat: number,
  lon: number,
  limit: number = 5,
  maxDistanceNm: number = 100
): { airport: AirportInfo; distanceNm: number }[] {
  const nearby: { airport: AirportInfo; distanceNm: number }[] = [];

  for (const ap of GLOBAL_AIRPORTS) {
    const dist = calculateDistanceNm(lat, lon, ap.latitude, ap.longitude);
    if (dist <= maxDistanceNm) {
      nearby.push({ airport: ap, distanceNm: dist });
    }
  }

  nearby.sort((a, b) => a.distanceNm - b.distanceNm);
  return nearby.slice(0, limit);
}
