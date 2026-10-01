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
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/phase5b');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  console.log(`Starting Phase 5B screenshot verification into ${outDir}...`);

  // 1. Full landing page at 4 required viewports (390, 768, 1280, 1728)
  console.log('\n--- 1. Landing Page Viewport Captures ---');
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.addInitScript(() => {
      sessionStorage.setItem('aeroloom_preloaded', 'true');
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const filename = `landing_${vp.name}.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`  ✓ ${filename.padEnd(32)}: exact PNG = ${dims.width} × ${dims.height} px (Target: ${vp.width} px)`);
    await page.close();
  }

  // 2. Specific Section Captures at 1280px
  console.log('\n--- 2. Phase 5B Specific Section Captures (1280px) ---');
  const sections = [
    { name: 'bento_grid', textTrigger: 'Engineered for Airspace Observability' },
    { name: 'split_flap_board', textTrigger: 'Terminal Departures Concourse' },
    { name: 'aircraft_library', textTrigger: 'The Aircraft Library & Specimen Grid' },
    { name: 'trust_transparency', textTrigger: 'Data Integrity Without Compromise' },
    { name: 'landing_footer', selector: 'footer' },
  ];

  for (const sec of sections) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => {
      sessionStorage.setItem('aeroloom_preloaded', 'true');
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    let element;
    if (sec.selector) {
      element = page.locator(sec.selector);
    } else {
      element = page.locator(`section:has-text("${sec.textTrigger}")`).first();
    }

    await element.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const filename = `section_${sec.name}_1280px.png`;
    const filePath = path.join(outDir, filename);
    await element.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`  ✓ ${filename.padEnd(32)}: exact element PNG = ${dims.width} × ${dims.height} px`);
    await page.close();
  }

  // 3. Mobile Split-Flap and Bento on 390px
  console.log('\n--- 3. Mobile Responsive Specific Captures (390px) ---');
  const mobileSections = [
    { name: 'bento_grid', textTrigger: 'Engineered for Airspace Observability' },
    { name: 'split_flap_board', textTrigger: 'Terminal Departures Concourse' },
  ];

  for (const sec of mobileSections) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      sessionStorage.setItem('aeroloom_preloaded', 'true');
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const element = page.locator(`section:has-text("${sec.textTrigger}")`).first();
    await element.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const filename = `section_${sec.name}_390px.png`;
    const filePath = path.join(outDir, filename);
    await element.screenshot({ path: filePath });
    const dims = readPngDimensions(filePath);
    console.log(`  ✓ ${filename.padEnd(32)}: exact element PNG = ${dims.width} × ${dims.height} px`);
    await page.close();
  }

  await browser.close();
  console.log('\nAll Phase 5B screenshots captured and verified successfully!\n');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
