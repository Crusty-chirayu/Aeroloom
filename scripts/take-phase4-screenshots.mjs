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
  if (buf[0] !== 0x89 || buf[1] !== 0x40 && buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    // standard png check
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
      throw new Error('Not a valid PNG file');
    }
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

async function captureRoute(browser, route, prefix, outDir) {
  console.log(`\nCapturing [${route}] as '${prefix}' across 4 viewports...`);
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1500); // Allow MapLibre mini-maps, charts, and data to settle

      const filename = `${prefix}_${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath });
      const dims = readPngDimensions(filePath);
      console.log(`  ✓ ${filename.padEnd(32)}: exact PNG = ${dims.width} × ${dims.height} px (Target: ${vp.width} px)`);
      if (dims.width !== vp.width) {
        console.error(`  ERROR: Width mismatch on ${filename}!`);
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`  Failed to capture ${route} at ${vp.name}:`, err.message);
    } finally {
      await page.close();
    }
  }
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/phase4');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  console.log(`Starting Phase 4 screenshot verification into ${outDir}...`);

  // 1. Live Flight Dossier
  await captureRoute(browser, '/flight/DAL397', 'flight_dossier_DAL397', outDir);

  // 2. Unknown / Not Airborne Flight (Designed Empty State)
  await captureRoute(browser, '/flight/UNKNOWN999', 'flight_not_found', outDir);

  // 3. Airport Dossier with METAR
  await captureRoute(browser, '/airport/KJFK', 'airport_dossier_KJFK', outDir);

  // 4. Airports Index Table
  await captureRoute(browser, '/airports', 'airports_index', outDir);

  // 5. Full Search Page
  await captureRoute(browser, '/search', 'search_page', outDir);

  // 6. Data Transparency Register
  await captureRoute(browser, '/about/data', 'about_data_page', outDir);

  // 7. Designed 404 Not Found Page
  await captureRoute(browser, '/non-existent-route-for-404-test', 'not_found_404', outDir);

  await browser.close();
  console.log(`\nPhase 4 screenshot capture complete. All files saved to docs/screenshots/phase4/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
