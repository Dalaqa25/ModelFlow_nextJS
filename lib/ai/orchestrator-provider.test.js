import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCodexConversationState,
  buildCodexOrchestratorPrompt,
  buildCodexSessionTurnPrompt,
  createCodexResponseDeltaParser,
  getCodexAllowedActions,
  getOrchestratorProvider,
  normalizeOrchestratorDecision,
  shouldFallbackToGroq,
} from './orchestrator-provider.js';

test('defaults to Codex with no silent Groq fallback', () => {
  const provider = process.env.AI_ORCHESTRATOR_PROVIDER;
  const fallback = process.env.CODEX_FALLBACK_TO_GROQ;
  delete process.env.AI_ORCHESTRATOR_PROVIDER;
  delete process.env.CODEX_FALLBACK_TO_GROQ;

  try {
    assert.equal(getOrchestratorProvider(), 'codex');
    assert.equal(shouldFallbackToGroq(), false);
  } finally {
    if (provider === undefined) delete process.env.AI_ORCHESTRATOR_PROVIDER;
    else process.env.AI_ORCHESTRATOR_PROVIDER = provider;
    if (fallback === undefined) delete process.env.CODEX_FALLBACK_TO_GROQ;
    else process.env.CODEX_FALLBACK_TO_GROQ = fallback;
  }
});

test('Codex prompt contains only a compact recent conversation and action contract', () => {
  const messages = Array.from({ length: 20 }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `message-${index}`,
  }));
  const prompt = buildCodexOrchestratorPrompt({ messages, isAuthenticated: true });

  assert.match(prompt, /ModelGrow's chat decision engine/);
  assert.match(prompt, /ModelGrow product contract/);
  assert.match(prompt, /automation marketplace and guided setup experience/);
  assert.match(prompt, /Chat cannot invent or build a brand-new custom workflow/);
  assert.match(prompt, /"Available automations" means approved, active marketplace listings/);
  assert.match(prompt, /"Enabled" or "active" means a runtime instance is permitted/);
  assert.match(prompt, /execution status, outputs, run counts, and errors come only from runtime records/);
  assert.match(prompt, /show_user_automations/);
  assert.match(prompt, /message-19/);
  assert.doesNotMatch(prompt, /message-10/);
  assert.match(prompt, /"authenticated":true/);
  assert.match(prompt, /"phase":"discovery"/);
  assert.match(prompt, /"productContractVersion":"2026-07-17\.1"/);
});

test('persistent Codex turns send only the latest assistant result and user message', () => {
  const messages = Array.from({ length: 8 }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `turn-${index}`,
  }));
  const prompt = buildCodexSessionTurnPrompt({
    messages,
    isAuthenticated: true,
    latestOnly: true,
  });

  assert.doesNotMatch(prompt, /turn-5/);
  assert.match(prompt, /turn-6/);
  assert.match(prompt, /turn-7/);
  assert.doesNotMatch(prompt, /ModelGrow's chat decision engine/);
});

test('sends authoritative setup progress without setup values', () => {
  const state = buildCodexConversationState({
    isAuthenticated: true,
    setupContext: {
      automationId: 'automation-123',
      automationName: 'Invoice processor',
      missingFields: [{ name: 'BILLING_EMAIL' }],
      collectedConfig: { SPREADSHEET_ID: 'secret-value' },
    },
  });

  assert.deepEqual(state, {
    authenticated: true,
    phase: 'setup',
    automationSelected: true,
    automationId: 'automation-123',
    automationName: 'Invoice processor',
    missingFields: ['BILLING_EMAIL'],
    collectedFieldNames: ['SPREADSHEET_ID'],
  });

  const prompt = buildCodexOrchestratorPrompt({
    messages: [{ role: 'user', content: 'billing@example.com' }],
    isAuthenticated: true,
    setupContext: {
      automationId: 'automation-123',
      missingFields: ['BILLING_EMAIL'],
      collectedConfig: { SPREADSHEET_ID: 'secret-value' },
    },
  });
  assert.match(prompt, /collect_text_input/);
  assert.doesNotMatch(prompt, /secret-value/);
  const runtimePayload = prompt.slice(prompt.indexOf('ModelGrow context'));
  assert.doesNotMatch(runtimePayload, /"name":"search_automations"/);
});

test('limits actions by the current ModelGrow phase', () => {
  assert.deepEqual(getCodexAllowedActions({ phase: 'background_confirmation', authenticated: true }), [
    'save_background_config',
  ]);
  assert.ok(getCodexAllowedActions({ phase: 'ready', authenticated: true }).includes('execute_automation'));
  assert.ok(!getCodexAllowedActions({ phase: 'ready', authenticated: true }).includes('search_automations'));
  assert.deepEqual(getCodexAllowedActions({ phase: 'catalog_selection', authenticated: true }), []);
});

test('catalog selection state exposes names but permits no model-selected tools', () => {
  const state = buildCodexConversationState({
    isAuthenticated: true,
    setupContext: {
      catalogOptions: [
        {
          automationName: 'Invoice Inbox to Google Sheets',
          automationId: 'private-id-1',
          description: 'Watches Gmail for invoice attachments.',
          requires: ['gmail', 'google-sheets'],
        },
        {
          automationName: 'Invoice Manager System',
          automationId: 'private-id-2',
          description: 'Accepts manual PDF uploads.',
          requires: ['Google'],
        },
      ],
      catalogFocus: 'Invoice Inbox to Google Sheets',
    },
  });

  assert.deepEqual(state, {
    authenticated: true,
    phase: 'catalog_selection',
    automationSelected: false,
    automationId: null,
    automationName: null,
    missingFields: [],
    collectedFieldNames: [],
    catalogOptions: [
      {
        name: 'Invoice Inbox to Google Sheets',
        description: 'Watches Gmail for invoice attachments.',
        requires: ['gmail', 'google-sheets'],
      },
      {
        name: 'Invoice Manager System',
        description: 'Accepts manual PDF uploads.',
        requires: ['Google'],
      },
    ],
    catalogFocus: 'Invoice Inbox to Google Sheets',
  });
  assert.deepEqual(getCodexAllowedActions(state), []);
});

test('catalog state excludes private automation ids while retaining truthful details', () => {
  const prompt = buildCodexOrchestratorPrompt({
    messages: [{ role: 'user', content: 'Tell me more about the first one' }],
    isAuthenticated: true,
    setupContext: {
      catalogOptions: [{
        automationName: 'Invoice Inbox to Google Sheets',
        automationId: 'private-id-must-not-reach-model',
        description: 'Watches Gmail for invoice attachments.',
        requires: ['gmail', 'google-sheets'],
      }],
      catalogFocus: 'Invoice Inbox to Google Sheets',
    },
  });

  assert.match(prompt, /Watches Gmail for invoice attachments/);
  assert.match(prompt, /google-sheets/);
  assert.doesNotMatch(prompt, /private-id-must-not-reach-model/);
});

test('rejects globally valid actions that are invalid in the current phase', () => {
  assert.throws(() => normalizeOrchestratorDecision({
    response: 'Searching.',
    action: { tool: 'search_automations', hint: '' },
  }, ['collect_text_input']), /unsupported ModelGrow action/);
});

test('normalizes a valid Codex tool decision', () => {
  assert.deepEqual(normalizeOrchestratorDecision(JSON.stringify({
    response: 'Let me check that.',
    action: { tool: 'show_user_automations', hint: 'user asked what is running' },
  })), {
    response: 'Let me check that.',
    action: { tool: 'show_user_automations', hint: 'user asked what is running' },
  });
});

test('rejects actions outside the ModelGrow allowlist', () => {
  assert.throws(() => normalizeOrchestratorDecision({
    response: 'Running a command.',
    action: { tool: 'shell_exec', hint: '' },
  }), /unsupported ModelGrow action/);
});

test('extracts only the user-visible response from streamed structured JSON', () => {
  const chunks = [];
  const parseDelta = createCodexResponseDeltaParser(chunk => chunks.push(chunk));

  for (const delta of [
    '{"action":null,"res',
    'ponse":"Hello',
    ', bro!\\nLet\\u0027s go',
    '."}',
  ]) {
    parseDelta(delta);
  }

  assert.equal(chunks.join(''), "Hello, bro!\nLet's go.");
});
