import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImportedWorkflowCredentialRequirements } from './workflow-requirements.js';

test('detects imported workflow OAuth requirements generically', () => {
  const requirements = detectImportedWorkflowCredentialRequirements({
    nodes: [
      {
        name: 'Append row',
        type: 'n8n-nodes-base.googleSheets',
        credentials: { googleSheetsOAuth2Api: { id: 'account-a' } },
      },
      {
        name: 'Notify',
        type: 'n8n-nodes-base.slack',
        credentials: { slackOAuth2Api: { id: 'account-b' } },
      },
    ],
  });
  assert.deepEqual(requirements.map((item) => item.connectorId), ['google-sheets', 'slack']);
  assert.ok(requirements.every((item) => /^[a-f0-9]{24}$/.test(item.credentialKey)));
});
