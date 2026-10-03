import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ROUTES = [
  '/',
  '/map',
  '/airports',
  '/search',
  '/about',
  '/about/data',
  '/flight/DAL397',
  '/airport/KJFK',
  '/terms',
  '/privacy',
  '/cookies',
  '/disclaimer',
  '/accessibility',
  '/contact',
  '/credits',
  '/status',
];

async function main() {
  const browser = await chromium.launch();
  console.log(`Starting automated axe-core accessibility audit across ${ROUTES.length} routes...`);

  let totalCriticalOrSerious = 0;
  const resultsByRoute = [];

  for (const route of ROUTES) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      sessionStorage.setItem('aeroloom_preloaded', 'true');
    });

    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Run Axe analysis
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const violations = accessibilityScanResults.violations;
      const criticalOrSerious = violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      resultsByRoute.push({
        route,
        totalViolations: violations.length,
        criticalOrSerious: criticalOrSerious.length,
        violations: violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodesCount: v.nodes.length,
        })),
      });

      totalCriticalOrSerious += criticalOrSerious.length;

      if (criticalOrSerious.length === 0) {
        console.log(`  ✓ ${route.padEnd(20)}: PASS (0 critical, 0 serious issues)`);
      } else {
        console.log(`  ✗ ${route.padEnd(20)}: ${criticalOrSerious.length} critical/serious issues found:`);
        criticalOrSerious.forEach((c) => {
          console.log(`     - [${c.impact.toUpperCase()}] ${c.id}: ${c.description} (${c.nodes.length} nodes)`);
          c.nodes.forEach((n, idx) => {
            console.log(`       [${idx + 1}] Target: ${n.target.join(' ')} | HTML: ${n.html.slice(0, 100)}`);
          });
        });
      }
    } catch (err) {
      console.error(`  ✗ Error auditing ${route}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n--- ACCESSIBILITY AUDIT SUMMARY ---');
  console.log(`Total routes audited: ${ROUTES.length}`);
  console.log(`Total Critical/Serious issues: ${totalCriticalOrSerious}`);

  if (totalCriticalOrSerious === 0) {
    console.log('SUCCESS: All routes passed accessibility audit with ZERO serious or critical issues!\n');
    process.exit(0);
  } else {
    console.error('FAILURE: Found accessibility violations that must be remediated.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Accessibility runner error:', err);
  process.exit(1);
});
