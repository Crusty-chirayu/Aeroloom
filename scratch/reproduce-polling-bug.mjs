async function run() {
  console.log('Starting 3-minute telemetry polling reproduction test...');
  const startTime = Date.now();
  const durationMs = 180_000; // 3 minutes
  const intervalMs = 6_000; // 6 seconds per map poll

  let iteration = 0;

  while (Date.now() - startTime < durationMs) {
    iteration++;
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    try {
      const liveRes = await fetch('http://localhost:3000/api/aircraft/live?bounds=40.5,-74.2,40.8,-73.6&zoom=10');
      const liveJson = await liveRes.json();
      const statusRes = await fetch('http://localhost:3000/api/status');
      const statusJson = await statusRes.json();

      const acCount = liveJson.states ? liveJson.states.length : (liveJson.aircraft ? liveJson.aircraft.length : 0);
      const provider = liveJson.provider || 'unknown';
      const isDegraded = Boolean(liveJson.degraded);
      const errorMsg = liveJson.error || '';

      console.log(
        `[${elapsedSec}s | Poll #${iteration}] Live HTTP ${liveRes.status} | Aircraft: ${acCount} | Provider: ${provider} | Degraded: ${isDegraded} | Error: "${errorMsg}" | SystemStatus: ${statusJson.status}`
      );
      if (statusJson.providers && statusJson.providers.details) {
        const details = statusJson.providers.details;
        console.log(
          `   -> Details: adsb.fi=${details['adsb.fi']?.status} (circuit=${details['adsb.fi']?.circuitState}), adsb.lol=${details['adsb.lol']?.status} (circuit=${details['adsb.lol']?.circuitState}), airplanes.live=${details['airplanes.live']?.status} (circuit=${details['airplanes.live']?.circuitState})`
        );
      }
    } catch (err) {
      console.log(`[${elapsedSec}s | Poll #${iteration}] FETCH ERROR: ${err.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.log('Reproduction test complete.');
}

run();
