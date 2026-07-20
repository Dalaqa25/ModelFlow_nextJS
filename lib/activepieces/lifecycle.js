import { getPieceSlug, normalizeSetupInputs } from './setup-schema.js';
import { getTriggerFromTemplate } from './workflow-analyzer.js';

export const AUTOMATION_LIFECYCLE_VERSION = 1;

const ACTIVEPIECES_KIND_TO_LEGACY_TRIGGER_TYPE = {
  external_app_event: 'event',
  scheduled_event: 'schedule',
  webhook_event: 'webhook',
  manual_run: 'manual',
  unknown: 'event',
};

function parseMaybeJson(value) {
  if (!value || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return value;
  }
}

export function getAutomationWorkflowTemplate(workflow) {
  const parsed = parseMaybeJson(workflow);
  return parsed?.template || parsed;
}

function humanizeSlug(value) {
  return String(value || '')
    .replace(/^@activepieces\/piece-/, '')
    .replace(/^piece-/, '')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeEventName(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTriggerPieceSlug(trigger) {
  return getPieceSlug(trigger?.settings?.pieceName || trigger?.pieceName || trigger?.name);
}

function getTriggerEventName(trigger) {
  return (
    trigger?.displayName ||
    trigger?.settings?.triggerName ||
    trigger?.triggerName ||
    trigger?.name ||
    ''
  );
}

function getTriggerInputSummary(trigger) {
  const input = trigger?.settings?.input;
  if (!input || typeof input !== 'object') return [];

  const ignoredKeys = new Set(['auth', 'authType', 'authFields']);
  return Object.entries(input)
    .filter(([key, value]) => (
      !ignoredKeys.has(key) &&
      value !== undefined &&
      value !== null &&
      value !== '' &&
      ['string', 'number', 'boolean'].includes(typeof value) &&
      !String(value).includes('{{')
    ))
    .map(([key, value]) => ({
      key,
      label: humanizeEventName(key),
      value,
    }));
}

export function classifyActivepiecesTrigger({ workflow, template, activepiecesTriggerType } = {}) {
  const resolvedTemplate = template || getAutomationWorkflowTemplate(workflow);
  const trigger = getTriggerFromTemplate(resolvedTemplate);
  const pieceSlug = getTriggerPieceSlug(trigger);
  const legacyType = String(activepiecesTriggerType || '').toLowerCase();

  const triggerType = String(trigger?.type || '').toUpperCase();
  const eventName = humanizeEventName(getTriggerEventName(trigger));
  const appName = humanizeSlug(pieceSlug || legacyType || 'automation');
  const inputSummary = getTriggerInputSummary(trigger);

  if (pieceSlug === 'schedule' || legacyType === 'schedule') {
    return {
      kind: 'scheduled_event',
      legacyTriggerType: 'schedule',
      postSetupAction: 'configure_publish_wait',
      trigger,
      pieceSlug,
      appName: appName || 'Schedule',
      eventName: eventName || 'Scheduled Run',
      inputSummary,
      requiresManualStart: false,
      waitsForExternalEvent: true,
      allowsUserUploadAfterSetup: false,
      allowedActions: ['configure_activepieces', 'publish_activepieces', 'confirm_waiting'],
      forbiddenActions: ['request_file_upload'],
    };
  }

  if (pieceSlug === 'webhook' || legacyType === 'webhook') {
    return {
      kind: 'webhook_event',
      legacyTriggerType: 'webhook',
      postSetupAction: 'ready_to_execute',
      trigger,
      pieceSlug,
      appName: appName || 'Webhook',
      eventName: eventName || 'Webhook Request',
      inputSummary,
      requiresManualStart: true,
      waitsForExternalEvent: false,
      allowsUserUploadAfterSetup: false,
      allowedActions: ['confirm_ready_to_run', 'execute_activepieces'],
      forbiddenActions: ['request_file_upload'],
    };
  }

  if (pieceSlug === 'manual' || triggerType === 'EMPTY' || legacyType === 'manual') {
    return {
      kind: 'manual_run',
      legacyTriggerType: 'manual',
      postSetupAction: 'ready_to_execute',
      trigger,
      pieceSlug,
      appName: appName || 'Manual',
      eventName: eventName || 'Manual Run',
      inputSummary,
      requiresManualStart: true,
      waitsForExternalEvent: false,
      allowsUserUploadAfterSetup: false,
      allowedActions: ['confirm_ready_to_run', 'execute_activepieces'],
      forbiddenActions: ['request_file_upload'],
    };
  }

  if (triggerType === 'PIECE_TRIGGER' || pieceSlug) {
    return {
      kind: 'external_app_event',
      legacyTriggerType: 'event',
      postSetupAction: 'configure_publish_wait',
      trigger,
      pieceSlug,
      appName: appName || 'Connected App',
      eventName: eventName || 'App Event',
      inputSummary,
      requiresManualStart: false,
      waitsForExternalEvent: true,
      allowsUserUploadAfterSetup: false,
      allowedActions: ['configure_activepieces', 'publish_activepieces', 'confirm_waiting'],
      forbiddenActions: ['request_file_upload'],
    };
  }

  return {
    kind: 'unknown',
    legacyTriggerType: ACTIVEPIECES_KIND_TO_LEGACY_TRIGGER_TYPE.unknown,
    postSetupAction: 'ready_to_execute',
    trigger,
    pieceSlug,
    appName: appName || 'Automation',
    eventName: eventName || 'Configured Trigger',
    inputSummary,
    requiresManualStart: true,
    waitsForExternalEvent: false,
    allowsUserUploadAfterSetup: false,
    allowedActions: ['confirm_ready_to_run'],
    forbiddenActions: ['request_file_upload'],
  };
}

export function getLegacyTriggerTypeFromWorkflow({ workflow, template, activepiecesTriggerType } = {}) {
  const classified = classifyActivepiecesTrigger({ workflow, template, activepiecesTriggerType });
  return classified.legacyTriggerType || ACTIVEPIECES_KIND_TO_LEGACY_TRIGGER_TYPE[classified.kind] || 'event';
}

export function isCustomerFileInput(input) {
  const normalized = typeof input === 'string'
    ? { name: input, fieldKey: input }
    : input || {};

  const haystack = [
    normalized.type,
    normalized.propType,
    normalized.name,
    normalized.fieldKey,
    normalized.label,
    normalized.description,
  ].filter(Boolean).join(' ').toLowerCase();

  return /\b(file|upload|video|image|document|pdf)\b/.test(haystack);
}

function normalizeConfig(config = {}) {
  return Object.entries(config || {}).reduce((acc, [key, value]) => {
    acc[String(key).toUpperCase()] = value;
    return acc;
  }, {});
}

function normalizeRequiredInputs(requiredInputs = []) {
  const parsed = parseMaybeJson(requiredInputs);
  if (Array.isArray(parsed)) return normalizeSetupInputs(parsed);
  if (typeof parsed === 'string') {
    return normalizeSetupInputs(
      parsed.split(',').map((name) => ({ name: name.trim() })).filter((input) => input.name)
    );
  }
  return [];
}

function hasSetupValue(value) {
  return value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');
}

export function getMissingSetupInputs(requiredInputs = [], config = {}) {
  const normalizedConfig = normalizeConfig(config);
  return normalizeRequiredInputs(requiredInputs).filter((input) => {
    if (input.required === false) return false;
    return !hasSetupValue(normalizedConfig[input.fieldKey || String(input.name || '').toUpperCase()]);
  });
}

export function buildAutomationLifecycle({ automation, config = {} } = {}) {
  const requiredInputs = normalizeRequiredInputs(automation?.required_inputs || []);
  const missingInputs = getMissingSetupInputs(requiredInputs, config);
  const missingFileInputs = missingInputs.filter(isCustomerFileInput);
  const trigger = classifyActivepiecesTrigger({
    workflow: automation?.workflow,
    activepiecesTriggerType: automation?.activepieces_trigger_type,
  });

  const setupComplete = missingInputs.length === 0;
  const setupAction = missingFileInputs.length > 0
    ? 'request_customer_file_upload'
    : missingInputs.length > 0
      ? 'collect_missing_config'
      : 'none';

  return {
    version: AUTOMATION_LIFECYCLE_VERSION,
    automationId: automation?.id || null,
    automationName: automation?.name || 'Automation',
    engine: automation?.activepieces_source_flow_id ? 'activepieces' : 'internal',
    setupComplete,
    setupAction,
    missingInputs,
    missingFileInputs,
    trigger,
    postSetupAction: setupComplete ? trigger.postSetupAction : setupAction,
    allowedActions: setupComplete
      ? trigger.allowedActions
      : missingFileInputs.length > 0
        ? ['request_file_upload', 'collect_missing_config']
        : ['collect_missing_config'],
    forbiddenActions: setupComplete
      ? trigger.forbiddenActions
      : [],
  };
}

export function shouldConfigureActivepiecesAutomation({ automation, lifecycle } = {}) {
  return Boolean(
    automation?.activepieces_source_flow_id &&
    lifecycle?.setupComplete &&
    lifecycle?.postSetupAction === 'configure_publish_wait'
  );
}

export function describePostSetupLifecycle(lifecycle) {
  const trigger = lifecycle?.trigger || {};
  const appName = trigger.appName || 'the connected app';
  const eventName = trigger.eventName || 'the configured event';

  if (trigger.kind === 'scheduled_event') {
    return `It is configured and will run on its automation schedule.`;
  }

  if (trigger.kind === 'external_app_event') {
    const criteria = trigger.inputSummary?.length
      ? ` Matching trigger settings: ${trigger.inputSummary.map((item) => `${item.label}: ${item.value}`).join(', ')}.`
      : '';
    return `ModelGrow enabled the runtime workflow for ${eventName} events in ${appName}.${criteria} It is waiting for the connected app to deliver a matching event. You do not need to upload files to ModelGrow unless a setup field explicitly asks for an upload.`;
  }

  if (trigger.kind === 'webhook_event') {
    return `It is configured and ready to run from ModelGrow.`;
  }

  if (trigger.kind === 'manual_run') {
    return `It is configured and ready to run when you start it.`;
  }

  return `It is configured and ready for the next valid trigger.`;
}
