import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const failedRequests = [];
  const cspViolations = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', (req) => {
    const errorText = req.failure()?.errorText || '';
    // Ignore intentional client-side aborts from React debounce / AbortController
    if (errorText !== 'net::ERR_ABORTED') {
      failedRequests.push({ url: req.url(), failure: errorText });
    }
  });

  page.on('response', (res) => {
    if (res.status() === 0) {
      cspViolations.push(res.url());
    }
  });

  console.log('Navigating to http://localhost:3000/map...');
  await page.goto('http://localhost:3000/map', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000); // Allow MapLibre to load tiles and render aircraft batch

  // Query rendered aircraft symbols directly from MapLibre
  const symbolStats = await page.evaluate(async () => {
    const map = window._aeroloomMap;
    if (!map) {
      return { mapFound: false, renderedSymbols: 0, sourceFeatures: 0 };
    }

    const source = map.getSource('aircraft');
    const sourceData = source?._data;
    const sourceFeatures = sourceData?.features?.length || 0;

    const rendered = map.queryRenderedFeatures({ layers: ['aircraft-layer'] });
    return {
      mapFound: true,
      sourceFeatures,
      renderedSymbols: rendered.length,
    };
  });

  const artifactDir = 'C:/Users/Allah/.gemini/antigravity-ide/brain/d4bc9352-3d42-4f4e-9f20-88a99dbdccdc';
  const screenshotPath = path.join(artifactDir, 'map_verified_aircraft.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });

  console.log('=== PLAYWRIGHT VERIFICATION RESULTS ===');
  console.log('Console Errors Count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }
  console.log('Failed Requests Count:', failedRequests.length);
  if (failedRequests.length > 0) {
    console.log('Failed Requests:', failedRequests);
  }
  console.log('CSP Violations Count:', cspViolations.length);
  console.log('Aircraft Source Features:', symbolStats.sourceFeatures);
  console.log('Aircraft Rendered Symbols Count:', symbolStats.renderedSymbols);
  console.log('Screenshot Saved:', screenshotPath);

  await browser.close();
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
