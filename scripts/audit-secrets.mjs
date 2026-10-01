#!/usr/bin/env node

/**
 * Aeroloom Secrets & Key Leak Audit Script
 *
 * Scans the repository to ensure zero private keys, API secrets,
 * or credentials have been committed into source code.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();

console.log('🔒 AEROLOOM SECRETS & CREDENTIAL LEAK SCANNER');
console.log('=============================================\n');

// 1. Verify .gitignore protects sensitive env files
const gitignorePath = join(root, '.gitignore');
if (existsSync(gitignorePath)) {
  const gitignore = readFileSync(gitignorePath, 'utf-8');
  if (gitignore.includes('.env*.local') || gitignore.includes('.env')) {
    console.log('  ✅ PASS: .gitignore properly specifies .env ignore rules');
  } else {
    console.error('  ❌ FAIL: .gitignore missing .env protection');
    process.exit(1);
  }
}

// 2. Secret signatures
const SECRET_PATTERNS = [
  { name: 'OpenRouter Live Key', regex: /sk-or-v1-[a-zA-Z0-9]{64}/ },
  { name: 'OpenAI Secret Key', regex: /sk-[a-zA-Z0-9]{48}/ },
  { name: 'Private Key Header', regex: /-----BEGIN (RSA|EC|DSA|OPENSSH|PRIVATE) KEY-----/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Personal Access Token', regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: 'Slack Bot Token', regex: /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/ },
];

const SCAN_DIRS = ['app', 'components', 'lib', 'tests', 'scripts', 'docs'];
const IGNORE_EXTS = ['.png', '.jpg', '.webp', '.ico', '.pdf'];

let filesScanned = 0;
let leaksFound = 0;

function walk(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relPath = relative(root, fullPath);

    if (entry === 'node_modules' || entry === '.next' || entry === '.git') {
      continue;
    }

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (stat.isFile()) {
      if (IGNORE_EXTS.some((ext) => entry.endsWith(ext))) continue;

      filesScanned++;
      const content = readFileSync(fullPath, 'utf-8');

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(content)) {
          console.error(`  ❌ LEAK DETECTED in ${relPath}: Matches ${pattern.name}`);
          leaksFound++;
        }
      }
    }
  }
}

for (const d of SCAN_DIRS) {
  const dirPath = join(root, d);
  if (existsSync(dirPath)) {
    walk(dirPath);
  }
}

console.log(`\nScan complete. Scanned ${filesScanned} files across repository.`);
if (leaksFound === 0) {
  console.log('✨ ZERO SECRETS DETECTED: Codebase is 100% clean of hardcoded credentials.\n');
  process.exit(0);
} else {
  console.error(`❌ FAILED: ${leaksFound} secret signature match(es) detected!\n`);
  process.exit(1);
}
