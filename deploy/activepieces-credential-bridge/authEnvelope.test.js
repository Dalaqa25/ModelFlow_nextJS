const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAuthEnvelope } = require('./authEnvelope');

test('normalizes OAuth2 without allowing refresh or client secrets to leave the vault', () => {
  const envelope = buildAuthEnvelope('CLOUD_OAUTH2', {
    access_token: 'short-lived-access',
    refresh_token: 'vault-only-refresh',
    client_secret: 'vault-only-client-secret',
    token_type: 'Bearer',
    claimed_at: 100,
    expires_in: 3600,
    scope: 'files.read files.write',
  });

  assert.deepEqual(envelope, {
    version: 1,
    kind: 'oauth2',
    connectionType: 'CLOUD_OAUTH2',
    accessToken: 'short-lived-access',
    tokenType: 'Bearer',
    expiresAt: 3700,
    scopes: ['files.read', 'files.write'],
  });
  assert.equal(JSON.stringify(envelope).includes('vault-only-refresh'), false);
  assert.equal(JSON.stringify(envelope).includes('vault-only-client-secret'), false);
});

test('preserves arbitrary custom authentication fields for native credential compilation', () => {
  const envelope = buildAuthEnvelope('CUSTOM_AUTH', {
    apiKey: 'custom-secret',
    region: 'eu',
    accountId: 'account-1',
  });

  assert.equal(envelope.kind, 'custom');
  assert.deepEqual(envelope.fields, {
    apiKey: 'custom-secret',
    region: 'eu',
    accountId: 'account-1',
  });
});

test('normalizes basic and secret-text authentication', () => {
  assert.deepEqual(buildAuthEnvelope('BASIC_AUTH', {
    username: 'user',
    password: 'pass',
  }), {
    version: 1,
    kind: 'basic',
    connectionType: 'BASIC_AUTH',
    username: 'user',
    password: 'pass',
  });

  assert.deepEqual(buildAuthEnvelope('SECRET_TEXT', 'api-secret'), {
    version: 1,
    kind: 'secret-text',
    connectionType: 'SECRET_TEXT',
    value: 'api-secret',
  });
});
