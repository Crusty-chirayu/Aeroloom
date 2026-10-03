#!/usr/bin/env node

/**
 * Aeroloom Launch Readiness Verification Script
 *
 * Runs comprehensive pre-flight verification across routes, metadata,
 * brand assets, legal compliance pages, and configuration hygiene.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

console.log('✈️  AEROLOOM PRE-FLIGHT LAUNCH READINESS AUDIT');
console.log('================================================\n');

let failed = false;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed = true;
  }
}

// 1. Mandatory Core Routes
console.log('1. Checking Mandatory Application & Legal Routes:');
const requiredRoutes = [
  'app/page.tsx',
  'app/map/page.tsx',
  'app/airports/page.tsx',
  'app/search/page.tsx',
  'app/about/page.tsx',
  'app/about/data/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/cookies/page.tsx',
  'app/disclaimer/page.tsx',
  'app/accessibility/page.tsx',
  'app/contact/page.tsx',
  'app/credits/page.tsx',
  'app/status/page.tsx',
];

for (const route of requiredRoutes) {
  check(route, existsSync(join(root, route)));
}

// 2. Brand Assets & Favicons
console.log('\n2. Checking Brand Assets, Icons & Metadata:');
check('app/icon.svg', existsSync(join(root, 'app', 'icon.svg')));
check('app/apple-icon.tsx', existsSync(join(root, 'app', 'apple-icon.tsx')));
check('app/manifest.ts', existsSync(join(root, 'app', 'manifest.ts')));
check('app/robots.ts', existsSync(join(root, 'app', 'robots.ts')));
check('app/sitemap.ts', existsSync(join(root, 'app', 'sitemap.ts')));
check('app/opengraph-image.tsx', existsSync(join(root, 'app', 'opengraph-image.tsx')));
check('app/flight/[flightId]/opengraph-image.tsx', existsSync(join(root, 'app', 'flight', '[flightId]', 'opengraph-image.tsx')));
check('app/airport/[code]/opengraph-image.tsx', existsSync(join(root, 'app', 'airport', '[code]', 'opengraph-image.tsx')));
check('components/brand/AeroloomLogo.tsx', existsSync(join(root, 'components', 'brand', 'AeroloomLogo.tsx')));
check('components/footer/SiteFooter.tsx', existsSync(join(root, 'components', 'footer', 'SiteFooter.tsx')));

// 3. Documentation & Verification Artifacts
console.log('\n3. Checking Production Documentation:');
check('docs/BRAND.md', existsSync(join(root, 'docs', 'BRAND.md')));
check('docs/DEPLOY.md', existsSync(join(root, 'docs', 'DEPLOY.md')));
check('docs/AUTH_SETUP.md', existsSync(join(root, 'docs', 'AUTH_SETUP.md')));
check('docs/data-sources.md', existsSync(join(root, 'docs', 'data-sources.md')));
check('docs/FINAL_PROGRESS.md', existsSync(join(root, 'docs', 'FINAL_PROGRESS.md')));
check('.env.example', existsSync(join(root, '.env.example')));

// 4. Configuration Hygiene & No Unhandled Placeholders
console.log('\n4. Checking Site Configuration & Developer Bindings:');
const siteConfigPath = join(root, 'lib', 'site-config.ts');
if (existsSync(siteConfigPath)) {
  const content = readFileSync(siteConfigPath, 'utf-8');
  check('siteConfig developer name defined', content.includes("name: 'Chirayu'"));
  check('siteConfig developer email defined', content.includes("chirayujaysawal7@gmail.com"));
  check('siteConfig portfolio link defined', content.includes("portfolio-lac-kappa-49.vercel.app"));
  check('siteConfig owner placeholders localized', content.includes('TODO_OWNER'));
} else {
  check('lib/site-config.ts exists', false);
}

console.log('\n================================================');
if (failed) {
  console.error('❌ PRE-FLIGHT AUDIT FAILED: Resolve issues before deployment.\n');
  process.exit(1);
} else {
  console.log('✨ ALL LAUNCH READINESS CHECKS PASSED: Airspace cleared for departure!\n');
  process.exit(0);
}
