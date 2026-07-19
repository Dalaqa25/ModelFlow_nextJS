const crypto = require('node:crypto');
const http = require('node:http');
const { Pool } = require('pg');
const { buildAuthEnvelope } = require('./authEnvelope');

const PORT = Number(process.env.PORT || 8090);
const PIECE_PATTERN = /^@activepieces\/piece-[a-z0-9-]+$/;
const EXTERNAL_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,200}$/;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const BRIDGE_SECRET = required('MODELGROW_CREDENTIAL_BRIDGE_SECRET');
const ENCRYPTION_KEY = Buffer.from(required('AP_ENCRYPTION_KEY'), 'binary');
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('AP_ENCRYPTION_KEY must be 32 bytes');
}

const pool = new Pool({
  host: required('AP_POSTGRES_HOST'),
  port: Number(process.env.AP_POSTGRES_PORT || 5432),
  database: required('AP_POSTGRES_DATABASE'),
  user: required('AP_POSTGRES_USERNAME'),
  password: required('AP_POSTGRES_PASSWORD'),
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && leftBuffer.length > 0 &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function send(res, status, body) {
  const encoded = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(encoded),
    'Cache-Control': 'no-store',
  });
  res.end(encoded);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32 * 1024) throw Object.assign(new Error('Request too large'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 });
  }
}

function validateRequest(body) {
  const pieceName = String(body.pieceName || '').trim();
  const externalId = body.externalId == null ? null : String(body.externalId).trim();
  const projectIds = Array.from(new Set(Array.isArray(body.projectIds)
    ? body.projectIds.map((value) => String(value).trim()).filter(Boolean)
    : []));

  if (!PIECE_PATTERN.test(pieceName)) {
    throw Object.assign(new Error('Invalid piece name'), { status: 400, code: 'INVALID_PIECE' });
  }
  if (externalId && !EXTERNAL_ID_PATTERN.test(externalId)) {
    throw Object.assign(new Error('Invalid connection identifier'), { status: 400, code: 'INVALID_CONNECTION_ID' });
  }
  if (projectIds.length === 0 || projectIds.length > 10 || projectIds.some((id) => id.length > 200)) {
    throw Object.assign(new Error('Invalid project identifiers'), { status: 400, code: 'INVALID_PROJECT_IDS' });
  }
  return { pieceName, externalId, projectIds };
}

function decryptValue(encrypted) {
  if (!encrypted?.data || !encrypted?.iv) throw new Error('Invalid encrypted connection value');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(encrypted.iv, 'hex'));
  let plaintext = decipher.update(encrypted.data, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  return JSON.parse(plaintext);
}

function encryptValue(value) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let data = cipher.update(JSON.stringify(value), 'utf8', 'hex');
  data += cipher.final('hex');
  return { data, iv: iv.toString('hex') };
}

function findSecret(value, acceptedKeys) {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findSecret(child, acceptedKeys);
      if (found) return found;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value)) {
    if (acceptedKeys.has(key) && typeof child === 'string' && child) return child;
    const found = findSecret(child, acceptedKeys);
    if (found) return found;
  }
  return null;
}

function isExpired(credential) {
  const claimedAt = Number(credential.claimed_at || credential.claimedAt || 0);
  const expiresIn = Number(credential.expires_in || credential.expiresIn || 3600);
  if (!claimedAt) return false;
  return Math.round(Date.now() / 1000) + 15 * 60 >= claimedAt + expiresIn;
}

async function refreshCloudOAuth(pieceName, credential) {
  const response = await fetch('https://secrets.activepieces.com/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: findSecret(credential, new Set(['refresh_token', 'refreshToken'])),
      pieceName,
      clientId: credential.client_id || credential.clientId,
      edition: process.env.AP_EDITION || 'COMMUNITY',
      authorizationMethod: credential.authorization_method || credential.authorizationMethod,
      tokenUrl: credential.token_url || credential.tokenUrl,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw Object.assign(new Error('OAuth refresh failed'), { status: 401, code: 'OAUTH_REFRESH_FAILED' });
  }
  return { ...credential, ...(await response.json()) };
}

async function refreshDirectOAuth(credential) {
  const tokenUrl = credential.token_url || credential.tokenUrl;
  const refreshToken = findSecret(credential, new Set(['refresh_token', 'refreshToken']));
  const clientId = credential.client_id || credential.clientId;
  const clientSecret = credential.client_secret || credential.clientSecret;
  if (!tokenUrl || !refreshToken || !clientId) return credential;

  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
  if (clientSecret) form.set('client_secret', clientSecret);
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw Object.assign(new Error('OAuth refresh failed'), { status: 401, code: 'OAUTH_REFRESH_FAILED' });
  }
  const refreshed = await response.json();
  return { ...credential, ...refreshed, claimed_at: Math.round(Date.now() / 1000) };
}

async function maybeRefresh(row, credential) {
  const refreshToken = findSecret(credential, new Set(['refresh_token', 'refreshToken']));
  if (!refreshToken || !isExpired(credential)) return { credential, changed: false };
  const refreshed = row.type === 'CLOUD_OAUTH2'
    ? await refreshCloudOAuth(row.pieceName, credential)
    : await refreshDirectOAuth(credential);
  return { credential: refreshed, changed: refreshed !== credential };
}

async function resolveCredential(input) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT id, "externalId", "pieceName", type, value, "projectIds"
         FROM app_connection
        WHERE "pieceName" = $1
          AND status = 'ACTIVE'
          AND "projectIds" && $2::varchar[]
          AND ($3::text IS NULL OR "externalId" = $3)
        ORDER BY updated DESC
        LIMIT 2
        FOR UPDATE`,
      [input.pieceName, input.projectIds, input.externalId],
    );
    if (result.rowCount === 0) {
      throw Object.assign(new Error('Required app is not connected'), { status: 404, code: 'CONNECTION_NOT_FOUND' });
    }
    if (!input.externalId && result.rowCount > 1) {
      throw Object.assign(new Error('Choose which connected account this automation should use'), { status: 409, code: 'AMBIGUOUS_CONNECTION' });
    }

    const row = result.rows[0];
    const projectId = input.projectIds.find((id) => row.projectIds.includes(id));
    let credential = decryptValue(row.value);
    const refreshed = await maybeRefresh(row, credential);
    credential = refreshed.credential;
    if (refreshed.changed) {
      await client.query(
        'UPDATE app_connection SET value = $1, updated = NOW() WHERE id = $2',
        [encryptValue(credential), row.id],
      );
    }
    const auth = buildAuthEnvelope(row.type, credential);
    if (auth.kind === 'oauth2' && !auth.accessToken) {
      throw Object.assign(new Error('Connected app has no usable access token'), { status: 422, code: 'ACCESS_TOKEN_MISSING' });
    }
    await client.query('COMMIT');
    return {
      externalId: row.externalId,
      projectId,
      pieceName: row.pieceName,
      connectionType: row.type,
      auth,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { status: 'ok', service: 'modelgrow-credential-bridge' });
  }
  if (req.method !== 'POST' || req.url !== '/v1/resolve') {
    return send(res, 404, { error: 'Not found' });
  }
  if (!safeEqual(req.headers['x-modelgrow-credential-secret'], BRIDGE_SECRET)) {
    return send(res, 401, { error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  try {
    const input = validateRequest(await readJson(req));
    const resolved = await resolveCredential(input);
    return send(res, 200, resolved);
  } catch (error) {
    console.error('[CredentialBridge] Request failed:', error.code || error.message);
    return send(res, error.status || 500, {
      error: error.status && error.status < 500 ? error.message : 'Credential resolution failed',
      code: error.code || 'CREDENTIAL_RESOLUTION_FAILED',
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[CredentialBridge] Listening on ${PORT}`);
});

async function shutdown() {
  server.close();
  await pool.end();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
