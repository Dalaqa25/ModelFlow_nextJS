import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureOAuthAuthorizationUrlScopes,
  GMAIL_OAUTH_SCOPES,
  mergeOAuthScopes,
  requiredGmailOAuthScopes,
  requiredOAuthScopesForImportedRequirement,
} from './oauth-scope-requirements.js';

test('requests Gmail scopes from the imported node operation', () => {
  assert.deepEqual(requiredGmailOAuthScopes({
    type: 'n8n-nodes-base.gmailTrigger',
    parameters: {},
  }), [GMAIL_OAUTH_SCOPES.readonly]);
  assert.deepEqual(requiredGmailOAuthScopes({
    type: 'n8n-nodes-base.gmail',
    parameters: { operation: 'addLabels' },
  }), [GMAIL_OAUTH_SCOPES.modify]);
  assert.deepEqual(requiredGmailOAuthScopes({
    type: 'n8n-nodes-base.gmail',
    parameters: { operation: 'send' },
  }), [GMAIL_OAUTH_SCOPES.send]);
});

test('handles n8n default operations when operation is omitted', () => {
  assert.deepEqual(requiredGmailOAuthScopes({
    type: 'n8n-nodes-base.gmail',
    parameters: { resource: 'draft' },
  }), [GMAIL_OAUTH_SCOPES.compose]);
  assert.deepEqual(requiredGmailOAuthScopes({
    type: 'n8n-nodes-base.gmail',
    parameters: {},
  }), [GMAIL_OAUTH_SCOPES.send]);
});

test('requests full-mail scope only for permanent message deletion', () => {
  assert.deepEqual(requiredGmailOAuthScopes({
    type: 'n8n-nodes-base.gmail',
    parameters: { resource: 'message', operation: 'delete' },
  }), [GMAIL_OAUTH_SCOPES.full]);
  assert.deepEqual(requiredGmailOAuthScopes({
    type: 'n8n-nodes-base.gmail',
    parameters: { resource: 'draft', operation: 'delete' },
  }), [GMAIL_OAUTH_SCOPES.compose]);
});

test('collects the exact scope union for one imported credential requirement', () => {
  const workflow = {
    nodes: [
      { name: 'Watch', type: 'n8n-nodes-base.gmailTrigger', parameters: {} },
      { name: 'Draft', type: 'n8n-nodes-base.gmail', parameters: { resource: 'draft' } },
      { name: 'Label', type: 'n8n-nodes-base.gmail', parameters: { operation: 'addLabels' } },
      { name: 'Other Gmail', type: 'n8n-nodes-base.gmail', parameters: { operation: 'send' } },
    ],
  };
  const scopes = requiredOAuthScopesForImportedRequirement(workflow, {
    connectorId: 'gmail',
    nodeNames: ['Watch', 'Draft', 'Label'],
  });

  assert.deepEqual(scopes, [
    GMAIL_OAUTH_SCOPES.readonly,
    GMAIL_OAUTH_SCOPES.compose,
    GMAIL_OAUTH_SCOPES.modify,
  ]);
});

test('merges piece defaults and workflow requirements without duplicates', () => {
  assert.deepEqual(mergeOAuthScopes(
    [GMAIL_OAUTH_SCOPES.readonly, GMAIL_OAUTH_SCOPES.send],
    [GMAIL_OAUTH_SCOPES.modify, GMAIL_OAUTH_SCOPES.readonly],
  ), [
    GMAIL_OAUTH_SCOPES.readonly,
    GMAIL_OAUTH_SCOPES.send,
    GMAIL_OAUTH_SCOPES.modify,
  ]);
});

test('restores workflow-required scopes removed by an OAuth helper', () => {
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/auth');
  authorizationUrl.searchParams.set('client_id', 'example');
  authorizationUrl.searchParams.set('scope', `${GMAIL_OAUTH_SCOPES.readonly} email`);

  const correctedUrl = new URL(ensureOAuthAuthorizationUrlScopes(
    authorizationUrl.toString(),
    [GMAIL_OAUTH_SCOPES.modify, GMAIL_OAUTH_SCOPES.readonly],
  ));

  assert.deepEqual(correctedUrl.searchParams.get('scope').split(' '), [
    GMAIL_OAUTH_SCOPES.readonly,
    'email',
    GMAIL_OAUTH_SCOPES.modify,
  ]);
  assert.equal(correctedUrl.searchParams.get('client_id'), 'example');
});
