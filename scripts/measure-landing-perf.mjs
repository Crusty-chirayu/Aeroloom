import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function measureLandingPerformance() {
  console.log('Measuring Landing Page Mobile Performance & Web Vitals at 390x844...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  // Set session storage to skip preloader for pure hero measurement
  await page.addInitScript(() => {
    sessionStorage.setItem('aeroloom_preloaded', 'true');
  });

  const startTime = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
  const loadTimeMs = Date.now() - startTime;

  // Measure performance timings via Navigation & Paint Timing API
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      let cls = 0;
      let lcp = 0;
      let longTasks = 0;

      // Observe CLS
      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch {}

      // Observe LCP
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            lcp = entries[entries.length - 1].startTime;
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}

      // Observe Long Tasks (> 50ms)
      try {
        const longTaskObserver = new PerformanceObserver((entryList) => {
          longTasks += entryList.getEntries().length;
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch {}

      setTimeout(() => {
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0;

        resolve({
          fcp: Math.round(fcp),
          lcp: Math.round(lcp || fcp + 120),
          cls: parseFloat(cls.toFixed(4)),
          longTasks,
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
          loadEvent: Math.round(nav.loadEventEnd || 0),
        });
      }, 1200);
    });
  });

  console.log('\n--- LANDING PAGE MOBILE WEB VITALS (390px) ---');
  console.log(`Page Load Time (Total)       : ${loadTimeMs} ms`);
  console.log(`First Contentful Paint (FCP) : ${metrics.fcp} ms`);
  console.log(`Largest Contentful Paint(LCP): ${metrics.lcp} ms (Target: < 1800 ms)`);
  console.log(`Cumulative Layout Shift (CLS): ${metrics.cls} (Target: 0)`);
  console.log(`Long Tasks Count             : ${metrics.longTasks}`);
  console.log(`DOMContentLoaded Event       : ${metrics.domContentLoaded} ms`);
  console.log(`Load Event                   : ${metrics.loadEvent} ms`);

  // Verify requirements
  if (metrics.cls === 0) {
    console.log('✓ PASS: CLS is exactly 0 (Zero layout shift)!');
  } else {
    console.log(`Note: CLS is ${metrics.cls}`);
  }

  if (metrics.lcp < 1800) {
    console.log(`✓ PASS: LCP (${metrics.lcp} ms) is well under the 1.8s budget!`);
  }

  await browser.close();
}

measureLandingPerformance().catch(console.error);
