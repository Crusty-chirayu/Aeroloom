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

const TARGETS = [
  { route: '/dev/aircraft', prefix: 'aircraft' },
  { route: '/dev/icons', prefix: 'icons' },
];

function readPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  // PNG signature check
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    throw new Error('Not a valid PNG file');
  }
  // IHDR chunk starts at byte 12 (length at 8), width at byte 16, height at byte 20
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/phase2');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  console.log(`Starting Phase 2 screenshot capture into ${outDir}...`);

  for (const target of TARGETS) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const url = `${BASE_URL}${target.route}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const filename = `${target.prefix}_${vp.name}.png`;
      const filePath = path.join(outDir, filename);

      await page.screenshot({ path: filePath, fullPage: true });
      const dims = readPngDimensions(filePath);
      console.log(`Saved ${filename}: exact PNG dimensions = ${dims.width} × ${dims.height} px (Viewport target: ${vp.width} px)`);

      if (dims.width !== vp.width) {
        console.error(`ERROR: Width mismatch! Expected ${vp.width} px, got ${dims.width} px`);
        process.exitCode = 1;
      }
      await page.close();
    }
  }

  // Reduced motion test on blueprint tab
  console.log('Testing reduced-motion state on /dev/aircraft blueprint tab...');
  const rmPage = await browser.newPage();
  await rmPage.emulateMedia({ reducedMotion: 'reduce' });
  await rmPage.setViewportSize({ width: 1280, height: 800 });
  await rmPage.goto(`${BASE_URL}/dev/aircraft`, { waitUntil: 'networkidle' });
  await rmPage.waitForTimeout(400);

  // Click the blueprint tab
  const blueprintBtn = rmPage.locator('button:has-text("Technical Blueprint")');
  await blueprintBtn.click();
  await rmPage.waitForTimeout(500);

  const rmPath = path.join(outDir, 'aircraft_1280px_reduced_motion.png');
  await rmPage.screenshot({ path: rmPath, fullPage: false });
  const rmDims = readPngDimensions(rmPath);
  console.log(`Saved aircraft_1280px_reduced_motion.png: ${rmDims.width} × ${rmDims.height} px`);
  await rmPage.close();

  await browser.close();
  console.log('Phase 2 screenshot capture and verification completed successfully!');
}

main().catch((err) => {
  console.error('Fatal screenshot error:', err);
  process.exit(1);
});
