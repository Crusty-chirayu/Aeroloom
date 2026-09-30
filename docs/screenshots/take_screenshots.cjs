const { chromium } = require('playwright');
const fs = require('fs');
const fsP = require('fs/promises');
const path = require('path');

const OUTDIR = 'E:/projects/Aeroloom/docs/screenshots/phase0';
const BASE = 'http://localhost:3000';
const WIDTHS = [390, 768, 1280, 1728];

async function getImageDimensions(filePath) {
  const buf = Buffer.alloc(24);
  const fh = await fsP.open(filePath, 'r');
  await fh.read(buf, 0, 24, 0);
  await fh.close();
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const w of WIDTHS) {
    // Kit page
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${BASE}/dev/kit`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const filename = `kit_${w}px.png`;
      const fp = `${OUTDIR}/${filename}`;
      await page.screenshot({ path: fp, fullPage: true });
      await page.close();
      const dims = await getImageDimensions(fp);
      results.push({ page: '/dev/kit', viewportW: w, file: filename, imgW: dims.width, imgH: dims.height });
    }
    // Landing page
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const filename = `landing_${w}px.png`;
      const fp = `${OUTDIR}/${filename}`;
      await page.screenshot({ path: fp, fullPage: true });
      await page.close();
      const dims = await getImageDimensions(fp);
      results.push({ page: '/', viewportW: w, file: filename, imgW: dims.width, imgH: dims.height });
    }
  }

  // Reduced motion test
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${BASE}/dev/kit`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const rmChip = await page.locator('text=prefers-reduced-motion active').isVisible();
    const filename = 'kit_1280px_reduced_motion.png';
    const fp = `${OUTDIR}/${filename}`;
    await page.screenshot({ path: fp, fullPage: true });
    await page.close();
    const dims = await getImageDimensions(fp);
    results.push({
      page: '/dev/kit (reduced-motion emulated)',
      viewportW: 1280,
      file: filename,
      imgW: dims.width,
      imgH: dims.height,
      reducedMotionChipVisible: rmChip,
    });
  }

  await browser.close();

  console.log('\n=== SCREENSHOT RESULTS ===');
  for (const r of results) {
    const rmNote = r.reducedMotionChipVisible !== undefined
      ? ` | reduced-motion-chip-visible=${r.reducedMotionChipVisible}`
      : '';
    console.log(`[${r.page}] viewport=${r.viewportW}px → file=${r.file} → image dimensions=${r.imgW}×${r.imgH}px${rmNote}`);
  }
}

main().catch(e => { console.error(e.stack || e); process.exit(1); });
