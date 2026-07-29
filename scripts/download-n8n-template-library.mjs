#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_OUTPUT_DIR = path.join(PROJECT_ROOT, 'data', 'n8n-template-library');
const CATALOG_URL = 'https://n8n.io/api/product-api/workflows/search';
const TEMPLATE_URL = 'https://api.n8n.io/api/workflows/templates';
const USER_AGENT = 'ModelGrowTemplateImporter/1.0 (+https://modelgrow.com)';
const CATALOG_PAGE_SIZE = 250;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArguments(argv) {
  const options = {
    outputDir: DEFAULT_OUTPUT_DIR,
    concurrency: 3,
    delayMs: 250,
    limit: null,
    includePaid: false,
    metadataOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--include-paid') {
      options.includePaid = true;
    } else if (argument === '--metadata-only') {
      options.metadataOnly = true;
    } else if (argument === '--output') {
      options.outputDir = path.resolve(argv[index + 1]);
      index += 1;
    } else if (argument === '--concurrency') {
      options.concurrency = parsePositiveInteger(argv[index + 1], options.concurrency);
      index += 1;
    } else if (argument === '--delay-ms') {
      options.delayMs = parsePositiveInteger(argv[index + 1], options.delayMs);
      index += 1;
    } else if (argument === '--limit') {
      options.limit = parsePositiveInteger(argv[index + 1], null);
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Download n8n's public workflow-template catalog as native workflow JSON.

Usage:
  node scripts/download-n8n-template-library.mjs [options]

Options:
  --output <directory>   Destination directory
  --concurrency <count>  Parallel template downloads (default: 3)
  --delay-ms <ms>        Delay after each request per worker (default: 250)
  --limit <count>        Download only the first N selected templates
  --metadata-only        Fetch catalog metadata without workflow JSON
  --include-paid         Include paid listings (off by default)
  --help                 Show this help

The downloader is resumable. Existing valid workflow files are verified and skipped.
`);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelay(attempt, retryAfterHeader) {
  const retryAfter = Number.parseFloat(retryAfterHeader || '');
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.ceil(retryAfter * 1000);
  }
  return Math.min(30_000, 750 * (2 ** attempt));
}

async function fetchJson(url, { attempts = 5 } = {}) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} for ${url}`);
        error.status = response.status;
        error.retryAfter = response.headers.get('retry-after');
        throw error;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      const permanent = error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429;
      if (permanent || attempt === attempts - 1) break;
      await sleep(retryDelay(attempt, error.retryAfter));
    }
  }

  throw lastError;
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, filePath);
}

async function readValidWorkflowFile(filePath) {
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile() || fileStats.size < 20) return null;
    const serialized = await readFile(filePath, 'utf8');
    const workflow = JSON.parse(serialized);
    return Array.isArray(workflow?.nodes) && workflow?.connections && typeof workflow.connections === 'object'
      ? serialized
      : null;
  } catch {
    return null;
  }
}

function isFreeTemplate(template) {
  const price = Number(template?.price);
  return template?.price == null || template?.purchaseUrl == null || !Number.isFinite(price) || price <= 0;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function compactNode(node) {
  return {
    id: node?.id ?? null,
    name: node?.name || null,
    displayName: node?.displayName || node?.defaults?.name || null,
  };
}

function compactCatalogEntry(template) {
  return {
    id: template.id,
    name: template.name,
    description: template.description || '',
    createdAt: template.createdAt || null,
    totalViews: template.totalViews ?? null,
    price: template.price ?? null,
    purchaseUrl: template.purchaseUrl || null,
    free: isFreeTemplate(template),
    sourceUrl: `https://n8n.io/workflows/${template.id}-${slugify(template.name)}/`,
    creator: template.user
      ? {
          id: template.user.id ?? null,
          name: template.user.name || null,
          username: template.user.username || null,
          verified: Boolean(template.user.verified),
        }
      : null,
    nodes: Array.isArray(template.nodes) ? template.nodes.map(compactNode) : [],
  };
}

async function fetchCatalog() {
  const firstUrl = new URL(CATALOG_URL);
  firstUrl.searchParams.set('rows', String(CATALOG_PAGE_SIZE));
  firstUrl.searchParams.set('page', '1');
  firstUrl.searchParams.set('sort', 'createdAt:desc');

  const firstPage = await fetchJson(firstUrl);
  const total = Number(firstPage.totalWorkflows || 0);
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const templates = [...(firstPage.workflows || [])];

  console.log(`Catalog reports ${total} templates across ${pageCount} pages.`);

  for (let page = 2; page <= pageCount; page += 1) {
    const url = new URL(CATALOG_URL);
    url.searchParams.set('rows', String(CATALOG_PAGE_SIZE));
    url.searchParams.set('page', String(page));
    url.searchParams.set('sort', 'createdAt:desc');
    const response = await fetchJson(url);
    templates.push(...(response.workflows || []));
    console.log(`Catalog page ${page}/${pageCount}: ${templates.length} records collected.`);
    await sleep(100);
  }

  const uniqueTemplates = Array.from(
    new Map(templates.map((template) => [String(template.id), template])).values(),
  );

  return {
    reportedTotal: total,
    templates: uniqueTemplates.map(compactCatalogEntry),
  };
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function downloadTemplate(template, workflowDirectory) {
  const filePath = path.join(workflowDirectory, `${template.id}.json`);
  const existing = await readValidWorkflowFile(filePath);
  if (existing) {
    return {
      ...template,
      status: 'existing',
      localPath: `workflows/${template.id}.json`,
      sha256: sha256(existing),
    };
  }

  const detail = await fetchJson(`${TEMPLATE_URL}/${template.id}`);
  if (!detail?.workflow || !Array.isArray(detail.workflow.nodes) || !detail.workflow.connections) {
    throw new Error(`Template ${template.id} did not return a valid n8n workflow`);
  }

  const serialized = `${JSON.stringify(detail.workflow, null, 2)}\n`;
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, serialized, 'utf8');
  await rename(temporaryPath, filePath);

  return {
    ...template,
    status: 'downloaded',
    localPath: `workflows/${template.id}.json`,
    sha256: sha256(serialized),
    workflowName: detail.name || template.name,
    nodeCount: detail.workflow.nodes.length,
  };
}

async function runWorkerPool(templates, workerCount, worker) {
  const results = new Array(templates.length);
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = cursor;
      cursor += 1;
      if (currentIndex >= templates.length) return;
      results[currentIndex] = await worker(templates[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(workerCount, templates.length) }, () => runWorker()),
  );
  return results;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const workflowDirectory = path.join(options.outputDir, 'workflows');
  await mkdir(workflowDirectory, { recursive: true });

  const catalog = await fetchCatalog();
  await writeJsonAtomic(path.join(options.outputDir, 'catalog-all.json'), {
    fetchedAt: new Date().toISOString(),
    source: CATALOG_URL,
    reportedTotal: catalog.reportedTotal,
    collectedTotal: catalog.templates.length,
    templates: catalog.templates,
  });

  const freeTemplates = catalog.templates.filter(isFreeTemplate);
  const paidTemplates = catalog.templates.filter((template) => !isFreeTemplate(template));
  let selectedTemplates = options.includePaid ? catalog.templates : freeTemplates;
  if (options.limit) selectedTemplates = selectedTemplates.slice(0, options.limit);

  await writeJsonAtomic(path.join(options.outputDir, 'catalog-selected.json'), {
    fetchedAt: new Date().toISOString(),
    includePaid: options.includePaid,
    selectedTotal: selectedTemplates.length,
    templates: selectedTemplates,
  });

  console.log(
    `Selected ${selectedTemplates.length} templates ` +
    `(${freeTemplates.length} free, ${paidTemplates.length} paid catalog entries).`,
  );

  if (options.metadataOnly) {
    await writeJsonAtomic(path.join(options.outputDir, 'summary.json'), {
      completedAt: new Date().toISOString(),
      metadataOnly: true,
      reportedTotal: catalog.reportedTotal,
      collectedTotal: catalog.templates.length,
      freeTotal: freeTemplates.length,
      paidTotal: paidTemplates.length,
      selectedTotal: selectedTemplates.length,
    });
    return;
  }

  let completed = 0;
  let downloaded = 0;
  let existing = 0;
  let failed = 0;

  const manifest = await runWorkerPool(
    selectedTemplates,
    options.concurrency,
    async (template) => {
      let result;
      try {
        result = await downloadTemplate(template, workflowDirectory);
        if (result.status === 'downloaded') downloaded += 1;
        if (result.status === 'existing') existing += 1;
      } catch (error) {
        failed += 1;
        result = {
          ...template,
          status: 'failed',
          error: error.message,
        };
      }

      completed += 1;
      if (completed === 1 || completed % 50 === 0 || completed === selectedTemplates.length) {
        console.log(
          `Progress ${completed}/${selectedTemplates.length} ` +
          `(downloaded ${downloaded}, existing ${existing}, failed ${failed})`,
        );
      }
      if (result.status !== 'existing') await sleep(options.delayMs);
      return result;
    },
  );

  await writeJsonAtomic(path.join(options.outputDir, 'manifest.json'), {
    completedAt: new Date().toISOString(),
    source: CATALOG_URL,
    includePaid: options.includePaid,
    entries: manifest,
  });

  await writeJsonAtomic(path.join(options.outputDir, 'summary.json'), {
    completedAt: new Date().toISOString(),
    metadataOnly: false,
    reportedTotal: catalog.reportedTotal,
    collectedTotal: catalog.templates.length,
    freeTotal: freeTemplates.length,
    paidTotal: paidTemplates.length,
    selectedTotal: selectedTemplates.length,
    downloaded,
    existing,
    failed,
  });

  if (failed > 0) {
    console.error(`${failed} templates failed. Re-run the command to retry them.`);
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
