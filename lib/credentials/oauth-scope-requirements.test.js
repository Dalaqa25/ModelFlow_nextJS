import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
