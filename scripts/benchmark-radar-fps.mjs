import { chromium } from 'playwright';

async function runBenchmark() {
  console.log('Starting MapLibre radar rendering benchmark (60fps target)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Benchmark Radar OFF
  console.log('Measuring performance with Radar OFF...');
  await page.goto('http://localhost:3005/map?radar=0', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const statsOff = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const times = [];
      let lastTime = performance.now();
      let frames = 0;

      function measure(now) {
        times.push(now - lastTime);
        lastTime = now;
        frames++;
        if (frames < 120) {
          requestAnimationFrame(measure);
        } else {
          const avgFrameTimeMs = times.reduce((a, b) => a + b, 0) / times.length;
          const fps = Math.round(1000 / avgFrameTimeMs);
          resolve({ avgFrameTimeMs: parseFloat(avgFrameTimeMs.toFixed(2)), fps, totalFrames: frames });
        }
      }

      requestAnimationFrame(measure);
    });
  });

  console.log(`✓ Radar OFF: Avg Frame Time = ${statsOff.avgFrameTimeMs}ms, FPS = ${statsOff.fps}`);

  // 2. Benchmark Radar ON
  console.log('Measuring performance with Radar ON...');
  await page.goto('http://localhost:3005/map?radar=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  const statsOn = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const times = [];
      let lastTime = performance.now();
      let frames = 0;

      function measure(now) {
        times.push(now - lastTime);
        lastTime = now;
        frames++;
        if (frames < 120) {
          requestAnimationFrame(measure);
        } else {
          const avgFrameTimeMs = times.reduce((a, b) => a + b, 0) / times.length;
          const fps = Math.round(1000 / avgFrameTimeMs);
          resolve({ avgFrameTimeMs: parseFloat(avgFrameTimeMs.toFixed(2)), fps, totalFrames: frames });
        }
      }

      requestAnimationFrame(measure);
    });
  });

  console.log(`✓ Radar ON : Avg Frame Time = ${statsOn.avgFrameTimeMs}ms, FPS = ${statsOn.fps}`);

  await browser.close();

  console.log('\n--- RADAR PERFORMANCE BENCHMARK RESULT ---');
  console.log(`Radar OFF: ${statsOff.avgFrameTimeMs} ms/frame (${statsOff.fps} FPS)`);
  console.log(`Radar ON : ${statsOn.avgFrameTimeMs} ms/frame (${statsOn.fps} FPS)`);
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
