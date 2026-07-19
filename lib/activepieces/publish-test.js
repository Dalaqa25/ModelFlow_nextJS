import crypto from 'crypto';
const TOKEN_TTL_MS = 30 * 60 * 1000;

function getSecret() {
  return process.env.ACTIVEPIECES_PUBLISH_TEST_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'modelgrow-dev-publish-test-secret';
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(stableStringify(payload))
    .digest('base64url');
}

function getFlowVersionFingerprint(flow) {
  return String(
    flow?.publishedVersionId ||
    flow?.version?.id ||
    flow?.versionId ||
    flow?.updated ||
    flow?.updatedAt ||
    flow?.id ||
    ''
  );
}

function encodeToken(payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${signPayload(payload)}`;
}

export function createPublishTestToken({ userEmail, projectId, flow, run }) {
  const payload = {
    type: 'activepieces_publish_test',
    userEmail,
    projectId,
    flowId: flow.id,
    flowVersion: getFlowVersionFingerprint(flow),
    runId: run?.id || null,
    runStatus: run?.status || null,
    status: 'passed',
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };

  return encodeToken(payload);
}

export function verifyPublishTestToken({ token, userEmail, projectId, flow }) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false, reason: 'missing_publish_test' };
  }

  const [body, signature] = token.split('.');
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch (_) {
    return { valid: false, reason: 'invalid_publish_test_token' };
  }

  const expectedSignature = signPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { valid: false, reason: 'invalid_publish_test_signature' };
  }

  const expected = {
    type: 'activepieces_publish_test',
    userEmail,
    projectId,
    flowId: flow.id,
    flowVersion: getFlowVersionFingerprint(flow),
    status: 'passed',
  };

  for (const [key, value] of Object.entries(expected)) {
    if (payload[key] !== value) {
      return { valid: false, reason: `publish_test_${key}_mismatch` };
    }
  }

  if (!payload.expiresAt || Date.now() > payload.expiresAt) {
    return { valid: false, reason: 'publish_test_expired' };
  }

  return { valid: true, payload };
}

export function buildPublishTestResult({ flow, contract, template }) {
  return buildRuntimePublishTestResult({ flow, contract, template });
}

const TERMINAL_RUN_STATUSES = new Set([
  'SUCCEEDED',
  'FAILED',
  'INTERNAL_ERROR',
  'TIMEOUT',
  'STOPPED',
]);

const SUCCESS_RUN_STATUSES = new Set(['SUCCEEDED']);

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizePublishTestRun(run) {
  if (!run) return null;

  const status = String(run.status || 'UNKNOWN').toUpperCase();
  return {
    id: run.id || null,
    status,
    success: SUCCESS_RUN_STATUSES.has(status),
    terminal: TERMINAL_RUN_STATUSES.has(status),
    flowId: run.flowId || run.flow_id || null,
    flowVersionId: run.flowVersionId || run.flow_version_id || null,
    createdAt: normalizeDate(run.created || run.createdAt || run.startTime || run.startedAt),
    updatedAt: normalizeDate(run.updated || run.updatedAt || run.finishTime || run.finishedAt),
    durationMs: typeof run.duration === 'number'
      ? run.duration
      : typeof run.durationMs === 'number'
        ? run.durationMs
        : null,
  };
}

export function getLatestTerminalPublishTestRun(runsResponse) {
  const runs = Array.isArray(runsResponse?.data)
    ? runsResponse.data
    : Array.isArray(runsResponse)
      ? runsResponse
      : [];

  return runs
    .map(normalizePublishTestRun)
    .filter(Boolean)
    .find((run) => run.terminal) || null;
}

export function getLatestSuccessfulPublishTestRun(runsResponse) {
  const runs = Array.isArray(runsResponse?.data)
    ? runsResponse.data
    : Array.isArray(runsResponse)
      ? runsResponse
      : [];

  return runs
    .map(normalizePublishTestRun)
    .filter(Boolean)
    .find((run) => run.success) || null;
}

export function buildRuntimePublishTestResult({
  flow,
  contract,
  latestRun = null,
  requireRuntimeRun = false,
}) {
  const issues = [];
  const unresolved = Array.isArray(contract?.unresolved) ? contract.unresolved : [];
  const normalizedRun = normalizePublishTestRun(latestRun);

  for (const item of unresolved) {
    issues.push({
      type: item.type || 'unresolved_requirement',
      severity: 'error',
      stepName: item.stepName || null,
      fieldKey: item.fieldKey || null,
      message: item.message || 'ModelGrow could not classify part of this workflow.',
      fix: 'Fix this field in ModelGrow Builder, then run the publish test again.',
      raw: item,
    });
  }

  if (requireRuntimeRun) {
    if (!normalizedRun) {
      issues.push({
        type: 'missing_runtime_test_run',
        severity: 'error',
        message: 'No completed test run was found for this builder flow.',
        fix: 'Run the workflow from the ModelGrow Builder test button, wait until it finishes, then verify again before publishing.',
      });
    } else if (!normalizedRun.success) {
      issues.push({
        type: 'runtime_test_run_failed',
        severity: 'error',
        message: `The latest completed builder run ended with ${normalizedRun.status}.`,
        fix: 'Open the failed run in ModelGrow Builder, fix the failing node, run the workflow again, then verify again.',
        run: normalizedRun,
      });
    }
  }

  const hasErrors = issues.some((issue) => issue.severity === 'error');
  const runtimeRunPassed = Boolean(normalizedRun?.success);

  return {
    status: hasErrors ? 'failed' : 'passed',
    testedAt: new Date().toISOString(),
    flowId: flow?.id || null,
    flowVersion: getFlowVersionFingerprint(flow),
    latestRun: normalizedRun,
    summary: {
      checks: [
        { key: 'builder_flow_published', passed: Boolean(flow?.publishedVersionId), label: 'Builder flow is published' },
        { key: 'setup_contract_resolved', passed: unresolved.length === 0, label: 'Setup requirements are classified' },
        ...(requireRuntimeRun
          ? [{ key: 'latest_runtime_run_succeeded', passed: runtimeRunPassed, label: 'Latest builder test run succeeded' }]
          : []),
      ],
      accountRequirements: contract?.customerConnections?.length || 0,
      customerInputs: contract?.customerInputs?.length || 0,
      optionalTunables: contract?.customerTunables?.length || 0,
      warningCount: 0,
    },
    issues,
  };
}
