const DEFAULT_RUNTIME_URL = 'http://localhost:3001';

function runtimeUrl() {
  return String(process.env.NATIVE_N8N_RUNTIME_URL || DEFAULT_RUNTIME_URL).replace(/\/$/, '');
}

function runtimeHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.NATIVE_N8N_RUNTIME_SHARED_SECRET) {
    headers.Authorization = `Bearer ${process.env.NATIVE_N8N_RUNTIME_SHARED_SECRET}`;
  }
  return headers;
}

export async function callNativeAutomationRuntime(path, body, { timeoutMs = 60_000 } = {}) {
  const response = await fetch(`${runtimeUrl()}${path}`, {
    method: 'POST',
    headers: runtimeHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { error: (await response.text()).slice(0, 500) || `Runtime returned HTTP ${response.status}` };

  if (!response.ok || data?.success === false) {
    const error = new Error(data?.error || data?.message || `Native n8n runtime failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code || 'NATIVE_N8N_RUNTIME_ERROR';
    error.data = data;
    throw error;
  }

  return data;
}

export function runNativeAutomation({ automationId, userId, config }) {
  return callNativeAutomationRuntime('/api/automations/run', {
    automation_id: automationId,
    user_id: userId,
    config,
  });
}

export function activateNativeAutomation({ automationId, userId, config }) {
  return callNativeAutomationRuntime('/api/automations/activate', {
    automation_id: automationId,
    user_id: userId,
    config,
  });
}

export function deactivateNativeAutomation({ automationId, userId }) {
  return callNativeAutomationRuntime('/api/automations/deactivate', {
    automation_id: automationId,
    user_id: userId,
  });
}

export function queueNativeAutomation({ automationId, userId, config, delay }) {
  return callNativeAutomationRuntime('/queue', {
    automation_id: automationId,
    user_id: userId,
    config,
    delay,
  });
}

export function scheduleNativeAutomation({ automationId, userId, config, cronExpression, maxRuns }) {
  return callNativeAutomationRuntime('/schedule', {
    automation_id: automationId,
    user_id: userId,
    config,
    cronExpression,
    maxRuns,
  });
}
