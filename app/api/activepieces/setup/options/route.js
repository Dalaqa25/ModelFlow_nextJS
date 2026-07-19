import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { userDB } from '@/lib/db/supabase-db';
import {
  getFirstFlowTriggerFromTemplate,
  getFlow,
  getPieceMetadata,
  isActivepiecesConfigured,
  resolvePieceOptions,
} from '@/lib/activepieces/client';
import { listRuntimeConnectionStatus } from '@/lib/activepieces/connections';
import {
  buildActivepiecesInputForResolver,
  getInputKey,
  getInputPropName,
  getCustomerTunablesFromWorkflow,
  normalizeActivepiecesOptionsResponse,
  normalizeConfigKeys,
  normalizeSetupInputs,
} from '@/lib/activepieces/setup-schema';

export const dynamic = 'force-dynamic';

function createRequestTrace(candidateRequestId) {
  const requestId = /^[a-zA-Z0-9_-]{4,64}$/.test(candidateRequestId || '')
    ? candidateRequestId
    : crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();
  const timings = [];
  let activeStage = 'request';

  return {
    requestId,
    timings,
    get activeStage() {
      return activeStage;
    },
    get durationMs() {
      return Date.now() - startedAt;
    },
    async run(stage, timeoutMs, operation) {
      activeStage = stage;
      const stageStartedAt = Date.now();
      console.info(`[Activepieces Setup Options][${requestId}] ${stage}:start`);
      try {
        const result = await withTimeout(operation(), timeoutMs, `${stage} timed out`);
        const durationMs = Date.now() - stageStartedAt;
        timings.push({ stage, durationMs, status: 'ok' });
        console.info(`[Activepieces Setup Options][${requestId}] ${stage}:ok ${durationMs}ms`);
        return result;
      } catch (error) {
        const durationMs = Date.now() - stageStartedAt;
        timings.push({ stage, durationMs, status: 'error' });
        error.stage = error.stage || stage;
        console.error(`[Activepieces Setup Options][${requestId}] ${stage}:error ${durationMs}ms`, error.message);
        throw error;
      }
    },
  };
}

async function withTimeout(promise, timeoutMs, message) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(message);
          error.status = 504;
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function getAutomationOrThrow(supabase, automationId) {
  const { data, error } = await supabase
    .from('automations')
    .select('id, name, workflow, required_inputs, required_connectors, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
    .eq('id', automationId)
    .single();

  if (error || !data) {
    const notFound = new Error('Automation not found');
    notFound.status = 404;
    throw notFound;
  }

  if (!data.activepieces_source_flow_id) {
    const invalid = new Error('Automation is not powered by ModelGrow Builder');
    invalid.status = 400;
    throw invalid;
  }

  return data;
}

function parseSetupInputsPayload(inputs) {
  if (Array.isArray(inputs)) return inputs;
  if (typeof inputs !== 'string') return [];

  try {
    const parsed = JSON.parse(inputs);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return inputs
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }
}

function findRuntimeConnection(requirements, field) {
  const exactMatch = requirements.find((requirement) =>
    requirement.stepName === field.stepName &&
    requirement.pieceName === field.pieceName
  );
  if (exactMatch) return exactMatch;

  const pieceMatches = requirements.filter((requirement) => requirement.pieceName === field.pieceName);
  if (pieceMatches.length <= 1) return pieceMatches[0] || null;

  const ambiguous = new Error(`Multiple ${field.pieceSlug || field.pieceName} connections are available for this workflow step`);
  ambiguous.status = 409;
  throw ambiguous;
}

function collectSteps(step, steps = []) {
  if (!step || typeof step !== 'object') return steps;
  if (step.settings || step.pieceName) steps.push(step);
  if (step.nextAction) collectSteps(step.nextAction, steps);
  if (Array.isArray(step.branches)) step.branches.forEach((branch) => collectSteps(branch, steps));
  if (Array.isArray(step.children)) {
    step.children.forEach((child) => collectSteps(child, steps));
  } else if (step.children && typeof step.children === 'object') {
    Object.values(step.children).forEach((child) => collectSteps(child, steps));
  }
  return steps;
}

function getRuntimeStepInput(runtimeFlow, stepName) {
  if (!stepName) return {};
  const trigger = getFirstFlowTriggerFromTemplate(runtimeFlow);
  const step = collectSteps(trigger).find((candidate) => candidate?.name === stepName);
  return step?.settings?.input && typeof step.settings.input === 'object'
    ? step.settings.input
    : {};
}

function getMissingDependencies({ requiredInputs, field, currentConfig }) {
  const sameStepFields = normalizeSetupInputs(requiredInputs).filter((input) => input.stepName === field.stepName);
  const byPropName = new Map(sameStepFields.map((input) => [getInputPropName(input), input]));
  const normalizedConfig = normalizeConfigKeys(currentConfig);

  return (field.refreshers || field.dependsOn || [])
    .map((propName) => byPropName.get(propName))
    .filter(Boolean)
    .filter((dependency) => {
      const value = normalizedConfig[dependency.fieldKey || getInputKey(dependency)];
      return value === undefined || value === null || value === '';
    })
    .map((dependency) => ({
      fieldKey: dependency.fieldKey || getInputKey(dependency),
      label: dependency.label || dependency.name,
      propName: dependency.propName,
    }));
}

export async function POST(request) {
  const trace = createRequestTrace(request.headers.get('X-ModelGrow-Request-Id'));
  const contentLength = request.headers.get('content-length');
  const clientAutomationId = request.headers.get('X-ModelGrow-Automation-Id') || '';
  const clientFieldKey = request.headers.get('X-ModelGrow-Field-Key') || '';
  console.info(`[Activepieces Setup Options][${trace.requestId}] request:received`, {
    contentLength,
    clientAutomationId,
    clientFieldKey,
  });

  let body;
  let rawBody = '';
  try {
    rawBody = await request.text();
    body = JSON.parse(rawBody);
  } catch (parseError) {
    console.error(`[Activepieces Setup Options][${trace.requestId}] request:invalid_json`, {
      contentLength,
      receivedLength: rawBody.length,
      message: parseError.message,
    });
    return NextResponse.json({
      error: 'Setup options request body could not be read',
      requestId: trace.requestId,
      stage: 'request_parsing',
      details: parseError.message,
    }, {
      status: 400,
      headers: { 'X-ModelGrow-Request-Id': trace.requestId },
    });
  }

  try {
    const authUser = await trace.run(
      'authentication',
      8000,
      () => getSupabaseUser(),
    );
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isActivepiecesConfigured()) {
      return NextResponse.json({ error: 'ModelGrow Builder is not configured' }, { status: 500 });
    }

    const automationId = String(body?.automationId || body?.automation_id || '').trim();
    const fieldKey = String(body?.fieldKey || body?.field_name || '').trim().toUpperCase();
    const currentConfig = body?.currentConfig && typeof body.currentConfig === 'object' ? body.currentConfig : {};
    const searchValue = body?.searchValue ? String(body.searchValue) : undefined;

    console.info(`[Activepieces Setup Options][${trace.requestId}] request:parsed`, {
      automationId,
      fieldKey,
      hasSearchValue: Boolean(searchValue),
      configFieldCount: Object.keys(currentConfig).length,
    });

    if (!automationId || !fieldKey) {
      return NextResponse.json({ error: 'automationId and fieldKey are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const [user, automation] = await Promise.all([
      trace.run(
        'user_lookup',
        8000,
        () => userDB.upsertUser({
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email,
        }),
      ),
      trace.run(
        'automation_lookup',
        8000,
        () => getAutomationOrThrow(supabase, automationId),
      ),
    ]);
    const requiredInputs = normalizeSetupInputs(parseSetupInputsPayload(automation.required_inputs));
    const setupInputs = normalizeSetupInputs([
      ...requiredInputs,
      ...getCustomerTunablesFromWorkflow(automation.workflow),
    ]);
    const field = setupInputs.find((input) => (input.fieldKey || getInputKey(input)) === fieldKey);

    if (!field || field.source !== 'activepieces' || !field.pieceName || !field.propName) {
      return NextResponse.json({ error: 'Field is not resolvable through ModelGrow Builder' }, { status: 400 });
    }

    const missingDependencies = getMissingDependencies({ requiredInputs: setupInputs, field, currentConfig });
    if (missingDependencies.length > 0) {
      return NextResponse.json({
        disabled: true,
        reason: 'missing_dependencies',
        missingDependencies,
        options: [],
      });
    }

    const status = await listRuntimeConnectionStatus({
      supabase,
      user,
      automation,
      runStage: trace.run.bind(trace),
    });
    const runtimeConnection = findRuntimeConnection(status.requirements, field);
    if (runtimeConnection && !runtimeConnection.connected) {
      return NextResponse.json({
        disabled: true,
        reason: 'missing_connection',
        connection: runtimeConnection,
        options: [],
      });
    }

    const [runtimeFlow, pieceMetadata] = await Promise.all([
      trace.run('runtime_flow_lookup', 12000, () => getFlow({
          token: status.token,
          projectId: status.projectId,
          flowId: status.runtimeFlow.activepieces_flow_id,
        })),
      trace.run('piece_metadata_lookup', 12000, () => getPieceMetadata({
          token: status.token,
          projectId: status.projectId,
          pieceName: field.pieceName,
        })),
    ]);
    const flowVersionId = runtimeFlow?.version?.id || runtimeFlow?.versionId || runtimeFlow?.publishedVersionId;
    if (!flowVersionId) {
      return NextResponse.json({ error: 'Runtime workflow version is not available yet' }, { status: 400 });
    }

    const actionOrTriggerName = field.componentName || field.actionName || field.triggerName;
    if (!actionOrTriggerName) {
      return NextResponse.json({ error: 'Field action or trigger name is missing' }, { status: 400 });
    }

    const baseInput = getRuntimeStepInput(runtimeFlow, field.stepName);
    const input = buildActivepiecesInputForResolver(setupInputs, currentConfig, field, baseInput);
    if (runtimeConnection?.externalId) {
      input.auth = `{{connections['${runtimeConnection.externalId}']}}`;
    }

    const response = await trace.run('activepieces_option_resolution', 15000, () => resolvePieceOptions({
        token: status.token,
        projectId: status.projectId,
        flowId: status.runtimeFlow.activepieces_flow_id,
        flowVersionId,
        pieceName: field.pieceName,
        pieceVersion: field.pieceVersion || runtimeConnection?.pieceVersion || pieceMetadata.version,
        actionOrTriggerName,
        propertyName: field.propName,
        input,
        searchValue,
      }));
    const normalizedOptions = normalizeActivepiecesOptionsResponse(response);

    console.info(`[Activepieces Setup Options][${trace.requestId}] request:complete ${trace.durationMs}ms`, {
      fieldKey,
      timings: trace.timings,
      optionCount: normalizedOptions.options.length,
      dynamicFieldCount: normalizedOptions.dynamicFields.length,
      disabled: normalizedOptions.disabled,
    });
    return NextResponse.json({
      success: true,
      requestId: trace.requestId,
      timings: trace.timings,
      fieldKey,
      propertyName: field.propName,
      ...normalizedOptions,
    }, {
      headers: { 'X-ModelGrow-Request-Id': trace.requestId },
    });
  } catch (error) {
    console.error(`[Activepieces Setup Options][${trace.requestId}] Failed at ${error.stage || trace.activeStage}:`, error);
    return NextResponse.json({
      error: error.message || 'Failed to resolve setup options',
      requestId: trace.requestId,
      stage: error.stage || trace.activeStage,
      durationMs: trace.durationMs,
      timings: trace.timings,
      details: error.data || null,
    }, {
      status: error.status || 500,
      headers: { 'X-ModelGrow-Request-Id': trace.requestId },
    });
  }
}
