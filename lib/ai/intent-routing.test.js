import assert from 'node:assert/strict';
import test from 'node:test';

import { extractAvailableAutomationDiscoveryRequest } from './intent-routing.js';

test('routes broad automation discovery to the published catalog', () => {
  assert.equal(
    extractAvailableAutomationDiscoveryRequest('I want some automations')?.reason,
    'explicit_catalog_request'
  );
  assert.equal(
    extractAvailableAutomationDiscoveryRequest('Can you recommend workflow options?')?.reason,
    'explicit_catalog_request'
  );
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
