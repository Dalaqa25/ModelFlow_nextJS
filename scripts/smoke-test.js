#!/usr/bin/env node
/**
 * Smoke test suite — runs before every push.
 * Tests the critical flows that have broken in production before:
 *   1. Required env vars are present and valid
 *   2. Supabase connection works with current keys
 *   3. API routes respond correctly (if dev server is running)
 *   4. Critical code paths haven't regressed
 *
 * Run manually: node scripts/smoke-test.js
 * Runs automatically on: git push (via .git/hooks/pre-push)
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  console.error(`  ✗ ${name}: ${reason}`);
}

async function check(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (e) {
    fail(name, e.message);
  }
}

// ─── 1. ENV VARS ─────────────────────────────────────────────────────────────
console.log('\n[1] Environment variables');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
];

for (const key of requiredEnvVars) {
  if (process.env[key]) {
    pass(`${key} is set`);
  } else {
    fail(`${key} is set`, 'missing — app will crash at runtime');
  }
}

if (process.env.ENCRYPTION_KEY) {
  await check('ENCRYPTION_KEY is valid 64-char hex', async () => {
    if (process.env.ENCRYPTION_KEY.length !== 64) {
      throw new Error(`length is ${process.env.ENCRYPTION_KEY.length}, expected 64`);
    }
    if (!/^[0-9a-f]+$/i.test(process.env.ENCRYPTION_KEY)) {
      throw new Error('contains non-hex characters');
    }
  });
}

// ─── 2. SUPABASE CONNECTION ───────────────────────────────────────────────────
console.log('\n[2] Supabase connection');

await check('Service role key can query automations table', async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error } = await supabase.from('automations').select('id').limit(1);
  if (error) throw new Error(error.message);
});

await check('Anon key can query active automations', async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { error } = await supabase
    .from('automations')
    .select('id')
    .eq('is_active', true)
    .limit(1);
  if (error) throw new Error(error.message);
});

// ─── 3. API ROUTES ────────────────────────────────────────────────────────────
console.log('\n[3] API routes (requires dev server on ' + BASE_URL + ')');

let serverRunning = false;
try {
  const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) });
  serverRunning = res.status < 500;
} catch {
  // server not running — skip
}

if (!serverRunning) {
  console.log('  ⚠ Dev server not running — skipping API route checks');
  console.log('    Tip: run "npm run dev" then re-run this script for full coverage');
} else {
  await check('GET /api/automations returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/automations`, { signal: AbortSignal.timeout(5000) });
    if (res.status !== 200) throw new Error(`got ${res.status}`);
  });

  await check('POST /api/automations without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/automations`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await check('GET /api/automations?mine=true without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/automations?mine=true`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });
}

// ─── 4. CODE REGRESSION CHECKS ───────────────────────────────────────────────
console.log('\n[4] Code regression checks');

await check('automation route uses token_cost not price_per_run', async () => {
  const content = readFileSync('./app/api/automations/route.js', 'utf8');
  if (content.includes("price_per_run:")) {
    throw new Error('Found price_per_run in route.js insert — should be token_cost');
  }
});

await check('execute handler uses upsert for user_automations save', async () => {
  const content = readFileSync('./lib/ai/handlers/execute.js', 'utf8');
  if (!content.includes('.upsert(')) {
    throw new Error('handleSaveBackgroundConfig should use .upsert() not .update()');
  }
});

await check('activate-background route uses upsert not update', async () => {
  const content = readFileSync('./app/api/automations/[id]/activate-background/route.js', 'utf8');
  if (!content.includes('.upsert(')) {
    throw new Error('activate-background should use .upsert() not .update()');
  }
});

await check('no hardcoded Supabase JWT in source files', async () => {
  try {
    const result = execSync(
      'grep -rl "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (result) {
      const files = result.split('\n')
        .filter(f => f && !f.includes('smoke-test.js'))
        .join(', ');
      if (files) throw new Error(`Hardcoded JWT found in: ${files}`);
    }
  } catch (e) {
    if (e.message.includes('Hardcoded JWT')) throw e;
    // grep exits with 1 when no matches — that's fine
  }
});

await check('no hardcoded Google API keys in source files', async () => {
  try {
    const result = execSync(
      'grep -rl "AIzaSy" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.json" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (result) {
      const files = result.split('\n')
        .filter(f => f && !f.includes('smoke-test.js'))
        .join(', ');
      if (files) throw new Error(`Hardcoded Google API key found in: ${files}`);
    }
  } catch (e) {
    if (e.message.includes('Hardcoded Google API key')) throw e;
  }
});

// ─── RESULTS ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Smoke test: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error('\nFailed checks:');
  failures.forEach(f => console.error(`  • ${f.name}: ${f.reason}`));
  console.error('\n🚫 Fix the above issues before pushing.\n');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed — safe to push.\n');
  process.exit(0);
}
