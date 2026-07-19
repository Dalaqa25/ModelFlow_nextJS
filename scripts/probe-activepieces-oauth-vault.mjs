#!/usr/bin/env node

/**
 * Read-only proof that ModelGrow can resolve an OAuth credential from the
 * self-hosted Activepieces vault without exposing the credential value.
 *
 * Intended execution target: the Activepieces app container, where the live
 * AP_POSTGRES_* and AP_ENCRYPTION_KEY variables already exist.
 *
 * The script deliberately prints only metadata, credential key paths, and a
 * provider response status. It never prints database rows, decrypted values,
 * tokens, account identifiers, or provider response bodies.
 */

import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const DEFAULT_PIECE = '@activepieces/piece-gmail';
const SUPPORTED_PROBES = Object.freeze({
  '@activepieces/piece-gmail': 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
});

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createDatabaseConfig() {
  const connectionString = process.env.ACTIVEPIECES_DATABASE_URL || process.env.DATABASE_URL;
  if (connectionString) {
    return { connectionString };
  }

  return {
    host: requireEnv('AP_POSTGRES_HOST'),
    port: Number(process.env.AP_POSTGRES_PORT || 5432),
    database: requireEnv('AP_POSTGRES_DATABASE'),
    user: requireEnv('AP_POSTGRES_USERNAME'),
    password: requireEnv('AP_POSTGRES_PASSWORD'),
  };
}

function decryptActivepiecesValue(encryptedValue) {
  if (!encryptedValue || typeof encryptedValue !== 'object') {
    throw new Error('Activepieces connection value is not an encrypted object');
  }

  const { iv, data } = encryptedValue;
  if (typeof iv !== 'string' || typeof data !== 'string') {
    throw new Error('Activepieces connection value is missing iv/data');
  }

  const secret = requireEnv('AP_ENCRYPTION_KEY');
  const key = Buffer.from(secret, 'binary');
  if (key.length !== 32) {
    throw new Error(`AP_ENCRYPTION_KEY must resolve to 32 bytes; received ${key.length}`);
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    key,
    Buffer.from(iv, 'hex'),
  );
  let plaintext = decipher.update(data, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  return JSON.parse(plaintext);
}

function collectLeafKeyPaths(value, prefix = '', paths = []) {
  if (!value || typeof value !== 'object') {
    if (prefix) paths.push(prefix);
    return paths;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectLeafKeyPaths(entry, `${prefix}[${index}]`, paths);
    });
    return paths;
  }

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    collectLeafKeyPaths(child, path, paths);
  }
  return paths;
}

function findSecret(value, acceptedKeys) {
  if (!value || typeof value !== 'object') return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findSecret(entry, acceptedKeys);
      if (found) return found;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    if (acceptedKeys.has(key) && typeof child === 'string' && child.length > 0) {
      return child;
    }
    const found = findSecret(child, acceptedKeys);
    if (found) return found;
  }
  return null;
}

async function verifyProviderCredential(pieceName, accessToken) {
  const endpoint = SUPPORTED_PROBES[pieceName];
  if (!endpoint) {
    return {
      attempted: false,
      ok: null,
      status: null,
      reason: 'No harmless provider probe is configured for this piece',
    };
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(10_000),
  });

  // Never consume or print the response body because it can contain account
  // metadata. The status is sufficient for this proof.
  await response.body?.cancel();
  return {
    attempted: true,
    ok: response.ok,
    status: response.status,
  };
}

async function main() {
  const pieceName = process.env.PROBE_PIECE_NAME || DEFAULT_PIECE;
  const client = new Client({
    ...createDatabaseConfig(),
    connectionTimeoutMillis: 10_000,
    query_timeout: 10_000,
  });

  await client.connect();
  try {
    await client.query('BEGIN READ ONLY');
    const result = await client.query(
      `SELECT "pieceName", type, status, value
       FROM app_connection
       WHERE "pieceName" = $1 AND status = 'ACTIVE'
       ORDER BY updated DESC
       LIMIT 1`,
      [pieceName],
    );
    await client.query('ROLLBACK');

    if (result.rowCount !== 1) {
      throw new Error(`No active connection found for ${pieceName}`);
    }

    const row = result.rows[0];
    const decrypted = decryptActivepiecesValue(row.value);
    const accessToken = findSecret(decrypted, new Set(['access_token', 'accessToken']));
    const refreshToken = findSecret(decrypted, new Set(['refresh_token', 'refreshToken']));
    const providerProbe = accessToken
      ? await verifyProviderCredential(row.pieceName, accessToken)
      : {
          attempted: false,
          ok: false,
          status: null,
          reason: 'No access token was present in the decrypted connection',
        };

    const report = {
      ok: Boolean(accessToken) && providerProbe.ok !== false,
      connection: {
        pieceName: row.pieceName,
        type: row.type,
        status: row.status,
      },
      vault: {
        encryptedShape: Object.keys(row.value).sort(),
        algorithm: 'aes-256-cbc',
        decrypted: true,
        credentialKeyPaths: collectLeafKeyPaths(decrypted).sort(),
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken),
      },
      providerProbe,
    };

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.ok) process.exitCode = 2;
  } finally {
    if (!client.ended) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // No active transaction is also fine.
      }
      await client.end();
    }
  }
}

main().catch((error) => {
  process.stderr.write(`OAuth vault proof failed: ${error.message}\n`);
  process.exitCode = 1;
});
