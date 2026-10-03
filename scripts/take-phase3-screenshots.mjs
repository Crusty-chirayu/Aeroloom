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
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/phase3');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  console.log(`Starting Phase 3 screenshot capture into ${outDir}...`);

  // 1. Idle Map at all 4 viewports
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Allow MapLibre canvas tiles to settle

    const filename = `map_idle_${vp.name}.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`Saved ${filename}: exact PNG dimensions = ${dims.width} × ${dims.height} px (Target: ${vp.width} px)`);
    if (dims.width !== vp.width) {
      console.error(`ERROR: Width mismatch on ${filename}!`);
      process.exitCode = 1;
    }
    await page.close();
  }

  // 2. Selected Flight with dossier panel (Desktop 1280px)
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    // Pass flight query param to open panel immediately
    await page.goto(`${BASE_URL}/map?flight=a38d95`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const filename = `map_selected_flight_1280px.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`Saved ${filename}: exact PNG dimensions = ${dims.width} × ${dims.height} px`);
    await page.close();
  }

  // 3. Mobile Bottom Sheet Peek & Half (Mobile 390px)
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/map?flight=a38d95`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const filename = `map_mobile_sheet_half_390px.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`Saved ${filename}: exact PNG dimensions = ${dims.width} × ${dims.height} px`);
    await page.close();
  }

  // 4. Command Palette Open (Desktop 1280px)
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    // Open palette with / shortcut
    await page.keyboard.press('/');
    await page.waitForTimeout(600);

    const filename = `map_palette_open_1280px.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`Saved ${filename}: exact PNG dimensions = ${dims.width} × ${dims.height} px`);
    await page.close();
  }

  // 5. Reduced-Motion Check
  {
    const page = await browser.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const filename = `map_reduced_motion_1280px.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`Saved ${filename}: exact PNG dimensions = ${dims.width} × ${dims.height} px`);
    await page.close();
  }

  await browser.close();
  console.log('Phase 3 screenshot capture complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
