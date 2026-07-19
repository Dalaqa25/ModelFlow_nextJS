import { getPieceMetadata } from './client.js';
import {
  buildActivepiecesRequiredInput,
  getPieceSlug,
  isSystemConnectorSlug,
} from './setup-schema.js';

export const SETUP_CONTRACT_VERSION = 2;

const CUSTOMER_OWNER = 'customer';
const DEVELOPER_OWNER = 'developer';

export function getTemplateFlow(template) {
  if (Array.isArray(template?.flows)) return template.flows[0];
  if (template?.template?.trigger) return template.template;
  return template;
}

export function getTriggerFromTemplate(template) {
  const flow = getTemplateFlow(template);
  return flow?.trigger || flow?.version?.trigger || template?.trigger || null;
}

export function collectWorkflowSteps(step, steps = []) {
  if (!step || typeof step !== 'object') return steps;

  if (step.settings || step.pieceName) steps.push(step);

  if (step.nextAction) collectWorkflowSteps(step.nextAction, steps);
  if (Array.isArray(step.branches)) {
    for (const branch of step.branches) collectWorkflowSteps(branch, steps);
  }
  if (Array.isArray(step.children)) {
    for (const child of step.children) collectWorkflowSteps(child, steps);
  } else if (step.children && typeof step.children === 'object') {
    for (const child of Object.values(step.children)) collectWorkflowSteps(child, steps);
  }

  return steps;
}

function isEmptyValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function getStepDefinition(pieceMetadata, step) {
  const actionName = step.settings?.actionName;
  const triggerName = step.settings?.triggerName;
  if (actionName) return pieceMetadata?.actions?.[actionName] || null;
  if (triggerName) return pieceMetadata?.triggers?.[triggerName] || null;
  return null;
}

function normalizeAuthOptions(auth) {
  if (!auth) return [];
  return (Array.isArray(auth) ? auth : [auth]).filter((option) => option && option.required !== false);
}

function humanizePiece(pieceMetadata, pieceSlug) {
  if (pieceMetadata?.displayName) return pieceMetadata.displayName;
  return String(pieceSlug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isResourceSelector(prop, hasAuthentication) {
  const type = String(prop?.type || '').toUpperCase();
  const refreshers = Array.isArray(prop?.refreshers) ? prop.refreshers : [];

  if (!hasAuthentication || prop?.required === false) return false;
  if (!type.includes('DROPDOWN') || type.includes('STATIC_DROPDOWN')) return false;
  return refreshers.includes('auth') || refreshers.length > 0;
}

function containsExpression(value) {
  if (typeof value === 'string') return /\{\{[\s\S]*?\}\}/.test(value);
  if (Array.isArray(value)) return value.some(containsExpression);
  if (value && typeof value === 'object') return Object.values(value).some(containsExpression);
  return false;
}

function isPortableLiteral(value) {
  return ['string', 'number', 'boolean'].includes(typeof value) && !containsExpression(value);
}

function isSafeCustomerTunable(prop, value) {
  const type = String(prop?.type || '').toUpperCase();
  const safeTypes = ['CHECKBOX', 'NUMBER', 'SHORT_TEXT', 'LONG_TEXT', 'STATIC_DROPDOWN'];

  if (!safeTypes.some((safeType) => type.includes(safeType))) return false;
  if (/SECRET|PASSWORD|AUTH|FILE|CODE|MARKDOWN|DYNAMIC/.test(type)) return false;
  return isPortableLiteral(value);
}

function normalizeStaticOptions(prop) {
  const rawOptions = Array.isArray(prop?.options)
    ? prop.options
    : Array.isArray(prop?.options?.options)
      ? prop.options.options
      : [];

  return rawOptions.map((option) => ({
    label: String(option?.label ?? option?.value ?? option ?? ''),
    value: option?.value ?? option,
  }));
}

function describeFixedField({ step, pieceName, pieceSlug, propName, prop, definition, canAskCustomer, order }) {
  return {
    ...buildActivepiecesRequiredInput({
      step,
      definition,
      pieceName,
      pieceSlug,
      propName,
      prop,
      order,
    }),
    configured: true,
    owner: DEVELOPER_OWNER,
    canAskCustomer,
  };
}

function dedupeBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function analyzeActivepiecesWorkflow({
  template,
  token,
  projectId,
  metadataLoader = getPieceMetadata,
}) {
  const trigger = getTriggerFromTemplate(template);
  const steps = collectWorkflowSteps(trigger);
  const metadataCache = new Map();
  const customerConnections = [];
  const customerInputs = [];
  const customerTunables = [];
  const developerConfiguration = [];
  const internalDependencies = [];
  const unresolved = [];

  for (const step of steps) {
    const pieceName = step.settings?.pieceName || step.pieceName || null;
    const pieceSlug = getPieceSlug(pieceName);
    if (!pieceName || !pieceSlug || isSystemConnectorSlug(pieceSlug)) continue;

    let pieceMetadata = metadataCache.get(pieceName);
    if (!pieceMetadata) {
      try {
        pieceMetadata = await metadataLoader({ token, pieceName, projectId });
        metadataCache.set(pieceName, pieceMetadata);
      } catch (error) {
        unresolved.push({
          type: 'piece_metadata',
          pieceName,
          pieceSlug,
          stepName: step.name || null,
          message: `ModelGrow could not inspect ${pieceSlug}: ${error.message}`,
        });
        continue;
      }
    }

    const authOptions = normalizeAuthOptions(pieceMetadata?.auth);
    const hasAuthentication = authOptions.length > 0;
    const dependency = {
      pieceName,
      pieceSlug,
      displayName: humanizePiece(pieceMetadata, pieceSlug),
      pieceVersion: step.settings?.pieceVersion || pieceMetadata?.version || null,
      steps: [{
        stepName: step.name || null,
        stepDisplayName: step.displayName || null,
        actionName: step.settings?.actionName || null,
        triggerName: step.settings?.triggerName || null,
      }],
    };

    if (hasAuthentication) {
      customerConnections.push({
        ...dependency,
        owner: CUSTOMER_OWNER,
        authTypes: authOptions.map((option) => option.type).filter(Boolean),
      });
    } else {
      internalDependencies.push({
        ...dependency,
        owner: 'platform',
        category: 'internal',
      });
    }

    const definition = getStepDefinition(pieceMetadata, step);
    if (!definition) {
      unresolved.push({
        type: 'step_definition',
        pieceName,
        pieceSlug,
        stepName: step.name || null,
        message: `ModelGrow could not find metadata for ${step.displayName || step.name || pieceSlug}.`,
      });
      continue;
    }

    const configuredInput = step.settings?.input || {};
    for (const [propName, prop] of Object.entries(definition.props || {})) {
      if (propName === 'auth') continue;

      const configuredValue = configuredInput[propName];
      const configured = !isEmptyValue(configuredValue);
      const required = prop?.required !== false;
      const resourceSelector = isResourceSelector(prop, hasAuthentication);

      const missingRequiredValue = required && !configured && !Object.prototype.hasOwnProperty.call(prop || {}, 'defaultValue');

      if (resourceSelector || (hasAuthentication && missingRequiredValue)) {
        const input = buildActivepiecesRequiredInput({
          step,
          definition,
          pieceName,
          pieceSlug,
          propName,
          prop,
          order: customerInputs.length,
        });
        customerInputs.push({
          ...input,
          owner: CUSTOMER_OWNER,
          classification: resourceSelector ? 'resource_selector' : 'missing_required_value',
          confidence: resourceSelector ? 'medium' : 'high',
          templateConfigured: configured,
        });
        continue;
      }

      if (missingRequiredValue) {
        unresolved.push({
          type: 'missing_internal_configuration',
          pieceName,
          pieceSlug,
          stepName: step.name || null,
          fieldKey: `${step.name || pieceSlug}.${propName}`.toUpperCase(),
          message: `${step.displayName || definition.displayName || pieceSlug} is missing required field ${prop?.displayName || propName}.`,
        });
        continue;
      }

      if (configured) {
        const describedField = describeFixedField({
          step,
          pieceName,
          pieceSlug,
          propName,
          prop,
          definition,
          canAskCustomer: hasAuthentication,
          order: developerConfiguration.length,
        });

        if (isSafeCustomerTunable(prop, configuredValue)) {
          customerTunables.push({
            ...describedField,
            owner: CUSTOMER_OWNER,
            required: false,
            classification: 'safe_literal_tunable',
            defaultValue: configuredValue,
            options: normalizeStaticOptions(prop),
            order: customerTunables.length,
          });
        } else {
          developerConfiguration.push(describedField);
        }
      }
    }
  }

  const mergeDependencySteps = (items) => {
    const bySlug = new Map();
    for (const item of items) {
      const existing = bySlug.get(item.pieceSlug);
      if (existing) {
        existing.steps.push(...item.steps);
      } else {
        bySlug.set(item.pieceSlug, { ...item, steps: [...item.steps] });
      }
    }
    return Array.from(bySlug.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  return {
    version: SETUP_CONTRACT_VERSION,
    generatedAt: new Date().toISOString(),
    customerConnections: mergeDependencySteps(customerConnections),
    customerInputs: dedupeBy(customerInputs, (input) => input.fieldKey),
    customerTunables: dedupeBy(customerTunables, (field) => field.fieldKey),
    developerConfiguration: dedupeBy(developerConfiguration, (field) => field.fieldKey),
    internalDependencies: mergeDependencySteps(internalDependencies),
    unresolved,
  };
}

export function getRequiredConnectorsFromContract(contract) {
  return (contract?.customerConnections || []).map((connection) => connection.pieceSlug).filter(Boolean);
}

export function getRequiredInputsFromContract(contract) {
  return (contract?.customerInputs || []).map((input, order) => ({ ...input, order }));
}
