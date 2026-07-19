'use client';

import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, RefreshCw, Search, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ConfigForm({
  requiredInputs = [],
  optionalInputs = [],
  automationId,
  automationName,
  missingFields = [],
  collectedConfig = {},
  onSubmit
}) {
  const { isDarkMode } = useThemeAdaptive();
  const collectedConfigSignature = JSON.stringify(collectedConfig || {});
  const optionalDefaults = useMemo(() => getOptionalDefaults(optionalInputs), [optionalInputs]);
  const optionalDefaultsSignature = JSON.stringify(optionalDefaults);
  const [formData, setFormData] = useState(() => ({
    ...getOptionalDefaults(optionalInputs),
    ...normalizeConfigKeys(collectedConfig),
  }));
  const [optionState, setOptionState] = useState({});
  const [manualFields, setManualFields] = useState({});
  const [searchDrafts, setSearchDrafts] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [retryNonce, setRetryNonce] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const optionRequestSignaturesRef = useRef({});
  const optionAbortControllersRef = useRef({});
  const searchTimersRef = useRef({});
  const deferredCleanupRef = useRef(null);

  useEffect(() => {
    setFormData(prev => ({ ...optionalDefaults, ...prev, ...normalizeConfigKeys(collectedConfig) }));
  }, [collectedConfigSignature, optionalDefaultsSignature]);

  const fieldsToRender = useMemo(
    () => getFieldsToRender(requiredInputs, missingFields),
    [requiredInputs, missingFields]
  );
  const allInputs = [...requiredInputs, ...optionalInputs];
  const optionSignature = JSON.stringify({
    automationId,
    fields: fieldsToRender.map(input => ({
      key: getInputName(input),
      type: getInputType(input),
      propName: input?.propName,
      refreshers: input?.refreshers || input?.dependsOn || [],
      dependencyValues: (input?.refreshers || input?.dependsOn || []).reduce((values, dependency) => {
        const dependencyInput = allInputs.find(candidate => candidate?.propName === dependency);
        const dependencyKey = dependencyInput ? getInputName(dependencyInput) : String(dependency).toUpperCase();
        values[dependencyKey] = formData[dependencyKey];
        return values;
      }, {}),
      manual: Boolean(manualFields[getInputName(input)]),
      searchValue: searchTerms[getInputName(input)] || '',
      retry: retryNonce[getInputName(input)] || 0,
    })),
  });

  useEffect(() => {
    // Cancel a deferred cleanup when React Strict Mode immediately replays
    // this effect. A real unmount gets the cleanup on the next task.
    if (deferredCleanupRef.current) {
      window.clearTimeout(deferredCleanupRef.current);
      deferredCleanupRef.current = null;
    }

    const resolvableFields = fieldsToRender.filter(input => (
      canResolveActivepiecesField(input) && !manualFields[getInputName(input)]
    ));
    if (!automationId || resolvableFields.length === 0) return;

    async function loadOptions(input) {
      const fieldKey = getInputName(input);
      const dependencies = (input?.refreshers || input?.dependsOn || []).reduce((values, dependency) => {
        const dependencyInput = allInputs.find(candidate => candidate?.propName === dependency);
        const dependencyKey = dependencyInput ? getInputName(dependencyInput) : String(dependency).toUpperCase();
        values[dependencyKey] = formData[dependencyKey];
        return values;
      }, {});
      const requestSignature = JSON.stringify({
        automationId,
        fieldKey,
        dependencies,
        searchValue: searchTerms[fieldKey] || '',
        retry: retryNonce[fieldKey] || 0,
      });
      if (optionRequestSignaturesRef.current[fieldKey] === requestSignature) return;
      optionRequestSignaturesRef.current[fieldKey] = requestSignature;

      const knownMissingDependencies = (input?.refreshers || input?.dependsOn || [])
        .map(dependency => {
          const dependencyInput = allInputs.find(candidate => (
            candidate?.stepName === input?.stepName && candidate?.propName === dependency
          ));
          if (!dependencyInput) return null;
          const dependencyKey = getInputName(dependencyInput);
          const dependencyValue = formData[dependencyKey];
          return isBlankValue(dependencyValue)
            ? { fieldKey: dependencyKey, label: getInputLabel(dependencyInput), propName: dependency }
            : null;
        })
        .filter(Boolean);

      if (knownMissingDependencies.length > 0) {
        setOptionState(prev => ({
          ...prev,
          [fieldKey]: {
            loaded: true,
            loading: false,
            error: '',
            disabled: true,
            disabledReason: 'missing_dependencies',
            missingDependencies: knownMissingDependencies,
            options: [],
            dynamicFields: [],
          },
        }));
        return;
      }

      optionAbortControllersRef.current[fieldKey]?.abort('superseded');
      const controller = new AbortController();
      optionAbortControllersRef.current[fieldKey] = controller;
      const clientRequestId = globalThis.crypto?.randomUUID?.().slice(0, 8) || `${Date.now()}`.slice(-8);
      const requestStartedAt = performance.now();
      const requestTimeout = window.setTimeout(() => controller.abort('request_timeout'), 15000);
      const diagnosticInterval = window.setInterval(() => {
        console.warn(`[Setup Options][${clientRequestId}] still waiting`, {
          fieldKey,
          elapsedMs: Math.round(performance.now() - requestStartedAt),
        });
      }, 5000);

      console.info(`[Setup Options][${clientRequestId}] request:start`, {
        fieldKey,
        automationId,
        dependencyCount: Object.keys(dependencies).length,
      });

      setOptionState(prev => ({
        ...prev,
        [fieldKey]: { ...(prev[fieldKey] || {}), loading: true, error: '', disabledReason: '' },
      }));

      try {
        const response = await fetch('/api/activepieces/setup/options', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ModelGrow-Request-Id': clientRequestId,
            'X-ModelGrow-Automation-Id': String(automationId || ''),
            'X-ModelGrow-Field-Key': String(fieldKey || ''),
          },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            automationId,
            fieldKey,
            currentConfig: formData,
            searchValue: searchTerms[fieldKey] || undefined,
          }),
        });
        const data = await response.json().catch(() => ({}));
        console.info(`[Setup Options][${clientRequestId}] request:response`, {
          status: response.status,
          elapsedMs: Math.round(performance.now() - requestStartedAt),
          serverRequestId: data.requestId || response.headers.get('X-ModelGrow-Request-Id'),
          stage: data.stage || null,
          timings: data.timings || [],
          optionCount: Array.isArray(data.options) ? data.options.length : 0,
        });
        if (!response.ok) {
          const diagnostic = [
            data.stage ? `stage: ${formatSetupStage(data.stage)}` : '',
            data.requestId ? `request: ${data.requestId}` : '',
          ].filter(Boolean).join(' · ');
          throw new Error(`${data.error || 'Failed to load options'}${diagnostic ? ` (${diagnostic})` : ''}`);
        }
        if (controller.signal.aborted) return;

        if (Array.isArray(data.dynamicFields) && data.dynamicFields.length > 0) {
          setFormData(prev => {
            const existing = typeof prev[fieldKey] === 'object' && prev[fieldKey] !== null
              ? prev[fieldKey]
              : {};
            const withDefaults = { ...existing };
            data.dynamicFields.forEach(field => {
              if (withDefaults[field.name] === undefined && field.defaultValue !== undefined) {
                withDefaults[field.name] = field.defaultValue;
              }
            });
            return { ...prev, [fieldKey]: withDefaults };
          });
        }

        setOptionState(prev => ({
          ...prev,
          [fieldKey]: {
            loaded: true,
            loading: false,
            error: '',
            disabled: Boolean(data.disabled),
            disabledReason: data.reason || (data.disabled ? 'unavailable' : ''),
            placeholder: data.placeholder || '',
            missingDependencies: data.missingDependencies || [],
            options: Array.isArray(data.options) ? data.options : [],
            dynamicFields: Array.isArray(data.dynamicFields) ? data.dynamicFields : [],
            kind: data.kind || 'options',
          },
        }));
      } catch (loadError) {
        if (controller.signal.aborted && controller.signal.reason !== 'request_timeout') {
          console.info(`[Setup Options][${clientRequestId}] request:cancelled`, {
            reason: controller.signal.reason,
            elapsedMs: Math.round(performance.now() - requestStartedAt),
          });
          return;
        }
        console.error(`[Setup Options][${clientRequestId}] request:failed`, {
          reason: controller.signal.reason || loadError?.name || 'unknown',
          message: loadError?.message || 'Failed to load options',
          elapsedMs: Math.round(performance.now() - requestStartedAt),
        });
        const errorMessage = controller.signal.reason === 'request_timeout'
          ? `Choices could not be loaded within 15 seconds (request: ${clientRequestId}). Enter the value manually or try again.`
          : loadError.message || 'Failed to load options';
        setOptionState(prev => ({
          ...prev,
          [fieldKey]: {
            loaded: true,
            loading: false,
            error: errorMessage,
            options: [],
            dynamicFields: [],
          },
        }));
      } finally {
        window.clearTimeout(requestTimeout);
        window.clearInterval(diagnosticInterval);
      }
    }

    resolvableFields.forEach(loadOptions);
  }, [optionSignature]);

  useEffect(() => () => {
    Object.values(searchTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    searchTimersRef.current = {};
    deferredCleanupRef.current = window.setTimeout(() => {
      optionRequestSignaturesRef.current = {};
      Object.values(optionAbortControllersRef.current).forEach((controller) => controller?.abort('component_cleanup'));
      optionAbortControllersRef.current = {};
      deferredCleanupRef.current = null;
    }, 0);
  }, []);

  const handleManualModeChange = (fieldKey, manual) => {
    optionAbortControllersRef.current[fieldKey]?.abort();
    delete optionRequestSignaturesRef.current[fieldKey];
    setManualFields(prev => ({ ...prev, [fieldKey]: manual }));
    setOptionState(prev => ({
      ...prev,
      [fieldKey]: { ...(prev[fieldKey] || {}), loading: false, error: '' },
    }));
  };

  const handleOptionSearch = (fieldKey, value) => {
    setSearchDrafts(prev => ({ ...prev, [fieldKey]: value }));
    if (searchTimersRef.current[fieldKey]) window.clearTimeout(searchTimersRef.current[fieldKey]);
    searchTimersRef.current[fieldKey] = window.setTimeout(() => {
      setSearchTerms(prev => ({ ...prev, [fieldKey]: value.trim() }));
    }, 300);
  };

  const handleOptionRetry = (fieldKey) => {
    delete optionRequestSignaturesRef.current[fieldKey];
    setRetryNonce(prev => ({ ...prev, [fieldKey]: (prev[fieldKey] || 0) + 1 }));
  };

  const handleChange = (key, value, input = null) => {
    const changedProp = input?.propName;
    const dependentKeys = changedProp
      ? allInputs
          .filter(otherInput => {
            const otherKey = getInputName(otherInput);
            const dependencies = otherInput?.refreshers || otherInput?.dependsOn || [];
            return otherKey !== key && dependencies.includes(changedProp);
          })
          .map(getInputName)
      : [];

    setFormData(prev => {
      const next = { ...prev, [key]: value };
      dependentKeys.forEach(dependentKey => delete next[dependentKey]);
      return next;
    });

    if (dependentKeys.length > 0) {
      dependentKeys.forEach(dependentKey => delete optionRequestSignaturesRef.current[dependentKey]);
      setOptionState(current => {
        const next = { ...current };
        dependentKeys.forEach(dependentKey => {
          next[dependentKey] = {
            ...(current[dependentKey] || {}),
            options: [],
            dynamicFields: [],
            error: '',
          };
        });
        return next;
      });
    }
  };

  const handleNestedChange = (key, childName, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...(typeof prev[key] === 'object' && prev[key] !== null ? prev[key] : {}),
        [childName]: value,
      },
    }));
  };

  const handleFileChange = async (key, file) => {
    if (!file) return;
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setFormData(prev => ({ ...prev, [key]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Browsers and password/autofill extensions can update the visible DOM value
    // without firing React's onChange. Submit what the user can actually see.
    const submittedData = { ...formData };
    const visibleFormData = new FormData(e.currentTarget);
    for (const input of [...fieldsToRender, ...optionalInputs]) {
      const key = getInputName(input);
      const inputType = getInputType(input);
      if (inputType === 'file' || inputType === 'object') continue;
      if (inputType === 'checkbox') {
        submittedData[key] = visibleFormData.has(key);
      } else if (inputType === 'select' || inputType === 'multi_select') {
        // Select values may be structured objects. React state retains the real value;
        // the DOM only contains a serialized token used to identify the option.
        continue;
      } else {
        const value = visibleFormData.get(key);
        if (typeof value === 'string') submittedData[key] = value;
      }
    }

    setFormData(submittedData);

    setIsSubmitting(true);
    try {
      await onSubmit?.(submittedData, automationId, {
        automationName,
        requiredInputs,
        optionalInputs,
        missingFields
      });
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = requiredInputs.length - fieldsToRender.length;
  const hasBlockingFields = fieldsToRender.some(input => {
    const fieldKey = getInputName(input);
    if (input?.required === false || !canResolveActivepiecesField(input) || manualFields[fieldKey]) return false;
    const state = optionState[fieldKey] || {};
    if (!state.loaded || state.loading || state.error || state.disabled) return true;
    if (input.optionMode === 'dynamic_fields') return !state.dynamicFields?.length;
    return !state.options?.length;
  });

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        max-w-2xl overflow-hidden rounded-2xl border
        ${isDarkMode
          ? 'border-white/10 bg-slate-950/70 shadow-2xl shadow-black/20'
          : 'border-slate-200 bg-white shadow-xl shadow-slate-200/70'
        }
      `}
    >
      <div className={`border-b p-5 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="mb-2 flex items-center gap-2">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
            isDarkMode ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-50 text-violet-700'
          }`}>
            <Settings2 className="h-4 w-4" />
          </span>
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${
              isDarkMode ? 'text-violet-300' : 'text-violet-700'
            }`}>
              Setup details
            </p>
            <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
              {automationName ? `Configure ${automationName}` : 'Configure automation'}
            </h3>
          </div>
        </div>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Complete the required setup, or keep the developer defaults and optionally customize safe settings.
        </p>
      </div>

      {completedCount > 0 && (
        <div className={`mx-5 mt-5 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
          isDarkMode
            ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          <CheckCircle2 className="h-4 w-4" />
          {completedCount} field{completedCount === 1 ? '' : 's'} already collected.
        </div>
      )}

      <div className="space-y-4 p-5">
        {fieldsToRender.map((input) => {
          const inputName = getInputName(input);
          const inputType = getInputType(input);
          const label = getInputLabel(input);
          const description = typeof input === 'string' ? '' : input.description;
          
          return (
            <div key={inputName}>
              <label
                htmlFor={inputName}
                className={`mb-1 flex items-center justify-between text-sm font-bold ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <span>{label}</span>
                {typeof input !== 'string' && input.required && (
                  <span className={isDarkMode ? 'text-rose-300' : 'text-rose-500'}>*</span>
                )}
              </label>
              {description && (
                <p className={`mb-2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {description}
                </p>
              )}
              
              {inputType === 'file' ? (
                <input
                  id={inputName}
                  name={inputName}
                  type="file"
                  required={input?.required !== false}
                  onChange={(e) => handleFileChange(inputName, e.target.files[0])}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition
                    ${isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                      : 'bg-white border-gray-300 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                    }
                    focus:outline-none focus:ring-2 focus:ring-purple-500/20
                  `}
                />
              ) : (
                <FieldInput
                  id={inputName}
                  input={input}
                  inputType={inputType}
                  required={input?.required !== false}
                  value={formData[inputName] ?? ''}
                  onChange={(value) => handleChange(inputName, value, input)}
                  onNestedChange={(childName, value) => handleNestedChange(inputName, childName, value)}
                  isDarkMode={isDarkMode}
                  optionState={getFieldOptionState(input, optionState[inputName])}
                  manualMode={Boolean(manualFields[inputName])}
                  onManualModeChange={(manual) => handleManualModeChange(inputName, manual)}
                  searchValue={searchDrafts[inputName] || ''}
                  onSearchChange={(value) => handleOptionSearch(inputName, value)}
                  onRetry={() => handleOptionRetry(inputName)}
                />
              )}
            </div>
          );
        })}

        {optionalInputs.length > 0 && (
          <details className={`rounded-xl border p-4 ${
            isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/70'
          }`}>
            <summary className="cursor-pointer list-none">
              <span className={`block text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Customize settings
              </span>
              <span className={`mt-1 block text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Optional. Leave these unchanged to use the developer&apos;s defaults.
              </span>
            </summary>
            <div className="mt-4 space-y-4 border-t border-slate-200/60 pt-4">
              {optionalInputs.map((input) => {
                const inputName = getInputName(input);
                const inputType = getInputType(input);
                return (
                  <div key={inputName}>
                    <label htmlFor={inputName} className={`mb-1 block text-sm font-bold ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {getInputLabel(input)}
                    </label>
                    {input.description && (
                      <p className={`mb-2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {input.description}
                      </p>
                    )}
                    <FieldInput
                      id={inputName}
                      input={input}
                      inputType={inputType}
                      required={false}
                      value={formData[inputName] ?? ''}
                      onChange={(value) => handleChange(inputName, value, input)}
                      onNestedChange={(childName, value) => handleNestedChange(inputName, childName, value)}
                      isDarkMode={isDarkMode}
                      optionState={getFieldOptionState(input)}
                      manualMode={false}
                    />
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || hasBlockingFields}
        className={`
          mx-5 mb-5 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-xl px-4 py-3 font-black transition
          ${isSubmitting || hasBlockingFields
            ? 'cursor-not-allowed bg-slate-400'
            : 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-slate-950 hover:scale-[1.01]'
          }
          text-white
        `}
      >
        {isSubmitting
          ? 'Saving setup...'
          : hasBlockingFields
            ? 'Finish the required choices above'
            : requiredInputs.length > 0
              ? 'Continue setup'
              : 'Use these settings'}
        {!isSubmitting && !hasBlockingFields && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

function formatSetupStage(stage) {
  return String(stage || '')
    .split('_')
    .filter(Boolean)
    .join(' ');
}

function normalizeConfigKeys(config = {}) {
  return Object.entries(config || {}).reduce((acc, [key, value]) => {
    acc[String(key).toUpperCase()] = value;
    return acc;
  }, {});
}

function isBlankValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function getOptionalDefaults(optionalInputs = []) {
  return (optionalInputs || []).reduce((defaults, input) => {
    const key = getInputName(input);
    if (key && input?.defaultValue !== undefined) defaults[key] = input.defaultValue;
    return defaults;
  }, {});
}

function getInputName(input) {
  return String(typeof input === 'string' ? input : input.name || '').toUpperCase();
}

function getInputLabel(input) {
  if (typeof input !== 'string' && input.label) return input.label;
  const name = getInputName(input);
  const lastPart = name.split('.').pop() || name;
  return lastPart
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\bid\b/gi, 'ID')
    .replace(/\burl\b/gi, 'URL')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getInputType(input) {
  if (typeof input === 'string') return 'text';
  const type = String(input.type || '').toLowerCase();
  const propType = String(input.propType || '').toLowerCase();
  if (type === 'file') return 'file';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'checkbox';
  if (type === 'multi_select' || propType.includes('multi_select')) return 'multi_select';
  if (type === 'select' || propType.includes('dropdown')) return 'select';
  if (propType === 'dynamic' || type === 'object') return 'object';
  if (type === 'textarea') return 'textarea';
  return 'text';
}

function canResolveActivepiecesField(input) {
  if (!input || typeof input === 'string') return false;
  if (input.source !== 'activepieces') return false;
  return ['dynamic_options', 'dynamic_multi_select', 'dynamic_fields'].includes(input.optionMode);
}

function getFieldOptionState(input, state = {}) {
  const staticOptions = ['static_options', 'static_multi_select'].includes(input?.optionMode)
    ? input?.options || []
    : [];
  return {
    ...state,
    options: Array.isArray(state?.options) && state.options.length > 0
      ? state.options
      : staticOptions,
  };
}

function getOptionToken(value) {
  if (value === undefined) return '__undefined__';
  try {
    return JSON.stringify(value);
  } catch (_) {
    return String(value);
  }
}

function getFieldsToRender(requiredInputs, missingFields) {
  if (!Array.isArray(requiredInputs)) return [];
  if (!Array.isArray(missingFields) || missingFields.length === 0) return requiredInputs;

  const missing = new Set(missingFields.map(field => getInputName(field)));
  return requiredInputs.filter(input => missing.has(getInputName(input)));
}

function FieldInput({
  id,
  input,
  inputType,
  required,
  value,
  onChange,
  onNestedChange,
  isDarkMode,
  optionState,
  manualMode = false,
  onManualModeChange,
  searchValue = '',
  onSearchChange,
  onRetry,
}) {
  const baseClass = `
    w-full rounded-xl border px-3 py-3 text-sm font-semibold transition
    ${isDarkMode
      ? 'border-slate-700 bg-slate-900/80 text-white placeholder-slate-500 focus:border-violet-400'
      : 'border-slate-200 bg-slate-50 text-slate-950 placeholder-slate-400 focus:border-violet-500'
    }
    focus:outline-none focus:ring-2 focus:ring-violet-500/15
  `;

  const label = getInputLabel(input).toLowerCase();
  const placeholder = inputType === 'textarea'
    ? `Enter ${label}. JSON is supported when needed.`
    : `Enter ${label}`;

  const isDynamicOptions = ['dynamic_options', 'dynamic_multi_select'].includes(input?.optionMode);
  const isDynamicFields = input?.optionMode === 'dynamic_fields';
  const supportsManualMode = isDynamicOptions || isDynamicFields;
  const manualButtonClass = `text-xs font-bold transition ${
    isDarkMode ? 'text-violet-300 hover:text-violet-200' : 'text-violet-700 hover:text-violet-900'
  }`;

  const manualToggle = supportsManualMode && onManualModeChange ? (
    <button
      type="button"
      onClick={() => onManualModeChange(!manualMode)}
      className={manualButtonClass}
    >
      {manualMode ? 'Choose from connected account' : 'Enter a value manually'}
    </button>
  ) : null;

  if (manualMode) {
    const manualValue = inputType === 'multi_select'
      ? (Array.isArray(value) ? value.join(', ') : value || '')
      : (typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : value ?? '');
    return (
      <div className="space-y-2">
        {inputType === 'object' ? (
          <textarea
            id={id}
            name={id}
            required={required}
            value={manualValue}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            placeholder={`Paste the raw ${label} value`}
            className={baseClass}
          />
        ) : (
          <input
            id={id}
            name={id}
            required={required}
            type="text"
            value={manualValue}
            onChange={(event) => onChange(
              inputType === 'multi_select'
                ? event.target.value.split(',').map(item => item.trim()).filter(Boolean)
                : event.target.value
            )}
            placeholder={`Paste the ${label} ID or raw value`}
            className={baseClass}
          />
        )}
        <div className="flex justify-end">{manualToggle}</div>
      </div>
    );
  }

  if (optionState?.disabled && optionState.disabledReason === 'missing_dependencies') {
    const dependencies = (optionState.missingDependencies || []).map(dep => dep.label).join(', ');
    return (
      <div className="space-y-2">
        <div className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
          isDarkMode
            ? 'border-amber-400/20 bg-amber-400/10 text-amber-100'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          Select {dependencies || 'the required previous field'} first.
        </div>
        <div className="flex justify-end">{manualToggle}</div>
      </div>
    );
  }

  if (
    (isDynamicOptions || isDynamicFields) &&
    (optionState?.loading || !optionState?.loaded) &&
    !optionState?.options?.length &&
    !optionState?.dynamicFields?.length
  ) {
    return (
      <div className="space-y-2">
        <div className={`${baseClass} flex items-center gap-2`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading {label} choices from your connected account…
        </div>
        <div className="flex justify-end">{manualToggle}</div>
      </div>
    );
  }

  if (optionState?.error) {
    return (
      <div className="space-y-2">
        <div className={`rounded-xl border px-3 py-3 ${
          isDarkMode
            ? 'border-amber-400/20 bg-amber-400/10 text-amber-100'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}>
          <div className="flex items-start gap-2 text-sm font-semibold">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{optionState.error}</span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1 text-xs font-black"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
        <div className="flex justify-end">{manualToggle}</div>
      </div>
    );
  }

  if (isDynamicFields && optionState?.dynamicFields?.length > 0) {
    const objectValue = typeof value === 'object' && value !== null ? value : {};
    return (
      <div className="space-y-3">
        {optionState.dynamicFields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`${id}.${field.name}`}
              className={`mb-1 block text-xs font-black uppercase tracking-[0.08em] ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {field.label || field.name}
              {field.required !== false ? ' *' : ''}
            </label>
            <DynamicChildInput
              id={`${id}.${field.name}`}
              name={`${id}.${field.name}`}
              field={field}
              value={objectValue[field.name] ?? ''}
              onChange={(nextValue) => onNestedChange(field.name, nextValue)}
              isDarkMode={isDarkMode}
              className={baseClass}
            />
          </div>
        ))}
        <div className="flex justify-end">{manualToggle}</div>
      </div>
    );
  }

  if ((inputType === 'select' || inputType === 'multi_select') && optionState?.options?.length > 0) {
    const options = optionState.options;
    const optionValuesByToken = new Map(options.map(option => [getOptionToken(option.value), option.value]));
    const currentValues = inputType === 'multi_select'
      ? (Array.isArray(value) ? value : [])
      : (value === '' || value === undefined || value === null ? [] : [value]);
    currentValues.forEach(currentValue => {
      const token = getOptionToken(currentValue);
      if (!optionValuesByToken.has(token)) optionValuesByToken.set(token, currentValue);
    });
    const selectedTokens = inputType === 'multi_select'
      ? currentValues.map(getOptionToken)
      : (currentValues.length > 0 ? getOptionToken(currentValues[0]) : '');
    const knownTokens = new Set(options.map(option => getOptionToken(option.value)));
    const unknownCurrentValues = currentValues.filter(currentValue => !knownTokens.has(getOptionToken(currentValue)));

    return (
      <div className="space-y-2">
        {input?.refreshOnSearch && (
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={`Search ${label} choices`}
              className={`${baseClass} pl-10`}
            />
          </label>
        )}
        <select
          id={id}
          name={id}
          required={required}
          multiple={inputType === 'multi_select'}
          value={selectedTokens}
          onChange={(event) => onChange(
            inputType === 'multi_select'
              ? Array.from(event.target.selectedOptions, option => optionValuesByToken.get(option.value))
              : optionValuesByToken.get(event.target.value) ?? ''
          )}
          className={baseClass}
        >
          {inputType !== 'multi_select' && <option value="">Select {label}</option>}
          {unknownCurrentValues.map(currentValue => (
            <option key={`current-${getOptionToken(currentValue)}`} value={getOptionToken(currentValue)}>
              Current value ({typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue)})
            </option>
          ))}
          {options.map((option, index) => (
            <option key={`${getOptionToken(option.value)}-${index}`} value={getOptionToken(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        {optionState?.loading && (
          <p className={`flex items-center gap-1 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing choices…
          </p>
        )}
        <div className="flex justify-end">{manualToggle}</div>
      </div>
    );
  }

  if ((isDynamicOptions || isDynamicFields) && optionState?.loaded) {
    return (
      <div className="space-y-2">
        {input?.refreshOnSearch && (
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={`Search ${label} choices`}
              className={`${baseClass} pl-10`}
            />
          </label>
        )}
        <div className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
          isDarkMode ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          {optionState.placeholder || `No ${label} choices were found for this connection.`}
        </div>
        <div className="flex justify-end">{manualToggle}</div>
      </div>
    );
  }

  if (inputType === 'textarea' || inputType === 'object') {
    const textValue = typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2);
    return (
      <textarea
        id={id}
        name={id}
        required={required}
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={placeholder}
        className={baseClass}
      />
    );
  }

  if (inputType === 'checkbox') {
    return (
      <label className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold ${
        isDarkMode
          ? 'border-slate-700 bg-slate-900/80 text-white'
          : 'border-slate-200 bg-slate-50 text-slate-950'
      }`}>
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-violet-600"
        />
        Enabled
      </label>
    );
  }

  return (
    <input
      id={id}
      name={id}
      required={required}
      type={inputType}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={baseClass}
    />
  );
}

function DynamicChildInput({ id, name, field, value, onChange, className }) {
  const type = String(field?.type || '').toUpperCase();
  const required = field?.required !== false;
  const placeholder = `Enter ${(field?.label || field?.name || '').toLowerCase()}`;

  if (type.includes('CHECKBOX')) {
    return (
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-violet-600"
      />
    );
  }

  if (type.includes('DROPDOWN') && field?.options?.length > 0) {
    const optionValuesByToken = new Map(field.options.map(option => [getOptionToken(option.value), option.value]));
    const isMulti = type.includes('MULTI_SELECT');
    const selected = isMulti
      ? (Array.isArray(value) ? value.map(getOptionToken) : [])
      : (value === '' || value === undefined || value === null ? '' : getOptionToken(value));
    return (
      <select
        id={id}
        name={name}
        required={required}
        multiple={isMulti}
        value={selected}
        onChange={(event) => onChange(
          isMulti
            ? Array.from(event.target.selectedOptions, option => optionValuesByToken.get(option.value))
            : optionValuesByToken.get(event.target.value) ?? ''
        )}
        className={className}
      >
        {!isMulti && <option value="">Select {(field.label || field.name).toLowerCase()}</option>}
        {field.options.map((option, index) => (
          <option key={`${getOptionToken(option.value)}-${index}`} value={getOptionToken(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (type.includes('LONG_TEXT') || type.includes('JSON')) {
    const textValue = typeof value === 'string' ? value : JSON.stringify(value ?? '', null, 2);
    return (
      <textarea
        id={id}
        name={name}
        required={required}
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <input
      id={id}
      name={name}
      required={required}
      type={type.includes('NUMBER') ? 'number' : 'text'}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
