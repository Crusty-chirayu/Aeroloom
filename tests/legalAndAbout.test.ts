import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { siteConfig, getObfuscatedEmail } from '../lib/site-config.ts';

describe('Legal, Case Study, and Launch Readiness (Part H)', () => {
  test('siteConfig contains complete developer credentials and obfuscated email helper', () => {
    assert.equal(siteConfig.developer.name, 'Chirayu');
    assert.equal(siteConfig.developer.location, 'Bangalore, India');
    assert.ok(siteConfig.developer.links.portfolio.includes('portfolio-lac-kappa-49.vercel.app'));
    assert.ok(siteConfig.developer.links.github.includes('github.com/Crusty-chirayu'));

    const obf = getObfuscatedEmail();
    assert.equal(obf.user, 'chirayujaysawal7');
    assert.equal(obf.domain, 'gmail.com');
    assert.equal(obf.full, 'chirayujaysawal7@gmail.com');
  });

  test('all required legal, compliance, and case study pages exist and contain key disclosures', () => {
    const pages = [
      { path: 'app/terms/page.tsx', marker: 'Operational Non-Reliance' },
      { path: 'app/privacy/page.tsx', marker: 'Row Level Security' },
      { path: 'app/cookies/page.tsx', marker: 'aeroloom_watchlist_bundle_v1' },
      { path: 'app/disclaimer/page.tsx', marker: 'NOT AN APPROVED FLIGHT NAVIGATION INSTRUMENT' },
      { path: 'app/accessibility/page.tsx', marker: 'WCAG 2.2' },
      { path: 'app/about/page.tsx', marker: 'Editorial Aviation' },
      { path: 'app/contact/page.tsx', marker: 'honeypot' },
      { path: 'app/credits/page.tsx', marker: 'airplanes.live' },
      { path: 'app/status/page.tsx', marker: 'Pipeline Status' },
    ];

    for (const p of pages) {
      const fullPath = join(process.cwd(), p.path);
      assert.ok(existsSync(fullPath), `${p.path} must exist`);
      const content = readFileSync(fullPath, 'utf-8');
      assert.ok(
        content.includes(p.marker),
        `${p.path} must contain disclosure text matching '${p.marker}'`
      );
    }
  });

  test('universal SiteFooter contains developer links and legal routes', () => {
    const footerPath = join(process.cwd(), 'components', 'footer', 'SiteFooter.tsx');
    assert.ok(existsSync(footerPath), 'components/footer/SiteFooter.tsx must exist');
    const content = readFileSync(footerPath, 'utf-8');
    assert.ok(content.includes('siteConfig.developer.name'));
    assert.ok(content.includes('Bangalore, India'));
    assert.ok(content.includes('/terms'));
    assert.ok(content.includes('/privacy'));
    assert.ok(content.includes('/cookies'));
    assert.ok(content.includes('/disclaimer'));
    assert.ok(content.includes('/accessibility'));
  });

  test('sitemap.ts indexes all legal and platform routes', () => {
    const sitemapPath = join(process.cwd(), 'app', 'sitemap.ts');
    assert.ok(existsSync(sitemapPath), 'app/sitemap.ts must exist');
    const content = readFileSync(sitemapPath, 'utf-8');
    assert.ok(content.includes('/about'));
    assert.ok(content.includes('/terms'));
    assert.ok(content.includes('/privacy'));
    assert.ok(content.includes('/cookies'));
    assert.ok(content.includes('/disclaimer'));
    assert.ok(content.includes('/accessibility'));
    assert.ok(content.includes('/status'));
    assert.ok(content.includes('/contact'));
    assert.ok(content.includes('/credits'));
  });
});
