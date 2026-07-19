import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeActivepiecesWorkflow,
} from './workflow-analyzer.js';

const metadata = {
  '@activepieces/piece-orbit-crm': {
    displayName: 'Orbit CRM',
    version: '1.0.0',
    auth: { type: 'OAUTH2', required: true },
    triggers: {
      new_signal: {
        displayName: 'New Signal',
        props: {
          auth: { type: 'CUSTOM_AUTH', required: true },
          workspaceId: {
            displayName: 'Workspace',
            type: 'DROPDOWN',
            required: true,
            refreshers: ['auth'],
          },
          signalType: {
            displayName: 'Signal Type',
            type: 'STATIC_DROPDOWN',
            required: true,
          },
        },
      },
    },
  },
  '@activepieces/piece-nebula-parser': {
    displayName: 'Nebula Parser',
    version: '2.0.0',
    auth: null,
    actions: {
      parse: {
        displayName: 'Parse Payload',
        props: {
          source: { displayName: 'Source', type: 'LONG_TEXT', required: true },
          format: { displayName: 'Format', type: 'STATIC_DROPDOWN', required: true },
        },
      },
    },
  },
  '@activepieces/piece-quantum-transform': {
    displayName: 'Quantum Transform',
    version: '3.0.0',
    auth: null,
    actions: {
      transform: {
        displayName: 'Transform',
        props: {
          expression: { displayName: 'Expression', type: 'LONG_TEXT', required: true },
        },
      },
    },
  },
};

const template = {
  trigger: {
    name: 'trigger',
    displayName: 'Watch Signals',
    settings: {
      pieceName: '@activepieces/piece-orbit-crm',
      triggerName: 'new_signal',
      input: { signalType: 'priority' },
    },
    nextAction: {
      name: 'parse_payload',
      displayName: 'Parse Payload',
      settings: {
        pieceName: '@activepieces/piece-nebula-parser',
        actionName: 'parse',
        input: { source: '{{trigger.payload}}', format: 'json' },
      },
      nextAction: {
        name: 'transform_payload',
        displayName: 'Transform Payload',
        settings: {
          pieceName: '@activepieces/piece-quantum-transform',
          actionName: 'transform',
          input: {},
        },
      },
    },
  },
};

const metadataLoader = async ({ pieceName }) => {
  const result = metadata[pieceName];
  if (!result) throw new Error(`Unknown synthetic piece: ${pieceName}`);
  return result;
};

test('classifies unknown workflow pieces by metadata capabilities', async () => {
  const contract = await analyzeActivepiecesWorkflow({ template, metadataLoader });

  assert.deepEqual(contract.customerConnections.map((item) => item.pieceSlug), ['orbit-crm']);
  assert.deepEqual(contract.customerInputs.map((item) => item.fieldKey), ['TRIGGER.WORKSPACEID']);
  assert.deepEqual(
    contract.internalDependencies.map((item) => item.pieceSlug),
    ['nebula-parser', 'quantum-transform']
  );
  assert.ok(contract.customerTunables.some((item) => item.fieldKey === 'TRIGGER.SIGNALTYPE'));
  assert.ok(contract.customerTunables.some((item) => item.fieldKey === 'PARSE_PAYLOAD.FORMAT'));
  assert.ok(!contract.customerTunables.some((item) => item.fieldKey === 'PARSE_PAYLOAD.SOURCE'));
  assert.deepEqual(contract.unresolved.map((item) => item.fieldKey), ['TRANSFORM_PAYLOAD.EXPRESSION']);
});

test('keeps expressions protected while exposing portable literal settings', async () => {
  const contract = await analyzeActivepiecesWorkflow({ template, metadataLoader });

  assert.equal(contract.customerTunables.find((item) => item.fieldKey === 'TRIGGER.SIGNALTYPE')?.defaultValue, 'priority');
  assert.ok(contract.developerConfiguration.some((item) => item.fieldKey === 'PARSE_PAYLOAD.SOURCE'));
  assert.ok(contract.customerInputs.some((item) => item.fieldKey === 'TRIGGER.WORKSPACEID'));
});
