import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VIEWPORT_WIDTHS = [360, 390, 768, 1280, 1728];
const ROUTES = [
  '/',
  '/dev/kit',
  '/dev/aircraft',
  '/dev/icons',
  '/map',
  '/search',
  '/airports',
  '/about/data',
  '/flight/DAL397',
  '/airport/KJFK',
];

async function main() {
  console.log(`Checking horizontal overflow across ${ROUTES.length} routes at ${VIEWPORT_WIDTHS.length} viewports...`);
  const browser = await chromium.launch();
  let hasFailure = false;
  const summary = [];

  for (const route of ROUTES) {
    process.stdout.write(`Checking ${route.padEnd(16)}: `);
    let routeOk = true;

    for (const width of VIEWPORT_WIDTHS) {
      const page = await browser.newPage();
      await page.setViewportSize({ width, height: 900 });
      const url = `${BASE_URL}${route}`;

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(600);

        const check = await page.evaluate((vpW) => {
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body ? document.body.scrollWidth : 0;
          const maxW = Math.max(docW, bodyW);
          const overflows = [];

          if (maxW > vpW) {
            document.querySelectorAll('*').forEach((el) => {
              const r = el.getBoundingClientRect();
              if (r.right > vpW + 1) {
                overflows.push({
                  tag: el.tagName,
                  className: (el.className || '').toString().slice(0, 50),
                  right: Math.round(r.right),
                  width: Math.round(r.width),
                });
              }
            });
          }

          return { maxW, docW, bodyW, overflows: overflows.slice(0, 5) };
        }, width);

        const isOk = check.maxW <= width;
        summary.push({ route, width, maxW: check.maxW, isOk });

        if (!isOk) {
          routeOk = false;
          hasFailure = true;
          console.error(
            `\n   ❌ OVERFLOW on ${route} at ${width}px! (scrollWidth: ${check.maxW}px, delta: +${check.maxW - width}px)`
          );
          if (check.overflows.length > 0) {
            console.error('      Culprits:', JSON.stringify(check.overflows));
          }
        }
      } catch (err) {
        routeOk = false;
        console.error(`\n   ⚠️ Error loading ${route} at ${width}px:`, err.message);
      } finally {
        await page.close();
      }
    }

    if (routeOk) {
      console.log('✓ PASS [360, 390, 768, 1280, 1728]');
    }
  }

  await browser.close();

  console.log('\n--- OVERFLOW CHECK SUMMARY ---');
  let passCount = 0;
  for (const s of summary) {
    if (s.isOk) {
      passCount++;
    }
  }
  console.log(`Passed: ${passCount} / ${summary.length}`);

  if (hasFailure) {
    console.error('FAILED: Horizontal overflow detected on one or more routes.');
    process.exit(1);
  } else {
    console.log('SUCCESS: All routes passed zero horizontal overflow check at all target viewports!');
  }
}

main().catch((err) => {
  console.error('Fatal error running overflow check:', err);
  process.exit(1);
});
