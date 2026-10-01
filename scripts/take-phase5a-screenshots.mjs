import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VIEWPORTS = [
  { width: 390, height: 844, name: '390px' },
  { width: 768, height: 1024, name: '768px' },
  { width: 1280, height: 800, name: '1280px' },
  { width: 1728, height: 1080, name: '1728px' },
];

function readPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    throw new Error('Not a valid PNG file');
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/phase5a');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  console.log(`Starting Phase 5A screenshot verification into ${outDir}...`);

  // 1. Hero State (at all 4 viewports)
  console.log('\n--- 1. Hero State Captures ---');
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    // Dismiss preloader via session storage
    await page.addInitScript(() => {
      sessionStorage.setItem('aeroloom_preloaded', 'true');
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Allow MapLibre canvas and fonts to settle

    const filename = `landing_hero_${vp.name}.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`  ✓ ${filename.padEnd(28)}: exact PNG = ${dims.width} × ${dims.height} px (Target: ${vp.width} px)`);
    await page.close();
  }

  // 2. Mid-Pin State (Scrolled to cruise beat, p ~ 0.5)
  console.log('\n--- 2. Mid-Pin State (Stage 02 Cruise) ---');
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.addInitScript(() => {
      sessionStorage.setItem('aeroloom_preloaded', 'true');
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Scroll into the middle of the pinned section (~1200px down)
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 1.5, behavior: 'instant' });
    });
    await page.waitForTimeout(1500);

    const filename = `landing_midpin_${vp.name}.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`  ✓ ${filename.padEnd(28)}: exact PNG = ${dims.width} × ${dims.height} px (Target: ${vp.width} px)`);
    await page.close();
  }

  // 3. End-of-Pin State (Scrolled to terminal arrival beat, p ~ 0.95)
  console.log('\n--- 3. End-of-Pin State (Stage 03 Arrival) ---');
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.addInitScript(() => {
      sessionStorage.setItem('aeroloom_preloaded', 'true');
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Scroll to end of pin section
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 2.8, behavior: 'instant' });
    });
    await page.waitForTimeout(1500);

    const filename = `landing_endpin_${vp.name}.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`  ✓ ${filename.padEnd(28)}: exact PNG = ${dims.width} × ${dims.height} px (Target: ${vp.width} px)`);
    await page.close();
  }

  // 4. Preloader Arc Capture (Clean load without sessionStorage)
  console.log('\n--- 4. Preloader Arc Capture ---');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400); // In the middle of arc draw

    const filename = `landing_preloader_1280px.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`  ✓ ${filename.padEnd(28)}: exact PNG = ${dims.width} × ${dims.height} px`);
    await page.close();
  }

  // 5. Reduced-Motion Verification
  console.log('\n--- 5. Reduced-Motion Capture ---');
  {
    const page = await browser.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const filename = `landing_reduced_motion_1280px.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`  ✓ ${filename.padEnd(28)}: exact PNG = ${dims.width} × ${dims.height} px`);
    await page.close();
  }

  await browser.close();
  console.log(`\nPhase 5A screenshot capture complete. All files saved to docs/screenshots/phase5a/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
