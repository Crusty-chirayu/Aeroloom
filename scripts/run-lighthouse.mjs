import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const routes = [
  { path: '/', name: 'landing' },
  { path: '/map', name: 'map' },
  { path: '/flight/DAL397', name: 'flight' },
  { path: '/airport/KJFK', name: 'airport' }
];

const results = {};

for (const route of routes) {
  const url = `http://localhost:3000${route.path}`;
  const outPath = path.resolve(`docs/lh_${route.name}.json`);
  console.log(`Running Lighthouse on ${url}...`);

  try {
    // Run lighthouse CLI with mobile throttling
    execSync(`npx lighthouse ${url} --output=json --output-path="${outPath}" --only-categories=accessibility,best-practices,seo,performance --form-factor=mobile --chrome-flags="--headless --no-sandbox" --quiet`, {
      stdio: 'pipe',
      timeout: 120000
    });
  } catch (err) {
    // If temp cleanup threw EPERM on Windows, verify if json was written
    if (!fs.existsSync(outPath)) {
      console.error(`Error running lighthouse on ${url}:`, err.message);
    }
  }

  if (fs.existsSync(outPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      results[route.path] = {
        performance: Math.round(data.categories.performance?.score * 100 || 0),
        accessibility: Math.round(data.categories.accessibility?.score * 100 || 0),
        bestPractices: Math.round(data.categories['best-practices']?.score * 100 || 0),
        seo: Math.round(data.categories.seo?.score * 100 || 0),
      };
      console.log(`✓ ${route.path} -> Perf: ${results[route.path].performance}, A11y: ${results[route.path].accessibility}, BestPractices: ${results[route.path].bestPractices}, SEO: ${results[route.path].seo}`);
    } catch (parseErr) {
      console.error(`Failed to parse report for ${route.name}:`, parseErr.message);
    }
  }
}

fs.writeFileSync('docs/lighthouse_scores.json', JSON.stringify(results, null, 2));
console.log('Saved all scores to docs/lighthouse_scores.json');
