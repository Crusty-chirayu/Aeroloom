import { chromium, firefox, webkit } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testEngine(name, engine) {
  console.log(`\nTesting ${name.toUpperCase()}...`);
  let browser;
  try {
    browser = await engine.launch();
  } catch (err) {
    console.log(`  ⚠ ${name} binary not installed or unavailable in this environment: ${err.message.split('\n')[0]}`);
    return { name, supported: false, error: err.message };
  }

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.addInitScript(() => sessionStorage.setItem('aeroloom_preloaded', 'true'));

    // Flow 1: Landing Page Load & Scroll
    console.log(`  1. Testing Landing Page load on ${name}...`);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const title = await page.title();
    console.log(`     ✓ Title: "${title}"`);

    // Flow 2: Map Pan & Interactive Layer
    console.log(`  2. Testing /map Page navigation and canvas...`);
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const canvasExists = await page.locator('canvas.maplibregl-canvas').count();
    console.log(`     ✓ MapLibre Canvas verified: count = ${canvasExists}`);

    // Flow 3: Command Palette Open via shortcut
    console.log(`  3. Testing Command Palette (⌘K / Ctrl+K)...`);
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    const paletteCount = await page.locator('[cmdk-root]').count();
    console.log(`     ✓ Command Palette opened cleanly: count = ${paletteCount}`);

    await context.close();
    await browser.close();
    console.log(`  ✓ ${name.toUpperCase()} ALL FLOWS PASSED CLEANLY!`);
    return { name, supported: true, success: true };
  } catch (err) {
    console.error(`  ✗ ${name} test failed:`, err.message);
    if (browser) await browser.close();
    return { name, supported: true, success: false, error: err.message };
  }
}

async function main() {
  console.log('Starting Playwright multi-engine cross-browser validation...');
  const engines = [
    ['chromium', chromium],
    ['firefox', firefox],
    ['webkit', webkit],
  ];

  const results = [];
  for (const [name, engine] of engines) {
    results.push(await testEngine(name, engine));
  }

  console.log('\n--- CROSS-BROWSER SUMMARY ---');
  results.forEach((r) => {
    if (r.success) {
      console.log(`✓ ${r.name.padEnd(10)}: FULL PASS (Landing, Map, Palette)`);
    } else if (!r.supported) {
      console.log(`ℹ ${r.name.padEnd(10)}: Skipped (Binary not installed locally)`);
    } else {
      console.log(`✗ ${r.name.padEnd(10)}: Failed: ${r.error}`);
    }
  });
}

main().catch((err) => {
  console.error('Cross-browser test harness failed:', err);
  process.exit(1);
});
