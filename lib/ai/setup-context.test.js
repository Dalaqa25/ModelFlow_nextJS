import test from 'node:test';
import assert from 'node:assert/strict';
import { findLatestSetupMarker } from './setup-context.js';

test('uses the newest ready-to-run setup from a long conversation', () => {
  const content = [
    '[READY_TO_RUN automation_id="first" config={"proof_text":"old"}]',
    'unrelated chat',
    '[READY_TO_RUN automation_id="second" config={"proof_text":"new"}]',
  ].join('\n');

  assert.deepEqual(findLatestSetupMarker(content, 'READY_TO_RUN'), {
    automationId: 'second',
    config: { proof_text: 'new' },
    index: content.lastIndexOf('[READY_TO_RUN'),
  });
});

test('parses nested setup JSON and braces inside strings', () => {
  const content = '[READY_TO_RUN automation_id="nested" config={"body":{"enabled":true},"label":"value {kept}"}]';
  assert.deepEqual(findLatestSetupMarker(content, 'READY_TO_RUN')?.config, {
    body: { enabled: true },
    label: 'value {kept}',
  });
});

test('keeps background prompts independent from ready-to-run markers', () => {
  const content = [
    '[READY_TO_RUN automation_id="run" config={"mode":"manual"}]',
    '[BACKGROUND_PROMPT automation_id="background" config={"mode":"watch"}]',
  ].join('\n');
  assert.equal(findLatestSetupMarker(content, 'BACKGROUND_PROMPT')?.automationId, 'background');
});
