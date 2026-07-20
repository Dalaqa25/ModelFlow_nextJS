import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractAvailableAutomationDiscoveryRequest,
  extractCatalogAutomationSelection,
  isReadyToExecuteConfirmation,
} from './intent-routing.js';

test('routes broad automation discovery to the published catalog', () => {
  const broadRequest = extractAvailableAutomationDiscoveryRequest('I want some automations');
  assert.equal(broadRequest?.reason, 'explicit_catalog_request');
  assert.equal(broadRequest?.browseAll, true);

  const optionsRequest = extractAvailableAutomationDiscoveryRequest('Can you recommend workflow options?');
  assert.equal(optionsRequest?.reason, 'explicit_catalog_request');
  assert.equal(optionsRequest?.browseAll, true);
});

test('preserves a named automation query for catalog ranking', () => {
  const request = extractAvailableAutomationDiscoveryRequest(
    'I want to use the Auto Parts Search Engine automation'
  );

  assert.equal(request?.reason, 'targeted_catalog_request');
  assert.equal(request?.browseAll, false);
});

test('does not confuse configured automation status with catalog discovery', () => {
  assert.equal(extractAvailableAutomationDiscoveryRequest('Show me my automations'), null);
  assert.equal(extractAvailableAutomationDiscoveryRequest('Which automations are running?'), null);
});

test('resolves a short follow-up after the assistant offered the catalog', () => {
  const messages = [
    {
      role: 'assistant',
      content: "You don't have any automations set up yet. I can show you the available automations and help you choose one.",
    },
    { role: 'user', content: 'Okey show me then' },
  ];
  assert.equal(
    extractAvailableAutomationDiscoveryRequest('Okey show me then', messages)?.reason,
    'accepted_catalog_offer'
  );
});

test('does not guess what a context-free show-me follow-up refers to', () => {
  assert.equal(extractAvailableAutomationDiscoveryRequest('Okay show me then', []), null);
});

test('resolves an exact catalog selection to its authoritative id', () => {
  const content = `Auto Parts Search Engine\n\n[AVAILABLE AUTOMATIONS
- "Auto Parts Search Engine" (UUID: b4b0813e-d771-44bc-a67a-1dec205c0269)
  Description: Finds vehicle parts
- "Auto Job Matcher" (UUID: 11111111-2222-3333-4444-555555555555)
  Description: Finds jobs]`;

  assert.deepEqual(extractCatalogAutomationSelection(content), {
    automationName: 'Auto Parts Search Engine',
    automationId: 'b4b0813e-d771-44bc-a67a-1dec205c0269',
  });
});

test('does not turn a question about a catalog item into setup', () => {
  const content = `Tell me more about Auto Parts Search Engine\n\n[AVAILABLE AUTOMATIONS
- "Auto Parts Search Engine" (UUID: b4b0813e-d771-44bc-a67a-1dec205c0269)]`;

  assert.equal(extractCatalogAutomationSelection(content), null);
});

test('recognizes a direct confirmation only after setup is ready', () => {
  assert.equal(isReadyToExecuteConfirmation('run it'), true);
  assert.equal(isReadyToExecuteConfirmation('Go ahead'), true);
  assert.equal(isReadyToExecuteConfirmation('looks good'), true);
  assert.equal(isReadyToExecuteConfirmation('run it tomorrow'), false);
  assert.equal(isReadyToExecuteConfirmation('show my automations'), false);
});

test('recognizes run confirmation when the browser appends private setup context', () => {
  const content = `run it

[AVAILABLE AUTOMATIONS - Use these REAL descriptions when answering questions about them:
- "Auto Job Matcher" (UUID: 3a690141-45d0-4030-bdfe-a72fada7eb74)]

[ACTIVE SETUP: "Auto Job Matcher" (automation_id: 3a690141-45d0-4030-bdfe-a72fada7eb74)]`;

  assert.equal(isReadyToExecuteConfirmation(content), true);
});
