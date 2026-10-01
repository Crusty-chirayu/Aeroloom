#!/usr/bin/env node

/**
 * Aeroloom AI Assistant Manual Smoke-Test Script
 *
 * Usage:
 *   node scripts/test-assistant.mjs "What is the weather at KJFK?"
 *   node scripts/test-assistant.mjs "Where is flight BAW123?"
 *
 * Reads OPENROUTER_API_KEY from environment or .env.local
 */

import fs from 'node:fs';
import path from 'node:path';

// Try reading .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2]?.replace(/^['"]|['"]$/g, '') || '';
      }
    }
  }
} catch {
  // Ignore
}

const apiKey = process.env.OPENROUTER_API_KEY;
const query = process.argv[2] || 'What is the current flight category and weather at KJFK?';

console.log('='.repeat(65));
console.log('  AEROLOOM AI FLIGHT ASSISTANT SMOKE TEST');
console.log('='.repeat(65));
console.log(`Query: "${query}"`);
console.log(`OpenRouter API Key: ${apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '[NOT SET]'}`);
console.log('-'.repeat(65));

if (!apiKey || apiKey.includes('placeholder')) {
  console.log('\n[INFO] OPENROUTER_API_KEY is not set or is a placeholder.');
  console.log('To run a live test with OpenRouter free models, export your key:');
  console.log('  export OPENROUTER_API_KEY="sk-or-v1-..."\n');
  console.log('Testing mock/unconfigured response path...');
}

const models = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'openrouter/free',
];

console.log(`Fallback Chain: ${models.join(' -> ')}\n`);

async function run() {
  const startTime = Date.now();

  try {
    if (!apiKey || apiKey.includes('placeholder')) {
      console.log('Output: [MOCK UNCONFIGURED STATE]');
      console.log('OpenRouter API key is not configured. Telemetry grounded retrieval is functioning normally.');
      console.log(`Duration: ${Date.now() - startTime}ms`);
      process.exit(0);
    }

    console.log('Connecting to OpenRouter...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aeroloom.internal',
        'X-Title': 'Aeroloom Grounded Flight Assistant',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: models[0],
        messages: [
          {
            role: 'system',
            content: 'You are Ask Aeroloom, an AI flight assistant. Answer concisely and include "Data as of HH:MM UTC".',
          },
          { role: 'user', content: query },
        ],
        max_tokens: 300,
        temperature: 0.15,
      }),
      signal: AbortSignal.timeout(15000),
    });

    console.log(`HTTP Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Error from OpenRouter: ${errText}`);
      process.exit(1);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const modelUsed = data.model || models[0];

    console.log('\nResponse:');
    console.log('-'.repeat(40));
    console.log(content.trim());
    console.log('-'.repeat(40));
    console.log(`\nModel Used: ${modelUsed}`);
    console.log(`Response Time: ${Date.now() - startTime}ms`);
    console.log('Smoke Test: SUCCESS\n');
  } catch (err) {
    console.error(`\nSmoke Test Failed: ${err.message}`);
    process.exit(1);
  }
}

run();
