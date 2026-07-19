import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { chromium } from 'playwright';

dotenv.config({ path: '.env.local' });

const projectId = process.argv[2];
const flowId = process.argv[3];

if (!projectId || !flowId) {
  console.error('Usage: node scripts/build-activepieces-demo-flow-ui.mjs <projectId> <flowId>');
  process.exit(1);
}

const email = process.env.ACTIVEPIECES_OWNER_EMAIL;
const password = process.env.ACTIVEPIECES_OWNER_PASSWORD;
if (!email || !password) {
  console.error('Missing ACTIVEPIECES_OWNER_EMAIL or ACTIVEPIECES_OWNER_PASSWORD in .env.local');
  process.exit(1);
}

const baseUrl = new URL(process.env.ACTIVEPIECES_BASE_URL).origin.replace(/\/$/, '');
const outputDir = path.resolve('.tmp/activepieces-demo');
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
});

const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

async function screenshot(name) {
  const filePath = path.join(outputDir, name);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`screenshot:${filePath}`);
}

await page.goto(`${baseUrl}/sign-in`, { waitUntil: 'networkidle' });
await screenshot('00-signin.png');
console.log(JSON.stringify({
  signInUrl: page.url(),
  signInTitle: await page.title(),
}));
await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', password);
await page.getByRole('button', { name: /sign in/i }).click();
await page.waitForLoadState('networkidle');

await page.goto(`${baseUrl}/projects/${projectId}/flows/${flowId}?newFlow=true`, { waitUntil: 'networkidle' });
await screenshot('01-open.png');

console.log(JSON.stringify({
  url: page.url(),
  title: await page.title(),
}));

await browser.close();
