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

test('detects a broad set of imported n8n connector credentials', () => {
  const requirements = detectImportedWorkflowCredentialRequirements({
    nodes: [
      { name: 'CRM', type: 'n8n-nodes-base.airtable', credentials: { airtableOAuth2Api: { id: 'a' } } },
      { name: 'Tasks', type: 'n8n-nodes-base.clickUp', credentials: { clickUpOAuth2Api: { id: 'b' } } },
      { name: 'Calendar', type: 'n8n-nodes-base.googleCalendar', credentials: { googleCalendarOAuth2Api: { id: 'c' } } },
      { name: 'Document', type: 'n8n-nodes-base.googleDocs', credentials: { googleDocsOAuth2Api: { id: 'd' } } },
      { name: 'Message', type: 'n8n-nodes-base.telegram', credentials: { telegramApi: { id: 'e' } } },
      { name: 'Crawl', type: '@mendable/n8n-nodes-firecrawl.firecrawl', credentials: { firecrawlApi: { id: 'f' } } },
    ],
  });

  assert.deepEqual(requirements.map((item) => item.connectorId), [
    'airtable',
    'clickup',
    'google-calendar',
    'google-docs',
    'telegram',
    'firecrawl',
  ]);
});

test('infers an unknown connector from an n8n credential type', () => {
  const [requirement] = detectImportedWorkflowCredentialRequirements({
    nodes: [{
      name: 'Custom service',
      type: 'n8n-nodes-base.exampleService',
      credentials: { exampleServiceOAuth2Api: { id: 'account' } },
    }],
  });

  assert.equal(requirement.connectorId, 'example-service');
  assert.equal(requirement.inferred, true);
});

test('does not ask users for credentials supplied by the automation developer', () => {
  const requirements = detectImportedWorkflowCredentialRequirements({
    nodes: [
      {
        name: 'Developer Airtable',
        type: 'n8n-nodes-base.airtable',
        credentials: { airtableTokenApi: { id: '{{AIRTABLE_TOKEN_API_KEY}}' } },
      },
      {
        name: 'User Gmail',
        type: 'n8n-nodes-base.gmail',
        credentials: { gmailOAuth2: { id: 'gmail-account' } },
      },
    ],
  }, { developerKeyNames: ['AIRTABLE_TOKEN_API_KEY'] });

  assert.deepEqual(requirements.map((item) => item.connectorId), ['gmail']);
});

test('does not ask users for ModelGrow-owned AI provider credentials', () => {
  const requirements = detectImportedWorkflowCredentialRequirements({
    nodes: [
      {
        name: 'Gemini',
        type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
        credentials: { googlePalmApi: { id: 'platform-gemini' } },
      },
      {
        name: 'OpenAI',
        type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
        credentials: { openAiApi: { id: 'platform-openai' } },
      },
    ],
  });

  assert.deepEqual(requirements, []);
});
