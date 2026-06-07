const DEFAULT_TIMEOUT_MS = 15000;
const API_PREFIX = '/api/v1';

function getBaseUrl() {
  const raw = process.env.ACTIVEPIECES_BASE_URL ||
    process.env.ACTIVEPIECES_API_URL ||
    process.env.ACTIVEPIECES_MCP_URL;

  if (!raw) {
    throw new Error('ACTIVEPIECES_BASE_URL or ACTIVEPIECES_MCP_URL is not configured');
  }

  return new URL(raw).origin.replace(/\/$/, '');
}

function getOwnerCredentials() {
  const email = process.env.ACTIVEPIECES_OWNER_EMAIL || process.env.ACTIVEPIECES_ADMIN_EMAIL;
  const password = process.env.ACTIVEPIECES_OWNER_PASSWORD || process.env.ACTIVEPIECES_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ACTIVEPIECES_OWNER_EMAIL and ACTIVEPIECES_OWNER_PASSWORD are required');
  }

  return { email, password };
}

async function activepiecesRequest(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }

    if (!response.ok) {
      const message = data?.code || data?.message || data?.error || `Activepieces request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function isActivepiecesConfigured() {
  return Boolean(
    (process.env.ACTIVEPIECES_BASE_URL || process.env.ACTIVEPIECES_API_URL || process.env.ACTIVEPIECES_MCP_URL) &&
    (process.env.ACTIVEPIECES_OWNER_EMAIL || process.env.ACTIVEPIECES_ADMIN_EMAIL) &&
    (process.env.ACTIVEPIECES_OWNER_PASSWORD || process.env.ACTIVEPIECES_ADMIN_PASSWORD)
  );
}

export function getActivepiecesBaseUrl() {
  return getBaseUrl();
}

export async function healthCheck() {
  return activepiecesRequest(`${API_PREFIX}/health`);
}

export async function signInActivepiecesUser({ email, password }) {
  return activepiecesRequest(`${API_PREFIX}/authentication/sign-in`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signUpActivepiecesUser({ email, password, firstName, lastName }) {
  return activepiecesRequest(`${API_PREFIX}/authentication/sign-up`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      trackEvents: false,
      newsLetter: false,
    }),
  });
}

export async function adminSignIn() {
  return signInActivepiecesUser(getOwnerCredentials());
}

export async function invitePlatformMember({ adminToken, email }) {
  return activepiecesRequest(`${API_PREFIX}/user-invitations`, {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      type: 'PLATFORM',
      email,
      platformRole: 'MEMBER',
    }),
  });
}

export async function acceptInvitation({ invitationToken }) {
  return activepiecesRequest(`${API_PREFIX}/user-invitations/accept`, {
    method: 'POST',
    body: JSON.stringify({ invitationToken }),
  });
}

export function extractInvitationToken(invitation) {
  if (!invitation?.link) return null;
  return new URL(invitation.link).searchParams.get('token');
}

export async function listProjects({ token, limit = 50 } = {}) {
  return activepiecesRequest(`${API_PREFIX}/projects?limit=${encodeURIComponent(limit)}`, { token });
}

export async function listUsers({ token, limit = 100 } = {}) {
  return activepiecesRequest(`${API_PREFIX}/users?limit=${encodeURIComponent(limit)}`, { token });
}

export async function listFlows({ token, projectId, limit = 50 } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (projectId) params.set('projectId', projectId);

  return activepiecesRequest(`${API_PREFIX}/flows?${params.toString()}`, { token });
}

export async function createFlow({ token, displayName, projectId, metadata }) {
  return activepiecesRequest(`${API_PREFIX}/flows`, {
    method: 'POST',
    token,
    body: JSON.stringify({ displayName, projectId, metadata }),
  });
}

export async function getFlow({ token, flowId, projectId }) {
  return activepiecesRequest(`${API_PREFIX}/flows/${encodeURIComponent(flowId)}?projectId=${encodeURIComponent(projectId)}`, { token });
}

export async function getFlowTemplate({ token, flowId, projectId }) {
  return activepiecesRequest(`${API_PREFIX}/flows/${encodeURIComponent(flowId)}/template?projectId=${encodeURIComponent(projectId)}`, { token });
}

export async function applyFlowOperation({ token, flowId, operation }) {
  return activepiecesRequest(`${API_PREFIX}/flows/${encodeURIComponent(flowId)}`, {
    method: 'POST',
    token,
    body: JSON.stringify(operation),
  });
}

export async function importFlowTemplate({ token, flowId, displayName, trigger, schemaVersion = '20', notes = [] }) {
  return applyFlowOperation({
    token,
    flowId,
    operation: {
      type: 'IMPORT_FLOW',
      request: {
        displayName,
        schemaVersion,
        notes,
        trigger,
      },
    },
  });
}

export async function publishFlow({ token, flowId, status = 'ENABLED' }) {
  return applyFlowOperation({
    token,
    flowId,
    operation: {
      type: 'LOCK_AND_PUBLISH',
      request: { status },
    },
  });
}

export async function triggerWebhookFlow({ flowId, payload }) {
  return activepiecesRequest(`${API_PREFIX}/webhooks/${encodeURIComponent(flowId)}`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
    timeoutMs: 30000,
  });
}

export async function listFlowRuns({ token, projectId, flowId, limit = 20 }) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (projectId) params.set('projectId', projectId);
  if (flowId) params.set('flowId', flowId);

  return activepiecesRequest(`${API_PREFIX}/flow-runs?${params.toString()}`, { token });
}

export async function getPieceMetadata({ token, pieceName, projectId }) {
  return activepiecesRequest(
    `${API_PREFIX}/pieces/${encodeURIComponent(pieceName)}?projectId=${encodeURIComponent(projectId)}`,
    { token }
  );
}

export async function listAppConnections({ token, projectId, limit = 100 } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (projectId) params.set('projectId', projectId);

  return activepiecesRequest(`${API_PREFIX}/app-connections?${params.toString()}`, { token });
}

export async function getOAuth2AuthorizationUrl({ token, pieceName, pieceVersion, projectId, clientId, redirectUrl, scopes = [], props = {} }) {
  return activepiecesRequest(`${API_PREFIX}/app-connections/oauth2/authorization-url`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      pieceName,
      pieceVersion,
      projectId,
      clientId,
      redirectUrl,
      scopes,
      props,
    }),
  });
}

export async function upsertAppConnection({ token, connection }) {
  return activepiecesRequest(`${API_PREFIX}/app-connections`, {
    method: 'POST',
    token,
    body: JSON.stringify(connection),
  });
}

export function getFirstFlowTriggerFromTemplate(template) {
  const flow = Array.isArray(template?.flows) ? template.flows[0] : null;
  return flow?.trigger || flow?.version?.trigger || template?.trigger || template?.template?.trigger || null;
}
