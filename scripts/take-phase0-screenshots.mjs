import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTDIR = path.resolve('docs/screenshots/phase0');
const BASE = 'http://localhost:3000';
const WIDTHS = [390, 768, 1280, 1728];

function getImageDimensions(filePath) {
  const buf = Buffer.alloc(24);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

async function main() {
  if (!fs.existsSync(OUTDIR)) {
    fs.mkdirSync(OUTDIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const proofs = [];

  for (const w of WIDTHS) {
    // /dev/kit
    {
      const context = await browser.newContext({
        viewport: { width: w, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.goto(`${BASE}/dev/kit`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      const filename = `kit_${w}px.png`;
      const filepath = path.join(OUTDIR, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      await context.close();

      const dims = getImageDimensions(filepath);
      proofs.push({ route: '/dev/kit', viewport: w, file: filename, imageWidth: dims.width, imageHeight: dims.height });
    }

    // / (landing)
    {
      const context = await browser.newContext({
        viewport: { width: w, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      const filename = `landing_${w}px.png`;
      const filepath = path.join(OUTDIR, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      await context.close();

      const dims = getImageDimensions(filepath);
      proofs.push({ route: '/', viewport: w, file: filename, imageWidth: dims.width, imageHeight: dims.height });
    }
  }

  // Reduced motion screenshot
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/dev/kit`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const filename = `kit_1280px_reduced_motion.png`;
    const filepath = path.join(OUTDIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });

    // Verify reduced motion in DOM
    const statusText = await page.locator('text=RESPECTS PREFERS-REDUCED-MOTION').textContent();
    const chipVisible = await page.locator('text=prefers-reduced-motion active').isVisible();

    await context.close();

    const dims = getImageDimensions(filepath);
    proofs.push({
      route: '/dev/kit (reduced-motion)',
      viewport: 1280,
      file: filename,
      imageWidth: dims.width,
      imageHeight: dims.height,
      note: `DOM status: "${statusText?.trim()}", chipVisible: ${chipVisible}`,
    });
  }

  await browser.close();

  console.log('\n================ SCREENSHOT DIMENSION PROOFS ================');
  console.table(proofs);
  console.log('============================================================\n');

  let allMatch = true;
  for (const p of proofs) {
    if (p.imageWidth !== p.viewport) {
      allMatch = false;
      console.error(`❌ MISMATCH: ${p.file} has imageWidth=${p.imageWidth} != viewport=${p.viewport}`);
    }
  }

  if (allMatch) {
    console.log('✅ ALL SCREENSHOT IMAGE WIDTHS EXACTLY MATCH THE REQUIRED VIEWPORT SIZES (0px overflow)!');
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
