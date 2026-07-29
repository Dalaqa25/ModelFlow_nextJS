import assert from 'node:assert/strict';
import test from 'node:test';

import { createStreamHandler, recoverAutomationContext } from './useStreamHandler.js';

function createHandler(overrides = {}) {
  const metadata = [];
  const contexts = [];
  const handler = createStreamHandler({
    aiMessageId: 'assistant-1',
    setMessages: () => {},
    setAutomationContext: value => contexts.push(value),
    setSetupState: () => {},
    setSelectedAutomation: () => {},
    setLastFileSearchResults: () => {},
    animationFrameRef: { current: null },
    onLoadingChange: () => {},
    setIsLoading: () => {},
    setCurrentAiMessageId: () => {},
    onUiMetadataUpdate: value => metadata.push(value),
    ...overrides,
  });
  return { handler, metadata, contexts };
}

test('persists automation cards and authoritative catalog context', () => {
  const { handler, metadata, contexts } = createHandler();
  const automations = [{ name: 'Invoice Inbox to Google Sheets' }];
  const context = '- "Invoice Inbox to Google Sheets" (UUID: automation-id)';

  handler.handleParsedEvent({ type: 'automation_list', automations });
  handler.handleParsedEvent({ type: 'automation_context', context });

  assert.deepEqual(contexts, [null, context]);
  assert.deepEqual(metadata, [
    { automationList: automations },
    { automationContext: context },
  ]);
});

test('setup start permanently resolves the active catalog even when provisioning later fails', () => {
  const { handler, metadata, contexts } = createHandler();

  handler.handleParsedEvent({
    type: 'automation_context',
    context: '- "Invoice Inbox to Google Sheets" (UUID: automation-id)',
  });
  handler.handleParsedEvent({
    type: 'setup_started',
    automation_id: 'automation-id',
    automation_name: 'Invoice Inbox to Google Sheets',
    required_inputs: [],
  });

  assert.deepEqual(contexts, [
    '- "Invoice Inbox to Google Sheets" (UUID: automation-id)',
    null,
  ]);
  assert.deepEqual(metadata, [
    { automationContext: '- "Invoice Inbox to Google Sheets" (UUID: automation-id)' },
    { catalogResolved: true },
  ]);
});

test('reload recovery respects the newest catalog resolution tombstone', () => {
  const oldContext = '- "Invoice Inbox to Google Sheets" (UUID: automation-id)';

  assert.equal(recoverAutomationContext([
    { automationContext: oldContext },
    { catalogResolved: true },
  ]), null);

  assert.equal(recoverAutomationContext([
    { automationContext: oldContext },
    { catalogResolved: true },
    { automationContext: '- "Auto Job Matcher" (UUID: newer-id)' },
  ]), '- "Auto Job Matcher" (UUID: newer-id)');
});

test('runtime setup failure clears fake active setup state', () => {
  const setupStates = [];
  const selectedAutomations = [];
  const fileSearchStates = [];
  const { handler, metadata } = createHandler({
    setSetupState: value => setupStates.push(value),
    setSelectedAutomation: value => selectedAutomations.push(value),
    setLastFileSearchResults: value => fileSearchStates.push(value),
  });

  handler.handleParsedEvent({
    type: 'setup_started',
    automation_id: 'automation-id',
    automation_name: 'Invoice Inbox to Google Sheets',
    required_inputs: [{ name: 'SPREADSHEET_ID' }],
  });
  handler.handleParsedEvent({
    type: 'setup_failed',
    automation_id: 'automation-id',
    automation_name: 'Invoice Inbox to Google Sheets',
    reason: 'INVALID_CREDENTIALS',
  });

  assert.equal(setupStates.at(-1), null);
  assert.equal(selectedAutomations.at(-1), null);
  assert.equal(fileSearchStates.at(-1), null);
  assert.deepEqual(metadata.at(-1), {
    setupFailure: {
      automation_id: 'automation-id',
      automation_name: 'Invoice Inbox to Google Sheets',
      reason: 'INVALID_CREDENTIALS',
    },
  });
});
