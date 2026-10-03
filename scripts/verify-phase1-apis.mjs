async function verifyAll() {
  const tests = [
    { name: 'Live Aircraft (Bounds)', url: '/api/aircraft/live?bounds=40.5,-74.2,40.8,-73.6&zoom=10' },
    { name: 'Live Aircraft (Legacy Lat/Lon)', url: '/api/aircraft/live?lat=37.77&lon=-122.41&radius=50' },
    { name: 'Aircraft Track', url: '/api/aircraft/a38d95/track' },
    { name: 'Omni Search (Airports + Airlines)', url: '/api/search?q=London' },
    { name: 'Omni Search (Flight)', url: '/api/search?q=DAL' },
    { name: 'Airport Weather (KJFK)', url: '/api/airport/KJFK/weather' },
    { name: 'Airport Traffic (KJFK)', url: '/api/airport/KJFK/traffic' },
  ];

  console.log('=== REAL API ENDPOINTS VERIFICATION ===');
  for (const t of tests) {
    try {
      const res = await fetch('http://localhost:3000' + t.url);
      const data = await res.json();
      console.log(`[${res.status}] ${t.name} -> ${t.url}`);
      console.log('   Keys:', Object.keys(data));
      if (data.totalFound !== undefined) console.log('   totalFound:', data.totalFound, 'provider:', data.provider);
      if (data.weather) console.log('   flightCategory:', data.weather.flightCategory, '| summary:', data.weather.summary);
      if (data.airports) console.log('   airports:', data.airports.length, 'airlines:', data.airlines.length);
    } catch (err) {
      console.error('Failed on', t.name, err.message);
    }
  }

  // Simulated degraded path test
  console.log('\n=== DEGRADED / ERROR PATH VERIFICATION ===');
  const resBad = await fetch('http://localhost:3000/api/aircraft/live?bounds=invalid');
  console.log('[Status ' + resBad.status + '] /api/aircraft/live?bounds=invalid');
  const badData = await resBad.json();
  console.log('   Envelope:', JSON.stringify(badData));

  const resUnknownAirport = await fetch('http://localhost:3000/api/airport/ZZZZ/traffic');
  console.log('[Status ' + resUnknownAirport.status + '] /api/airport/ZZZZ/traffic');
  const unknownData = await resUnknownAirport.json();
  console.log('   Envelope:', JSON.stringify(unknownData));
}

verifyAll().catch(console.error);
