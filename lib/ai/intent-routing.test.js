import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractAmbiguousCatalogConfirmation,
  extractAvailableAutomationDiscoveryRequest,
  extractCatalogAutomationSelection,
  extractVisibleUserContent,
  findLatestCatalogAutomationContext,
  isReadyToExecuteConfirmation,
  resolveCatalogTurn,
} from './intent-routing.js';

test('separates visible user text from every private orchestration marker', () => {
  for (const marker of [
    '[AVAILABLE AUTOMATIONS\n- "Invoice" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)]',
    '[ACTIVE SETUP: "Invoice" (automation_id: cc30a706-825d-494f-9de9-28835dbe813a)]',
    '[CONFIG_FORM_SUBMITTED automation_id="cc30a706-825d-494f-9de9-28835dbe813a"]',
    '[READY_TO_RUN automation_id="cc30a706-825d-494f-9de9-28835dbe813a" config={}]',
    '[READY_TO_EXECUTE automation_id="cc30a706-825d-494f-9de9-28835dbe813a" config_b64="e30="]',
    '[BACKGROUND_PROMPT automation_id="cc30a706-825d-494f-9de9-28835dbe813a" config={}]',
    '[ACTIVEPIECES_CONNECTION_COMPLETED automation_id="cc30a706-825d-494f-9de9-28835dbe813a"]',
    '[Selected automation UUID: cc30a706-825d-494f-9de9-28835dbe813a]',
    '[COLLECTED FIELDS (preserved after OAuth): {"sheet":"private"}]',
    '[IMPORTANT - Last file search results: private-file-id]',
  ]) {
    assert.equal(
      extractVisibleUserContent(`Tell me more about the first one\n\n${marker}`),
      'Tell me more about the first one'
    );
  }
});

test('private catalog context cannot turn a question into a fresh discovery request', () => {
  const content = `Tell me more about the first one

[AVAILABLE AUTOMATIONS - Use these REAL descriptions when answering questions about them:
- "Invoice Inbox to Google Sheets" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)
  Description: Watches Gmail for invoice attachments.
  Requires: gmail, google-sheets]`;

  assert.equal(extractAvailableAutomationDiscoveryRequest(content), null);
});

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

test('treats possessive connected apps as a new automation goal', () => {
  const request = extractAvailableAutomationDiscoveryRequest(
    'Automatically save every new invoice PDF from my Gmail into my Google Sheets invoice spreadsheet.'
  );

  assert.equal(request?.reason, 'targeted_catalog_request');
  assert.equal(request?.browseAll, false);
});

test('does not confuse configured automation status with catalog discovery', () => {
  assert.equal(extractAvailableAutomationDiscoveryRequest('Show me my automations'), null);
  assert.equal(extractAvailableAutomationDiscoveryRequest('Which automations are running?'), null);
  assert.equal(extractAvailableAutomationDiscoveryRequest('Check the status of my invoice automation'), null);
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

test('resolves yes to the only catalog result', () => {
  const content = `Yes

[AVAILABLE AUTOMATIONS - Use these REAL descriptions when answering questions about them:
- "Invoice Manager System" (UUID: 5f753d5a-bb21-45c8-80e0-395c2ad81403)
  Description: Extracts invoice data]`;

  assert.deepEqual(extractCatalogAutomationSelection(content), {
    automationName: 'Invoice Manager System',
    automationId: '5f753d5a-bb21-45c8-80e0-395c2ad81403',
  });
});

test('does not guess which catalog item yes refers to when several were offered', () => {
  const content = `Yes

[AVAILABLE AUTOMATIONS
- "Invoice Inbox to Google Sheets" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)
- "Invoice Manager System" (UUID: 5f753d5a-bb21-45c8-80e0-395c2ad81403)]`;

  assert.equal(extractCatalogAutomationSelection(content), null);
  assert.deepEqual(extractAmbiguousCatalogConfirmation(content), [
    {
      automationName: 'Invoice Inbox to Google Sheets',
      automationId: 'cc30a706-825d-494f-9de9-28835dbe813a',
    },
    {
      automationName: 'Invoice Manager System',
      automationId: '5f753d5a-bb21-45c8-80e0-395c2ad81403',
    },
  ]);
});

test('resolves a natural ordinal choice even with the user typo', () => {
  const context = `[AVAILABLE AUTOMATIONS
- "Invoice Inbox to Google Sheets" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)
- "Invoice Manager System" (UUID: 5f753d5a-bb21-45c8-80e0-395c2ad81403)]`;

  for (const request of [
    'Lets user first one',
    "Let's use the first one",
    'Go with option 1',
    'I want the first',
    'Pick number 1 please',
  ]) {
    assert.deepEqual(extractCatalogAutomationSelection(`${request}\n\n${context}`), {
      automationName: 'Invoice Inbox to Google Sheets',
      automationId: 'cc30a706-825d-494f-9de9-28835dbe813a',
    });
  }
});

test('resolves a catalog reference from authoritative prior-message state', () => {
  const catalogContext = `[AVAILABLE AUTOMATIONS
- "Invoice Inbox to Google Sheets" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)
- "Invoice Manager System" (UUID: 5f753d5a-bb21-45c8-80e0-395c2ad81403)]`;
  const messages = [
    { role: 'user', content: 'Hey I want to automate my invoices' },
    {
      role: 'assistant',
      content: 'I found two matching automations.',
      metadata: { hiddenContext: catalogContext },
    },
    { role: 'user', content: 'Lets user first one' },
  ];

  assert.equal(findLatestCatalogAutomationContext(messages), catalogContext);
  assert.deepEqual(resolveCatalogTurn('Lets user first one', messages), {
    type: 'selection',
    selection: {
      automationName: 'Invoice Inbox to Google Sheets',
      automationId: 'cc30a706-825d-494f-9de9-28835dbe813a',
    },
    entries: [
      {
        automationName: 'Invoice Inbox to Google Sheets',
        automationId: 'cc30a706-825d-494f-9de9-28835dbe813a',
      },
      {
        automationName: 'Invoice Manager System',
        automationId: '5f753d5a-bb21-45c8-80e0-395c2ad81403',
      },
    ],
  });
});

test('keeps an unresolved catalog pending without hijacking a new automation goal', () => {
  const messages = [{
    role: 'assistant',
    content: `[AVAILABLE AUTOMATIONS
- "Invoice Inbox to Google Sheets" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)
- "Invoice Manager System" (UUID: 5f753d5a-bb21-45c8-80e0-395c2ad81403)]`,
  }];

  assert.equal(resolveCatalogTurn('Tell me more about the options', messages).type, 'question');
  assert.equal(resolveCatalogTurn('Actually I want to automate job applications', messages).type, 'pending');
});

test('separates catalog questions from setup and resolves distinctive references', () => {
  const messages = [{
    role: 'assistant',
    content: `[AVAILABLE AUTOMATIONS
- "Invoice Inbox to Google Sheets" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)
  Description: Watches Gmail for invoice attachments.
  Requires: gmail, google-sheets
- "Invoice Manager System" (UUID: 5f753d5a-bb21-45c8-80e0-395c2ad81403)
  Description: Accepts manual PDF uploads.
  Requires: Google]`,
  }];

  const question = resolveCatalogTurn('Tell me more about the first one', messages);
  assert.equal(question.type, 'question');
  assert.equal(question.focus?.automationId, 'cc30a706-825d-494f-9de9-28835dbe813a');
  assert.equal(question.focus?.description, 'Watches Gmail for invoice attachments.');
  assert.deepEqual(question.focus?.requires, ['gmail', 'google-sheets']);

  const selection = resolveCatalogTurn('Use the Gmail one', messages);
  assert.equal(selection.type, 'selection');
  assert.equal(selection.selection.automationId, 'cc30a706-825d-494f-9de9-28835dbe813a');

  const ambiguous = resolveCatalogTurn('Use the Google one', messages);
  assert.equal(ambiguous.type, 'clarification');
});

test('carries the immediately discussed catalog item into a pronoun selection', () => {
  const catalogContext = `[AVAILABLE AUTOMATIONS
- "Invoice Inbox to Google Sheets" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)
  Description: Watches Gmail for invoice attachments.
- "Invoice Manager System" (UUID: 5f753d5a-bb21-45c8-80e0-395c2ad81403)
  Description: Accepts manual PDF uploads.]`;

  for (const [question, selectionRequest, expectedId] of [
    [
      'Tell me about the first one',
      'Okey I want to use it',
      'cc30a706-825d-494f-9de9-28835dbe813a',
    ],
    [
      'Explain the second one',
      'Okay, set that one up',
      '5f753d5a-bb21-45c8-80e0-395c2ad81403',
    ],
  ]) {
    const currentContent = `${selectionRequest}\n\n${catalogContext}`;
    const messages = [
      { role: 'user', content: 'Hey I want to automate my invoices' },
      { role: 'assistant', content: 'I found two matching automations.' },
      { role: 'user', content: question },
      { role: 'assistant', content: 'Here are the verified details.' },
      { role: 'user', content: currentContent },
    ];

    const resolved = resolveCatalogTurn(currentContent, messages);
    assert.equal(resolved.type, 'selection');
    assert.equal(resolved.selection.automationId, expectedId);
  }
});

test('does not invent a pronoun target without an immediately focused item', () => {
  const catalogContext = `[AVAILABLE AUTOMATIONS
- "Invoice Inbox to Google Sheets" (UUID: cc30a706-825d-494f-9de9-28835dbe813a)
- "Invoice Manager System" (UUID: 5f753d5a-bb21-45c8-80e0-395c2ad81403)]`;
  const currentContent = `Okey I want to use it\n\n${catalogContext}`;

  const noFocus = resolveCatalogTurn(currentContent, [
    { role: 'user', content: 'Hey I want to automate my invoices' },
    { role: 'assistant', content: 'I found two matching automations.' },
    { role: 'user', content: currentContent },
  ]);
  assert.equal(noFocus.type, 'clarification');

  const staleFocus = resolveCatalogTurn(currentContent, [
    { role: 'user', content: 'Tell me about the first one' },
    { role: 'assistant', content: 'It watches Gmail.' },
    { role: 'user', content: 'Thanks' },
    { role: 'assistant', content: "You're welcome." },
    { role: 'user', content: currentContent },
  ]);
  assert.equal(staleFocus.type, 'clarification');
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
