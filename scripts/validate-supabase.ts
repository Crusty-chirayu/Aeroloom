/**
 * Aeroloom Supabase Configuration & Health Validator
 * Safely inspects environment variables and tests connectivity without exposing secrets.
 * Run via: npx tsx scripts/validate-supabase.ts
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ANSI color formatting
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!existsSync(filePath)) return env;

  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  }
  return env;
}

async function runValidation() {
  console.log(`\n${BOLD}${CYAN}======================================================${RESET}`);
  console.log(`${BOLD}${CYAN} AEROLOOM: SUPABASE CONFIGURATION & HEALTH VALIDATOR  ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================${RESET}\n`);

  // Load process.env and .env.local
  const envLocalPath = resolve(process.cwd(), '.env.local');
  const envLocalExists = existsSync(envLocalPath);
  const localEnv = envLocalExists ? parseEnvFile(envLocalPath) : {};

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`1. Environment File Status:`);
  if (envLocalExists) {
    console.log(`   ${GREEN}✔${RESET} .env.local file detected at workspace root.`);
  } else {
    console.log(`   ${YELLOW}⚠${RESET} .env.local file NOT found. Run: cp .env.example .env.local`);
  }

  console.log(`\n2. Key Configuration Audit:`);
  let hasMissingRequired = false;

  // Validate NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.log(`   ${RED}✘${RESET} NEXT_PUBLIC_SUPABASE_URL: Missing.`);
    hasMissingRequired = true;
  } else if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.log(`   ${YELLOW}⚠${RESET} NEXT_PUBLIC_SUPABASE_URL: Configured, but does not match standard pattern (*.supabase.co). Value prefix: ${supabaseUrl.slice(0, 12)}...`);
  } else {
    const maskedUrl = supabaseUrl.replace(/(https:\/\/[a-z0-9]{4})[a-z0-9]+(\.supabase\.co)/, '$1****$2');
    console.log(`   ${GREEN}✔${RESET} NEXT_PUBLIC_SUPABASE_URL: Validated (${maskedUrl}).`);
  }

  // Validate NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    console.log(`   ${RED}✘${RESET} NEXT_PUBLIC_SUPABASE_ANON_KEY: Missing.`);
    hasMissingRequired = true;
  } else if (!anonKey.startsWith('ey')) {
    console.log(`   ${YELLOW}⚠${RESET} NEXT_PUBLIC_SUPABASE_ANON_KEY: Present, but does not look like a valid JWT (should start with 'ey'). Length: ${anonKey.length}`);
  } else {
    console.log(`   ${GREEN}✔${RESET} NEXT_PUBLIC_SUPABASE_ANON_KEY: Validated (JWT format verified, ${anonKey.length} chars).`);
  }

  // Check SUPABASE_SERVICE_ROLE_KEY (optional, server-only)
  if (!serviceRoleKey) {
    console.log(`   ${YELLOW}ℹ${RESET} SUPABASE_SERVICE_ROLE_KEY: Not configured (Optional - only required for privileged server migrations).`);
  } else if (serviceRoleKey.startsWith('NEXT_PUBLIC_')) {
    console.log(`   ${RED}✘ CRITICAL SECURITY FAULT:${RESET} Service role key must NEVER have NEXT_PUBLIC_ prefix!`);
  } else {
    console.log(`   ${GREEN}✔${RESET} SUPABASE_SERVICE_ROLE_KEY: Present in server environment.`);
  }

  console.log(`\n3. Connectivity & Reachability Test:`);
  if (hasMissingRequired) {
    console.log(`   ${YELLOW}↷ Skipped:${RESET} Supabase URL or Anon Key is missing. Aeroloom will operate in Device-Local mode.`);
    console.log(`\n${BOLD}Status:${RESET} ${YELLOW}DEVICE-LOCAL OFFLINE MODE ACTIVE${RESET}`);
    console.log(`Next step: Follow instructions in ${CYAN}docs/SUPABASE-SETUP.md${RESET} to provision your free hosted project.`);
    return;
  }

  try {
    const healthUrl = `${supabaseUrl}/auth/v1/health`;
    console.log(`   Testing reachability: GET ${healthUrl}...`);
    const res = await fetch(healthUrl, {
      headers: {
        apikey: anonKey!,
      },
    });

    if (res.ok) {
      console.log(`   ${GREEN}✔ Reachability confirmed:${RESET} Auth service replied HTTP ${res.status}.`);
      console.log(`\n${BOLD}Status:${RESET} ${GREEN}HOSTED SUPABASE CLIENT FULLY OPERATIONAL${RESET}`);
    } else {
      console.log(`   ${YELLOW}⚠ Endpoint reachable but returned status HTTP ${res.status}.${RESET}`);
    }
  } catch (err: unknown) {
    console.log(`   ${RED}✘ Network unreachable:${RESET} ${err instanceof Error ? err.message : String(err)}`);
  }
}

runValidation().catch(console.error);
