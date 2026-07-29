#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_ACTIVEPIECES_URL = 'https://activepieces.modelgrow.com';
const CLOUD_APPS_URL = 'https://secrets.activepieces.com/apps';

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

function oauthAuthEntries(auth) {
  const entries = Array.isArray(auth) ? auth : [auth].filter(Boolean);
  return entries.filter((entry) => entry?.type === 'OAUTH2');
}

async function main() {
  const activepiecesUrl = (
    argumentValue('--activepieces-url') ||
    process.env.ACTIVEPIECES_PUBLIC_URL ||
    DEFAULT_ACTIVEPIECES_URL
  ).replace(/\/+$/, '');
  const outputPath = argumentValue('--output');

  const flags = await fetchJson(`${activepiecesUrl}/api/v1/flags`);
  const edition = String(flags.EDITION || 'ce').toLowerCase();
  const cloudApps = await fetchJson(`${CLOUD_APPS_URL}?edition=${encodeURIComponent(edition)}`);
  const registeredPieceNames = Object.keys(cloudApps)
    .filter((name) => name.startsWith('@activepieces/piece-'))
    .sort();

  const results = await Promise.all(registeredPieceNames.map(async (packageName) => {
    const [scope, name] = packageName.split('/');
    const metadataUrl = `${activepiecesUrl}/api/v1/pieces/${encodeURIComponent(scope)}/${encodeURIComponent(name)}`;
    try {
      const piece = await fetchJson(metadataUrl);
      const oauth = oauthAuthEntries(piece.auth);
      return {
        packageName,
        connectorId: packageName.replace('@activepieces/piece-', ''),
        metadataStatus: oauth.length > 0 ? 'oauth_capable' : 'not_oauth',
        version: piece.version,
        oauth: oauth.map((entry) => ({
          grantType: entry.grantType || 'authorization_code',
          authUrl: entry.authUrl,
          tokenUrl: entry.tokenUrl,
          scopes: entry.scope || [],
          props: entry.props || {},
        })),
        actions: Object.keys(piece.actions || {}).sort(),
        triggers: Object.keys(piece.triggers || {}).sort(),
      };
    } catch (error) {
      return {
        packageName,
        connectorId: packageName.replace('@activepieces/piece-', ''),
        metadataStatus: 'unavailable',
        error: error.message,
      };
    }
  }));

  const oauthPieces = results.filter(({ metadataStatus }) => metadataStatus === 'oauth_capable');
  const report = {
    generatedAt: new Date().toISOString(),
    source: {
      activepiecesUrl,
      activepiecesVersion: flags.CURRENT_VERSION,
      edition,
      cloudAuthEnabled: flags.CLOUD_AUTH_ENABLED,
      cloudAppsUrl: `${CLOUD_APPS_URL}?edition=${edition}`,
    },
    summary: {
      cloudRegistryEntries: registeredPieceNames.length,
      oauthCapablePieces: oauthPieces.length,
      nonOAuthRegistryEntries: results.filter(({ metadataStatus }) => metadataStatus === 'not_oauth').length,
      unavailableRegistryEntries: results.filter(({ metadataStatus }) => metadataStatus === 'unavailable').length,
      actions: oauthPieces.reduce((total, piece) => total + piece.actions.length, 0),
      triggers: oauthPieces.reduce((total, piece) => total + piece.triggers.length, 0),
    },
    pieces: results,
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  if (outputPath) {
    const resolved = path.resolve(outputPath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, serialized, { mode: 0o600 });
    console.log(resolved);
    return;
  }
  process.stdout.write(serialized);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
