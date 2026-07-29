import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractSearchKeywords,
  normalizeSearchToken,
  scoreAutomationSearch,
} from './search-ranking.js';

test('normalizes invoice plurals and automation wording', () => {
  assert.equal(normalizeSearchToken('invoices'), 'invoice');
  assert.equal(normalizeSearchToken('automatically'), 'automat');
  assert.equal(normalizeSearchToken('automation'), 'automat');
});

test('keeps useful catalog intent and removes conversational filler', () => {
  assert.deepEqual(
    extractSearchKeywords('Hey I want to automate my invoices'),
    ['invoice']
  );
});

test('scores matching connectors more strongly than generic prose', () => {
  const keywords = extractSearchKeywords(
    'Automatically save every new invoice PDF from Gmail into Google Sheets'
  );
  const recurringScore = scoreAutomationSearch({
    automation: {
      name: 'Invoice Inbox to Google Sheets',
      description: 'Automatically watches Gmail for new invoice PDF attachments.',
    },
    connectors: ['gmail', 'google-sheets'],
    keywords,
  });
  const genericScore = scoreAutomationSearch({
    automation: {
      name: 'Invoice Manager System',
      description: 'Upload invoices and store their contents in a database.',
    },
    connectors: ['Google'],
    keywords,
  });

  assert.ok(recurringScore > genericScore);
});
