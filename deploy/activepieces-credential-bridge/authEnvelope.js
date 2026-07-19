const OAUTH2_TYPES = new Set(['CLOUD_OAUTH2', 'PLATFORM_OAUTH2', 'OAUTH2']);
const OAUTH1_TYPES = new Set(['OAUTH1']);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function findValue(value, acceptedKeys) {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findValue(child, acceptedKeys);
      if (found != null) return found;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value)) {
    if (acceptedKeys.has(key) && child != null && child !== '') return child;
    const found = findValue(child, acceptedKeys);
    if (found != null) return found;
  }
  return null;
}

function normalizedConnectionType(type) {
  return String(type || '').trim().toUpperCase();
}

function inferKind(type, credential) {
  const normalizedType = normalizedConnectionType(type);
  if (OAUTH2_TYPES.has(normalizedType)) return 'oauth2';
  if (OAUTH1_TYPES.has(normalizedType)) return 'oauth1';
  if (normalizedType === 'BASIC_AUTH') return 'basic';
  if (normalizedType === 'SECRET_TEXT') return 'secret-text';
  if (normalizedType === 'CUSTOM_AUTH') return 'custom';

  if (findValue(credential, new Set(['access_token', 'accessToken']))) return 'oauth2';
  if (
    findValue(credential, new Set(['username', 'user'])) &&
    findValue(credential, new Set(['password', 'pass']))
  ) return 'basic';
  if (typeof credential === 'string') return 'secret-text';
  return 'custom';
}

function normalizeScope(scope) {
  if (Array.isArray(scope)) return scope.map(String).filter(Boolean);
  if (typeof scope === 'string') return scope.split(/[ ,]+/).filter(Boolean);
  return [];
}

function expiresAtFrom(credential) {
  const explicit = findValue(credential, new Set(['expires_at', 'expiresAt', 'expiry_date', 'expiryDate']));
  if (explicit != null && Number.isFinite(Number(explicit))) return Number(explicit);
  const claimedAt = Number(findValue(credential, new Set(['claimed_at', 'claimedAt'])) || 0);
  const expiresIn = Number(findValue(credential, new Set(['expires_in', 'expiresIn'])) || 0);
  return claimedAt && expiresIn ? claimedAt + expiresIn : null;
}

/**
 * Build the only credential representation allowed to leave the bridge.
 * OAuth refresh tokens and provider client secrets deliberately remain in the
 * Activepieces vault. The bridge refreshes OAuth before returning this
 * short-lived execution envelope.
 */
function buildAuthEnvelope(type, credential) {
  const connectionType = normalizedConnectionType(type);
  const kind = inferKind(connectionType, credential);

  if (kind === 'oauth2') {
    return {
      version: 1,
      kind,
      connectionType,
      accessToken: findValue(credential, new Set(['access_token', 'accessToken', 'token'])),
      tokenType: String(findValue(credential, new Set(['token_type', 'tokenType'])) || 'Bearer'),
      expiresAt: expiresAtFrom(credential),
      scopes: normalizeScope(findValue(credential, new Set(['scope', 'scopes']))),
    };
  }

  if (kind === 'oauth1') {
    return {
      version: 1,
      kind,
      connectionType,
      token: findValue(credential, new Set(['oauth_token', 'oauthToken', 'token'])),
      tokenSecret: findValue(credential, new Set(['oauth_token_secret', 'oauthTokenSecret', 'tokenSecret'])),
    };
  }

  if (kind === 'basic') {
    return {
      version: 1,
      kind,
      connectionType,
      username: findValue(credential, new Set(['username', 'user'])),
      password: findValue(credential, new Set(['password', 'pass'])),
    };
  }

  if (kind === 'secret-text') {
    return {
      version: 1,
      kind,
      connectionType,
      value: typeof credential === 'string'
        ? credential
        : findValue(credential, new Set(['secret', 'value', 'token', 'apiKey', 'api_key'])),
    };
  }

  return {
    version: 1,
    kind: 'custom',
    connectionType,
    fields: clone(credential),
  };
}

module.exports = {
  buildAuthEnvelope,
  inferKind,
};
