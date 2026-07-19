import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSourceFlowBlockReason,
  isModelGrowRuntimeFlow,
  isPublishableSourceFlow,
} from './flow-guards.js';

test('blocks ModelGrow runtime flows even if metadata or name is the only signal', () => {
  assert.equal(isModelGrowRuntimeFlow({
    displayName: 'Totally renamed',
    metadata: { modelgrowRuntime: true },
  }), true);

  assert.equal(isModelGrowRuntimeFlow({
    displayName: 'ModelGrow Runtime - Invoice to spreadsheets',
    metadata: null,
  }), true);

  assert.equal(getSourceFlowBlockReason({
    id: 'runtime-1',
    displayName: 'ModelGrow Runtime - Invoice to spreadsheets',
    status: 'ENABLED',
    publishedVersionId: 'version-1',
  }), 'runtime_copy');
});

test('allows only published and enabled source builder flows', () => {
  assert.equal(getSourceFlowBlockReason({
    id: 'draft-1',
    displayName: 'Draft flow',
    status: 'DISABLED',
    publishedVersionId: null,
  }), 'not_published');

  assert.equal(getSourceFlowBlockReason({
    id: 'disabled-1',
    displayName: 'Disabled published flow',
    status: 'DISABLED',
    publishedVersionId: 'version-1',
  }), 'not_enabled');

  assert.equal(isPublishableSourceFlow({
    id: 'ready-1',
    displayName: 'Ready flow',
    status: 'ENABLED',
    publishedVersionId: 'version-1',
  }), true);
});
