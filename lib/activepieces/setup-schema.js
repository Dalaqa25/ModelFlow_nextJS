const SYSTEM_CONNECTOR_SLUGS = new Set(['manual', 'webhook', 'schedule', 'trigger']);

export function getPieceSlug(pieceName) {
  if (!pieceName || typeof pieceName !== 'string') return null;
  return pieceName
    .replace(/^@activepieces\/piece-/, '')
    .replace(/^piece-/, '')
    .trim()
    .toLowerCase();
}

export function getInputKey(input) {
  return String(typeof input === 'string' ? input : input?.name || '').toUpperCase();
}

export function getInputPropName(input) {
  if (!input || typeof input === 'string') return null;
  return input.propName || getInputKey(input).split('.').pop() || null;
}

export function isSystemConnectorSlug(slug) {
  return !slug || SYSTEM_CONNECTOR_SLUGS.has(slug);
}

export function mapActivepiecesPropType(type) {
  const normalized = String(type || '').toUpperCase();
  if (normalized.includes('CHECKBOX')) return 'boolean';
  if (normalized.includes('NUMBER')) return 'number';
  if (normalized.includes('LONG_TEXT')) return 'textarea';
  if (normalized.includes('MULTI_SELECT')) return 'multi_select';
  if (normalized.includes('DROPDOWN') || normalized.includes('STATIC_DROPDOWN')) return 'select';
  if (normalized.includes('DYNAMIC')) return 'object';
  return 'text';
}

export function buildActivepiecesRequiredInput({ step, definition, pieceName, pieceSlug, propName, prop, order }) {
  const componentType = step.settings?.actionName ? 'action' : 'trigger';
  const componentName = step.settings?.actionName || step.settings?.triggerName || null;
  const inputName = `${step.name || pieceSlug}.${propName}`;
  const refreshers = Array.isArray(prop?.refreshers)
    ? prop.refreshers.filter((refresher) => refresher && refresher !== 'auth')
    : [];

  return {
    name: inputName,
    fieldKey: inputName.toUpperCase(),
    label: prop?.displayName || propName,
    description: prop?.description || `${prop?.displayName || propName} for ${step.displayName || definition?.displayName || pieceSlug}`,
    type: mapActivepiecesPropType(prop?.type),
    required: true,
    source: 'activepieces',
    pieceName,
    pieceSlug,
    stepName: step.name || null,
    stepDisplayName: step.displayName || null,
    actionName: step.settings?.actionName || null,
    triggerName: step.settings?.triggerName || null,
    componentName,
    componentType,
    propName,
    propType: prop?.type || null,
    pieceVersion: step.settings?.pieceVersion || null,
    refreshers,
    dependsOn: refreshers,
    order,
    optionMode: getOptionMode(prop?.type),
    refreshOnSearch: prop?.refreshOnSearch === true,
    options: normalizeStaticOptions(prop),
  };
}

export function normalizeSetupInputs(inputs = []) {
  if (!Array.isArray(inputs)) return [];
  return inputs.map((input, index) => {
    if (typeof input === 'string') {
      return {
        name: input,
        fieldKey: input.toUpperCase(),
        label: humanizeFieldName(input),
        type: 'text',
        required: true,
        source: 'manual',
        order: index,
      };
    }

    const name = input.name || input.fieldKey || '';
    const propType = String(input.propType || '').toUpperCase();
    return {
      ...input,
      name,
      fieldKey: String(input.fieldKey || name).toUpperCase(),
      label: input.label || humanizeFieldName(name),
      type: input.type || mapActivepiecesPropType(propType),
      required: input.required !== false,
      componentType: input.componentType || (input.actionName ? 'action' : input.triggerName ? 'trigger' : null),
      componentName: input.componentName || input.actionName || input.triggerName || null,
      refreshers: Array.isArray(input.refreshers) ? input.refreshers.filter((refresher) => refresher !== 'auth') : [],
      dependsOn: Array.isArray(input.dependsOn) ? input.dependsOn.filter((refresher) => refresher !== 'auth') : [],
      optionMode: input.optionMode || getOptionMode(propType),
      order: Number.isFinite(Number(input.order)) ? Number(input.order) : index,
    };
  }).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function buildActivepiecesInputForResolver(requiredInputs, collectedConfig, targetInput, baseInput = {}) {
  const normalizedConfig = normalizeConfigKeys(collectedConfig);
  const targetStepName = targetInput?.stepName || null;
  const input = { ...(baseInput && typeof baseInput === 'object' ? baseInput : {}) };

  for (const field of normalizeSetupInputs(requiredInputs)) {
    if (targetStepName && field.stepName !== targetStepName) continue;
    const propName = getInputPropName(field);
    if (!propName) continue;
    const value = normalizedConfig[field.fieldKey || getInputKey(field)];
    if (value !== undefined && value !== null && value !== '') {
      input[propName] = value;
    }
  }

  return input;
}

export function normalizeConfigKeys(config = {}) {
  return Object.entries(config || {}).reduce((acc, [key, value]) => {
    acc[String(key).toUpperCase()] = value;
    return acc;
  }, {});
}

export function normalizeActivepiecesOptionsResponse(response) {
  const responseType = String(response?.type || '').toUpperCase();
  const nestedDropdownState = response?.options && Array.isArray(response.options.options)
    ? response.options
    : null;
  const directDropdownState = Array.isArray(response?.options) ? response : null;
  const dropdownState = nestedDropdownState || directDropdownState;

  if (dropdownState || responseType.includes('DROPDOWN')) {
    const state = dropdownState || response?.options || {};
    const options = Array.isArray(state?.options) ? state.options : [];
    return {
      kind: responseType.includes('MULTI_SELECT') ? 'multi_options' : 'options',
      options: options.map((option) => ({
        label: String(option?.label ?? option?.value ?? option ?? ''),
        value: option?.value ?? option,
      })),
      disabled: Boolean(state?.disabled),
      placeholder: state?.placeholder || '',
      dynamicFields: [],
    };
  }

  const dynamicProperties = responseType.includes('DYNAMIC')
    ? response?.options
    : response?.options && typeof response.options === 'object'
      ? response.options
      : response;

  if (dynamicProperties && typeof dynamicProperties === 'object' && !Array.isArray(dynamicProperties)) {
    return {
      kind: 'dynamic_fields',
      options: [],
      dynamicFields: Object.entries(dynamicProperties).map(([name, prop]) => ({
        name,
        label: prop?.displayName || name,
        description: prop?.description || '',
        required: prop?.required !== false,
        type: prop?.type || 'TEXT',
        defaultValue: prop?.defaultValue,
        options: normalizeStaticOptions(prop),
      })),
      disabled: Boolean(response?.disabled),
      placeholder: response?.placeholder || '',
    };
  }

  return {
    kind: 'options',
    options: [],
    dynamicFields: [],
    disabled: Boolean(response?.disabled),
    placeholder: response?.placeholder || '',
  };
}

export function getCustomerTunablesFromWorkflow(workflow) {
  let parsedWorkflow = workflow;
  if (typeof parsedWorkflow === 'string') {
    try {
      parsedWorkflow = JSON.parse(parsedWorkflow);
    } catch (_) {
      return [];
    }
  }

  return normalizeSetupInputs(parsedWorkflow?.setup_contract?.customerTunables || [])
    .map((input) => ({ ...input, required: false }));
}

export function getOptionMode(propType) {
  const normalized = String(propType || '').toUpperCase();
  if (normalized.includes('STATIC_MULTI_SELECT')) return 'static_multi_select';
  if (normalized.includes('STATIC_DROPDOWN')) return 'static_options';
  if (normalized.includes('MULTI_SELECT')) return 'dynamic_multi_select';
  if (normalized.includes('DROPDOWN')) return 'dynamic_options';
  if (normalized.includes('DYNAMIC')) return 'dynamic_fields';
  return 'manual';
}

export function normalizeStaticOptions(prop) {
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

function humanizeFieldName(name) {
  return String(name || '')
    .split('.')
    .pop()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\bid\b/gi, 'ID')
    .replace(/\burl\b/gi, 'URL')
    .replace(/\b\w/g, char => char.toUpperCase());
}
