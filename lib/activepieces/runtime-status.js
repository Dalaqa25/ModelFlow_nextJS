import {
  adminSignIn,
  getFlow,
  getFlowTemplate,
  getFirstFlowTriggerFromTemplate,
  isActivepiecesConfigured,
  listFlowRuns,
} from './client.js';

const TERMINAL_RUN_STATUSES = new Set([
  'SUCCEEDED',
  'FAILED',
  'INTERNAL_ERROR',
  'TIMEOUT',
  'STOPPED',
]);

const SUCCESS_RUN_STATUSES = new Set(['SUCCEEDED']);
const PROCESSING_RUN_STATUSES = new Set(['QUEUED', 'RUNNING', 'PAUSED']);

function safeJsonParse(value) {
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function pieceNameToLabel(pieceName) {
  const slug = String(pieceName || '')
    .replace(/^@activepieces\/piece-/, '')
    .replace(/^piece-/, '')
    .trim();

  if (!slug) return null;

  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getStepAppLabel(step) {
  return step?.appName ||
    pieceNameToLabel(step?.settings?.pieceName || step?.pieceName) ||
    null;
}

function getStepEventLabel(step) {
  return step?.settings?.triggerName ||
    step?.settings?.actionName ||
    step?.triggerName ||
    step?.actionName ||
    step?.displayName ||
    step?.name ||
    null;
}

function normalizeTriggerFromTemplate(template) {
  const trigger = getFirstFlowTriggerFromTemplate(template);
  if (!trigger) return null;
  const input = trigger.settings?.input && typeof trigger.settings.input === 'object'
    ? trigger.settings.input
    : {};

  return {
    name: trigger.name || null,
    displayName: trigger.displayName || null,
    app: getStepAppLabel(trigger),
    event: getStepEventLabel(trigger),
    pieceName: trigger.settings?.pieceName || trigger.pieceName || null,
    type: trigger.type || null,
    criteria: summarizeTriggerCriteria(input),
  };
}

function summarizeTriggerCriteria(input) {
  return Object.entries(input || {})
    .filter(([key, value]) => key !== 'auth' && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const label = key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      if (typeof value === 'object') {
        return {
          key,
          label,
          value: value.name || value.id || JSON.stringify(value),
        };
      }

      return {
        key,
        label,
        value: String(value),
      };
    });
}

function extractFailedStep(run) {
  const failedStep = run?.failedStep || run?.failed_step || null;
  if (!failedStep) return null;

  return {
    name: failedStep.name || null,
    displayName: failedStep.displayName || failedStep.display_name || failedStep.name || null,
    app: getStepAppLabel(failedStep),
    message: extractRunErrorMessage({ ...run, failedStep }),
  };
}

function extractRunErrorMessage(run) {
  const failedStep = run?.failedStep || run?.failed_step;
  const rawMessage =
    failedStep?.message ||
    failedStep?.errorMessage ||
    run?.errorMessage ||
    run?.error ||
    run?.message ||
    null;

  const parsed = safeJsonParse(rawMessage);
  const apiMessage =
    parsed?.response?.body?.error?.message ||
    parsed?.response?.body?.message ||
    parsed?.body?.error?.message ||
    parsed?.body?.message ||
    parsed?.message ||
    null;

  const message = apiMessage || (typeof rawMessage === 'string' ? rawMessage : null);
  const stepName = failedStep?.displayName || failedStep?.display_name || failedStep?.name || null;

  if (stepName && message) return `${stepName} failed: ${message}`;
  if (stepName) return `${stepName} failed.`;
  return message;
}

function normalizeRun(run) {
  if (!run) return null;

  const status = String(run.status || 'UNKNOWN').toUpperCase();
  const failedStep = extractFailedStep(run);

  return {
    id: run.id || null,
    status,
    success: SUCCESS_RUN_STATUSES.has(status),
    processing: PROCESSING_RUN_STATUSES.has(status),
    terminal: TERMINAL_RUN_STATUSES.has(status),
    createdAt: normalizeDate(run.created || run.createdAt || run.startTime || run.startedAt),
    updatedAt: normalizeDate(run.updated || run.updatedAt || run.finishTime || run.finishedAt),
    durationMs: typeof run.duration === 'number' ? run.duration : null,
    failedStep,
    errorMessage: failedStep?.message || extractRunErrorMessage(run),
  };
}

function normalizeUpstreamErrorMessage(error) {
  const rawMessage = String(error?.message || error?.code || '').trim();
  const rawCode = String(error?.code || '').trim();
  const combined = `${rawCode} ${rawMessage}`.toUpperCase();

  if (combined.includes('ENTITY_NOT_FOUND') || combined.includes('NOT_FOUND')) {
    return 'The ModelGrow Builder runtime copy is missing or stale. Re-run setup for this automation so ModelGrow can recreate the runtime workflow.';
  }

  if (combined.includes('UNAUTHORIZED') || combined.includes('FORBIDDEN')) {
    return 'ModelGrow could not read this runtime workflow from ModelGrow Builder. Check the builder connection and project permissions.';
  }

  return rawMessage || 'Could not read ModelGrow Builder runtime status.';
}

function isMissingRuntimeError(error) {
  const combined = `${error?.code || ''} ${error?.message || ''}`.toUpperCase();
  return combined.includes('ENTITY_NOT_FOUND') || combined.includes('NOT_FOUND');
}

function detectDuplicateBurst(runs) {
  const normalized = runs
    .map((run) => ({ run, time: new Date(run.createdAt || 0).getTime() }))
    .filter((item) => item.time > 0)
    .sort((a, b) => b.time - a.time);

  if (normalized.length < 2) return null;

  const [latest, previous] = normalized;
  const deltaMs = latest.time - previous.time;

  if (deltaMs >= 0 && deltaMs <= 30_000) {
    return {
      detected: true,
      message: 'Multiple runs started within 30 seconds. This may indicate duplicate trigger delivery or duplicate runtime flows.',
      runIds: [latest.run.id, previous.run.id].filter(Boolean),
    };
  }

  return null;
}

async function getRuntimeFlowRecord({ supabase, userId, automationId }) {
  const { data, error } = await supabase
    .from('activepieces_runtime_flows')
    .select('*')
    .eq('user_id', userId)
    .eq('automation_id', automationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getAutomationRecord({ supabase, automationId }) {
  const { data, error } = await supabase
    .from('automations')
    .select('id, name, workflow, requires_background, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
    .eq('id', automationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function normalizeNativeExecution(execution) {
  if (!execution) return null;

  const rawStatus = String(execution.status || 'UNKNOWN').toUpperCase();
  const status = rawStatus === 'SUCCESS' ? 'SUCCEEDED' : rawStatus;
  const success = status === 'SUCCEEDED';
  const processing = ['QUEUED', 'RUNNING', 'PAUSED'].includes(status);

  return {
    id: execution.id || null,
    executionId: execution.metadata?.executionId || execution.metadata?.execution_id || null,
    status,
    success,
    processing,
    terminal: success || ['FAILED', 'INTERNAL_ERROR', 'TIMEOUT', 'STOPPED'].includes(status),
    createdAt: normalizeDate(execution.started_at),
    updatedAt: normalizeDate(execution.completed_at || execution.started_at),
    durationMs: typeof execution.duration_ms === 'number' ? execution.duration_ms : null,
    failedStep: execution.metadata?.failedStep || execution.metadata?.failed_step || null,
    errorMessage: execution.error_message || null,
  };
}

function getNativeTrigger(workflow, requiresBackground) {
  const parsedWorkflow = typeof workflow === 'string' ? safeJsonParse(workflow) : workflow;
  const nodes = Array.isArray(parsedWorkflow?.nodes) ? parsedWorkflow.nodes : [];
  const triggerNode = nodes.find((node) => {
    const type = String(node?.type || '').toLowerCase();
    return type.includes('trigger') || type.includes('webhook');
  }) || nodes[0] || null;

  if (!triggerNode) return null;

  const type = String(triggerNode.type || '');
  const typeParts = type.split('.');
  const rawApp = typeParts.at(-2) || typeParts.at(-1) || 'n8n';
  const app = rawApp
    .replace(/^n8n-nodes-base$/i, 'n8n')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    name: triggerNode.name || null,
    displayName: triggerNode.name || null,
    app,
    event: requiresBackground ? (triggerNode.name || 'Background trigger') : 'Run on demand',
    pieceName: type || null,
    type: type || null,
    criteria: [],
  };
}

async function getNativeRuntimeStatus({ supabase, user, automation, automationId, limit }) {
  const [{ data: userAutomation, error: userAutomationError }, { data: executions, error: executionsError }] = await Promise.all([
    supabase
      .from('user_automations')
      .select('id, is_active, last_run_at, run_count, parameters, automation_data, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('automation_id', automationId)
      .maybeSingle(),
    supabase
      .from('automation_executions')
      .select('id, status, started_at, completed_at, duration_ms, error_message, metadata')
      .eq('automation_id', automationId)
      .eq('executed_by', user.email)
      .order('started_at', { ascending: false })
      .limit(limit),
  ]);

  if (userAutomationError) throw userAutomationError;
  if (executionsError) throw executionsError;

  const recentRuns = (executions || []).map(normalizeNativeExecution).filter(Boolean);
  const lastExecution = userAutomation?.automation_data?.lastExecution;

  if (lastExecution) {
    const nativeLastRun = normalizeNativeExecution({
      id: lastExecution.executionId || null,
      status: lastExecution.success ? 'success' : 'failed',
      started_at: userAutomation.last_run_at || lastExecution.completedAt,
      completed_at: lastExecution.completedAt || userAutomation.last_run_at,
      duration_ms: null,
      error_message: lastExecution.errorMessage || null,
      metadata: { executionId: lastExecution.executionId },
    });
    const nativeTime = new Date(nativeLastRun?.updatedAt || nativeLastRun?.createdAt || 0).getTime();
    const alreadyRepresented = recentRuns.some((run) => {
      if (nativeLastRun?.executionId && run.executionId === nativeLastRun.executionId) return true;
      const runTime = new Date(run.updatedAt || run.createdAt || 0).getTime();
      return nativeTime > 0 && runTime > 0 && Math.abs(nativeTime - runTime) <= 5_000 && run.status === nativeLastRun?.status;
    });

    if (nativeLastRun && !alreadyRepresented) recentRuns.push(nativeLastRun);
  }

  recentRuns.sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });

  const latestRun = recentRuns[0] || null;
  const background = Boolean(automation.requires_background);
  const active = background ? Boolean(userAutomation?.is_active) : null;
  let state = background ? (active ? 'active' : 'paused') : 'ready';
  if (latestRun?.processing) state = 'running';
  if (latestRun && !latestRun.processing) state = latestRun.success ? 'succeeded' : 'failed';
  if (!userAutomation) state = 'needs_setup';

  return {
    engine: 'n8n-native',
    state,
    active,
    runMode: background ? 'background' : 'on_demand',
    automation: {
      id: automation.id,
      name: automation.name,
    },
    runtimeFlow: userAutomation ? {
      id: userAutomation.id,
      status: background ? (active ? 'active' : 'paused') : 'ready',
      updatedAt: userAutomation.updated_at,
      activatedAt: userAutomation.created_at,
      flowStatus: state.toUpperCase(),
    } : null,
    trigger: getNativeTrigger(automation.workflow, background),
    latestRun,
    recentRuns,
    duplicateBurst: detectDuplicateBurst(recentRuns),
    duplicateListenerRisk: null,
    message: userAutomation
      ? null
      : 'Finish setup before running this automation.',
  };
}

export async function getActivepiecesRuntimeStatus({ supabase, user, automationId, limit = 5 }) {
  if (!automationId) {
    const error = new Error('automationId is required');
    error.status = 400;
    throw error;
  }

  const automation = await getAutomationRecord({ supabase, automationId });
  if (!automation) {
    const error = new Error('Automation not found');
    error.status = 404;
    throw error;
  }

  if (!automation.activepieces_source_flow_id) {
    return getNativeRuntimeStatus({
      supabase,
      user,
      automation,
      automationId,
      limit,
    });
  }

  if (!isActivepiecesConfigured()) {
    return {
      engine: 'activepieces',
      state: 'unavailable',
      active: null,
      automation: {
        id: automation.id,
        name: automation.name,
      },
      runtimeFlow: null,
      trigger: null,
      latestRun: null,
      recentRuns: [],
      duplicateBurst: null,
      message: 'ModelGrow Builder is not configured.',
    };
  }

  const runtimeFlow = await getRuntimeFlowRecord({
    supabase,
    userId: user.id,
    automationId,
  });

  if (!runtimeFlow?.activepieces_flow_id || !runtimeFlow?.activepieces_project_id) {
    return {
      engine: 'activepieces',
      state: 'needs_setup',
      active: false,
      automation: {
        id: automation.id,
        name: automation.name,
      },
      runtimeFlow: runtimeFlow ? {
        id: runtimeFlow.id,
        status: runtimeFlow.status,
        projectId: runtimeFlow.activepieces_project_id,
        flowId: runtimeFlow.activepieces_flow_id,
        updatedAt: runtimeFlow.updated_at,
      } : null,
      trigger: null,
      latestRun: null,
      recentRuns: [],
      duplicateBurst: null,
      message: 'No runtime workflow exists for this user automation yet.',
    };
  }

  const admin = await adminSignIn();
  let activepiecesFlow = null;
  let sourceFlow = null;
  let template = null;
  let runsResponse = null;
  let upstreamError = null;
  const shouldInspectSourceFlow =
    runtimeFlow.activepieces_source_project_id &&
    runtimeFlow.activepieces_source_flow_id &&
    (
      runtimeFlow.activepieces_source_project_id !== runtimeFlow.activepieces_project_id ||
      runtimeFlow.activepieces_source_flow_id !== runtimeFlow.activepieces_flow_id
    );

  try {
    [activepiecesFlow, template, runsResponse, sourceFlow] = await Promise.all([
      getFlow({
        token: admin.token,
        projectId: runtimeFlow.activepieces_project_id,
        flowId: runtimeFlow.activepieces_flow_id,
      }).catch((error) => ({ error })),
      getFlowTemplate({
        token: admin.token,
        projectId: runtimeFlow.activepieces_project_id,
        flowId: runtimeFlow.activepieces_flow_id,
      }).catch((error) => ({ error })),
      listFlowRuns({
        token: admin.token,
        projectId: runtimeFlow.activepieces_project_id,
        flowId: runtimeFlow.activepieces_flow_id,
        limit,
      }).catch((error) => ({ error })),
      shouldInspectSourceFlow
        ? getFlow({
          token: admin.token,
          projectId: runtimeFlow.activepieces_source_project_id,
          flowId: runtimeFlow.activepieces_source_flow_id,
        }).catch((error) => ({ error }))
        : Promise.resolve(null),
    ]);
  } catch (error) {
    upstreamError = error;
  }

  if (activepiecesFlow?.error) upstreamError = activepiecesFlow.error;
  if (template?.error) template = null;
  if (runsResponse?.error) {
    upstreamError = upstreamError || runsResponse.error;
    runsResponse = null;
  }
  if (sourceFlow?.error) sourceFlow = null;

  const recentRuns = (Array.isArray(runsResponse?.data) ? runsResponse.data : [])
    .map(normalizeRun)
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  const latestRun = recentRuns[0] || null;
  const trigger = template ? normalizeTriggerFromTemplate(template) : null;
  const flowStatus = activepiecesFlow && !activepiecesFlow.error
    ? String(activepiecesFlow.status || activepiecesFlow.version?.status || runtimeFlow.status || '').toUpperCase()
    : String(runtimeFlow.status || '').toUpperCase();
  const sourceFlowStatus = sourceFlow
    ? String(sourceFlow.status || sourceFlow.version?.status || '').toUpperCase()
    : null;
  const active = runtimeFlow.status === 'active' || flowStatus === 'ENABLED';
  const duplicateListenerRisk = active && sourceFlowStatus === 'ENABLED';

  let state = active ? 'active' : 'paused';
  if (upstreamError) state = isMissingRuntimeError(upstreamError) ? 'unavailable' : 'error';
  if (latestRun?.processing) {
    state = 'running';
  }

  return {
    engine: 'activepieces',
    state,
    active,
    automation: {
      id: automation.id,
      name: automation.name,
    },
    runtimeFlow: {
      id: runtimeFlow.id,
      status: runtimeFlow.status,
      projectId: runtimeFlow.activepieces_project_id,
      flowId: runtimeFlow.activepieces_flow_id,
      sourceProjectId: runtimeFlow.activepieces_source_project_id,
      sourceFlowId: runtimeFlow.activepieces_source_flow_id,
      updatedAt: runtimeFlow.updated_at,
      activatedAt: runtimeFlow.metadata?.prepared_at || runtimeFlow.metadata?.copied_at || runtimeFlow.updated_at,
      flowStatus,
    },
    sourceFlow: shouldInspectSourceFlow ? {
      projectId: runtimeFlow.activepieces_source_project_id,
      flowId: runtimeFlow.activepieces_source_flow_id,
      flowStatus: sourceFlowStatus,
      duplicateListenerRisk,
    } : null,
    trigger,
    latestRun,
    recentRuns,
    duplicateBurst: detectDuplicateBurst(recentRuns),
    duplicateListenerRisk: duplicateListenerRisk ? {
      detected: true,
      message: 'The source builder flow is also enabled. It can listen to the same trigger as the runtime copy and create duplicate results.',
    } : null,
    message: upstreamError ? normalizeUpstreamErrorMessage(upstreamError) : null,
  };
}
