import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAutomationLifecycle,
  classifyActivepiecesTrigger,
  describePostSetupLifecycle,
  getLegacyTriggerTypeFromWorkflow,
} from './lifecycle.js';

function pieceTrigger({ pieceName, triggerName, displayName = null, input = {} }) {
  return {
    trigger: {
      name: 'trigger',
      displayName,
      type: 'PIECE_TRIGGER',
      settings: {
        pieceName,
        triggerName,
        input,
      },
    },
  };
}

test('classifies any non-system Activepieces piece trigger as a generic external app event', () => {
  const lifecycle = buildAutomationLifecycle({
    automation: {
      id: 'automation-1',
      name: 'Invoice to spreadsheets',
      activepieces_source_flow_id: 'flow-1',
      workflow: {
        template: pieceTrigger({
          pieceName: '@activepieces/piece-gmail',
          triggerName: 'new_attachment',
          displayName: 'New Attachment',
          input: { filenameExtension: 'pdf' },
        }),
      },
      required_inputs: [
        { name: 'add_row.spreadsheetId', fieldKey: 'ADD_ROW.SPREADSHEETID', required: true },
        { name: 'add_row.sheetId', fieldKey: 'ADD_ROW.SHEETID', required: true },
      ],
    },
    config: {
      'ADD_ROW.SPREADSHEETID': 'spreadsheet-123',
      'ADD_ROW.SHEETID': 'Sheet1',
    },
  });

  assert.equal(lifecycle.setupComplete, true);
  assert.equal(lifecycle.trigger.kind, 'external_app_event');
  assert.equal(lifecycle.trigger.appName, 'Gmail');
  assert.equal(lifecycle.trigger.eventName, 'New Attachment');
  assert.equal(lifecycle.postSetupAction, 'configure_publish_wait');
  assert.ok(lifecycle.forbiddenActions.includes('request_file_upload'));
  assert.match(describePostSetupLifecycle(lifecycle), /enabled the runtime workflow for New Attachment events in Gmail/i);
  assert.match(describePostSetupLifecycle(lifecycle), /waiting for the connected app to deliver a matching event/i);
  assert.match(describePostSetupLifecycle(lifecycle), /Filename Extension: pdf/i);
});

test('uses the same lifecycle behavior for unknown future app connectors', () => {
  const trigger = classifyActivepiecesTrigger({
    template: pieceTrigger({
      pieceName: '@activepieces/piece-acme-cloud',
      triggerName: 'new_customer_event',
    }),
  });

  assert.equal(trigger.kind, 'external_app_event');
  assert.equal(trigger.legacyTriggerType, 'event');
  assert.equal(trigger.postSetupAction, 'configure_publish_wait');
  assert.equal(trigger.appName, 'Acme Cloud');
  assert.equal(trigger.eventName, 'New Customer Event');
});

test('classifies schedule triggers as configure-and-wait without upload', () => {
  const lifecycle = buildAutomationLifecycle({
    automation: {
      name: 'Daily summary',
      activepieces_source_flow_id: 'flow-1',
      workflow: {
        template: pieceTrigger({
          pieceName: '@activepieces/piece-schedule',
          triggerName: 'every_day',
          displayName: 'Every Day',
        }),
      },
      activepieces_trigger_type: 'schedule',
      required_inputs: [],
    },
    config: {},
  });

  assert.equal(lifecycle.trigger.kind, 'scheduled_event');
  assert.equal(lifecycle.postSetupAction, 'configure_publish_wait');
  assert.equal(lifecycle.trigger.legacyTriggerType, 'schedule');
  assert.ok(lifecycle.forbiddenActions.includes('request_file_upload'));
});

test('classifies webhook and empty/manual flows as ready-to-run instead of waiting external app flows', () => {
  const webhook = classifyActivepiecesTrigger({
    template: pieceTrigger({
      pieceName: '@activepieces/piece-webhook',
      triggerName: 'catch_webhook',
    }),
  });

  const manual = classifyActivepiecesTrigger({
    template: {
      trigger: {
        name: 'trigger',
        type: 'EMPTY',
        settings: {},
      },
    },
  });

  assert.equal(webhook.kind, 'webhook_event');
  assert.equal(webhook.postSetupAction, 'ready_to_execute');
  assert.equal(manual.kind, 'manual_run');
  assert.equal(manual.postSetupAction, 'ready_to_execute');
  assert.equal(getLegacyTriggerTypeFromWorkflow({ template: { trigger: manual.trigger } }), 'manual');
});

test('only allows upload action when an explicit missing file field exists', () => {
  const lifecycle = buildAutomationLifecycle({
    automation: {
      name: 'Video poster',
      activepieces_source_flow_id: null,
      workflow: {},
      required_inputs: [
        { name: 'VIDEO_FILES', fieldKey: 'VIDEO_FILES', type: 'file', required: true },
        { name: 'SCHEDULE_INTERVAL_HOURS', fieldKey: 'SCHEDULE_INTERVAL_HOURS', type: 'number', required: true },
      ],
    },
    config: {
      SCHEDULE_INTERVAL_HOURS: 6,
    },
  });

  assert.equal(lifecycle.setupComplete, false);
  assert.equal(lifecycle.setupAction, 'request_customer_file_upload');
  assert.deepEqual(lifecycle.missingFileInputs.map((field) => field.fieldKey), ['VIDEO_FILES']);
  assert.ok(lifecycle.allowedActions.includes('request_file_upload'));
});
