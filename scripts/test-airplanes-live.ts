import {
  fetchAirplanesLivePositions,
  getLiveAircraftPositions,
  DEFAULT_QUERY_LOCATION,
} from '../lib/providers/positions/airplanesLive.ts';

async function main() {
  console.log('--- Testing Airplanes.live / ADS-B Provider Integration ---\n');

  console.log(`1. Target Sector: San Francisco Bay Area (Lat: ${DEFAULT_QUERY_LOCATION.lat}, Lon: ${DEFAULT_QUERY_LOCATION.lon}, Radius: ${DEFAULT_QUERY_LOCATION.radiusNm}nm)`);

  // Query primary upstream (airplanes.live)
  console.log('\n2. Querying airplanes.live public endpoint...');
  const airplanesResult = await fetchAirplanesLivePositions(DEFAULT_QUERY_LOCATION);
  console.log(`- Success: ${airplanesResult.success}`);
  console.log(`- Status / Note: ${airplanesResult.error || 'OK'}`);
  console.log(`- Aircraft Count: ${airplanesResult.aircraft.length}`);

  // Query live resolver (with fallback bridge)
  console.log('\n3. Querying live composite provider (with ADS-B bridge)...');
  const liveResult = await getLiveAircraftPositions(DEFAULT_QUERY_LOCATION);
  console.log(`- Provider: ${liveResult.provider}`);
  console.log(`- Success: ${liveResult.success}`);
  console.log(`- Aircraft Count: ${liveResult.aircraft.length}`);

  if (liveResult.aircraft.length > 0) {
    console.log('\n4. Sample Normalized Aircraft Records:');
    liveResult.aircraft.slice(0, 3).forEach((ac, idx) => {
      console.log(`   [${idx + 1}] Callsign: ${ac.callsign} | Hex: ${ac.id} | Alt: ${ac.altitude}ft | Spd: ${ac.speed}kts | Track: ${ac.heading}° | Lat: ${ac.latitude.toFixed(4)}, Lon: ${ac.longitude.toFixed(4)} | Src: ${ac.source}`);
    });
  }

  if (!liveResult.success && liveResult.aircraft.length === 0) {
    console.error('\nFAIL: Could not retrieve live aircraft positions from any live provider.');
    process.exit(1);
  }

  console.log('\nPASS: Real aircraft provider test completed successfully.');
}

main().catch((err) => {
  console.error('Fatal error running provider test:', err);
  process.exit(1);
});
