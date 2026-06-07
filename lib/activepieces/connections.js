import {
  getFirstFlowTriggerFromTemplate,
  getFlowTemplate,
  getOAuth2AuthorizationUrl,
  getPieceMetadata,
  listAppConnections,
  upsertAppConnection,
} from './client.js';
import {
  ensureRuntimeFlowForAutomation,
  getActivepiecesAuthForModelGrowUser,
} from './provisioning.js';

const CLOUD_OAUTH_REDIRECT_URL = 'https://secrets.activepieces.com/redirect';
const CLOUD_OAUTH_APPS_URL = 'https://secrets.activepieces.com/apps?edition=COMMUNITY';
const CONNECTION_REF_REGEX = /\{\{\s*connections\[['"]([^'"]+)['"]\]\s*\}\}/g;

function getPieceSlug(pieceName) {
  return String(pieceName || '')
    .replace(/^@activepieces\/piece-/, '')
    .replace(/^piece-/, '')
    .trim()
    .toLowerCase();
}

function humanizePiece(pieceName) {
  const slug = getPieceSlug(pieceName);
  if (!slug) return 'Connection';
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractConnectionIds(value, ids = new Set()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(CONNECTION_REF_REGEX)) {
      ids.add(match[1]);
    }
    return ids;
  }

  if (Array.isArray(value)) {
    for (const item of value) extractConnectionIds(item, ids);
    return ids;
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) extractConnectionIds(nested, ids);
  }

  return ids;
}

function collectConnectionRequirementsFromStep(step, requirements = new Map()) {
  if (!step || typeof step !== 'object') return requirements;

  const pieceName = step.settings?.pieceName || step.pieceName || null;
  const input = step.settings?.input || {};
  const connectionIds = Array.from(extractConnectionIds(input));

  for (const externalId of connectionIds) {
    if (!requirements.has(externalId)) {
      requirements.set(externalId, {
        externalId,
        pieceName,
        pieceVersion: step.settings?.pieceVersion || null,
        displayName: humanizePiece(pieceName),
        stepName: step.name || null,
        stepDisplayName: step.displayName || null,
        actionName: step.settings?.actionName || step.settings?.triggerName || null,
      });
    }
  }

  if (step.nextAction) collectConnectionRequirementsFromStep(step.nextAction, requirements);
  if (Array.isArray(step.branches)) {
    for (const branch of step.branches) collectConnectionRequirementsFromStep(branch, requirements);
  }
  if (Array.isArray(step.children)) {
    for (const child of step.children) collectConnectionRequirementsFromStep(child, requirements);
  } else if (step.children && typeof step.children === 'object') {
    for (const child of Object.values(step.children)) collectConnectionRequirementsFromStep(child, requirements);
  }

  return requirements;
}

function normalizeAppConnections(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function isUsableAppConnection(connection) {
  return Boolean(connection && String(connection.status || '').toUpperCase() === 'ACTIVE');
}

async function fetchCloudOAuthApps() {
  const response = await fetch(CLOUD_OAUTH_APPS_URL, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error('Failed to load Activepieces cloud OAuth apps');
  }

  return response.json();
}

function getAuthOptions(pieceMetadata) {
  if (!pieceMetadata?.auth) return [];
  return Array.isArray(pieceMetadata.auth) ? pieceMetadata.auth : [pieceMetadata.auth];
}

function getPrimaryAuthOption(pieceMetadata) {
  const authOptions = getAuthOptions(pieceMetadata);
  return authOptions.find((auth) => auth.type === 'OAUTH2') || authOptions[0] || null;
}

function summarizeAuthOption(authOption, cloudOAuthApp) {
  if (!authOption) {
    return { mode: 'no_auth', label: 'No auth required' };
  }

  if (authOption.type === 'OAUTH2' && cloudOAuthApp?.clientId) {
    return { mode: 'oauth', label: 'OAuth' };
  }

  if (authOption.type === 'SECRET_TEXT') {
    return { mode: 'manual', label: authOption.displayName || 'API key', fields: [{ name: 'secret_text', label: authOption.displayName || 'API key', type: 'password' }] };
  }

  if (authOption.type === 'BASIC_AUTH') {
    return {
      mode: 'manual',
      label: 'Username and password',
      fields: [
        { name: 'username', label: 'Username', type: 'text' },
        { name: 'password', label: 'Password', type: 'password' },
      ],
    };
  }

  if (authOption.type === 'CUSTOM_AUTH') {
    const fields = Object.entries(authOption.props || {}).map(([name, prop]) => ({
      name,
      label: prop?.displayName || name,
      type: prop?.type === 'SECRET_TEXT' ? 'password' : 'text',
      required: prop?.required !== false,
    }));
    return { mode: 'manual', label: authOption.displayName || 'Custom auth', fields };
  }

  return { mode: 'unsupported', label: authOption.type || 'Unsupported auth' };
}

export async function getRuntimeConnectionRequirements({ token, projectId, flowId }) {
  const template = await getFlowTemplate({ token, projectId, flowId });
  const trigger = getFirstFlowTriggerFromTemplate(template);
  const requirements = Array.from(collectConnectionRequirementsFromStep(trigger).values());

  return {
    template,
    trigger,
    requirements,
  };
}

export async function getActivepiecesConnectionContext({ supabase, user, automation }) {
  const { link, runtimeFlow } = await ensureRuntimeFlowForAutomation({ supabase, user, automation });
  const { authResponse } = await getActivepiecesAuthForModelGrowUser({ supabase, user });
  const projectId = runtimeFlow.activepieces_project_id || link.activepieces_project_id;

  return {
    link,
    runtimeFlow,
    authResponse,
    projectId,
    token: authResponse.token,
  };
}

export async function listRuntimeConnectionStatus({ supabase, user, automation }) {
  const context = await getActivepiecesConnectionContext({ supabase, user, automation });
  const { requirements } = await getRuntimeConnectionRequirements({
    token: context.token,
    projectId: context.projectId,
    flowId: context.runtimeFlow.activepieces_flow_id,
  });
  const existingConnections = normalizeAppConnections(await listAppConnections({
    token: context.token,
    projectId: context.projectId,
    limit: 100,
  }));
  const byExternalId = new Map(existingConnections.map((connection) => [connection.externalId, connection]));

  return {
    ...context,
    requirements: requirements.map((requirement) => {
      const existingConnection = byExternalId.get(requirement.externalId);

      return {
        ...requirement,
        connected: isUsableAppConnection(existingConnection),
        status: existingConnection?.status || 'missing',
        existingConnectionId: existingConnection?.id || null,
      };
    }),
  };
}

export async function prepareActivepiecesConnectionStart({ supabase, user, automation, externalId = null }) {
  const status = await listRuntimeConnectionStatus({ supabase, user, automation });
  const target = externalId
    ? status.requirements.find((requirement) => requirement.externalId === externalId)
    : status.requirements.find((requirement) => !requirement.connected) || status.requirements[0];

  if (!target) {
    return {
      type: 'complete',
      message: 'All required connections are already connected.',
      requirements: status.requirements,
    };
  }

  const pieceMetadata = await getPieceMetadata({
    token: status.token,
    pieceName: target.pieceName,
    projectId: status.projectId,
  });
  const cloudOAuthApps = await fetchCloudOAuthApps();
  const cloudOAuthApp = cloudOAuthApps[target.pieceName]?.cloudOAuth2App || cloudOAuthApps[target.pieceName] || null;
  const authOption = getPrimaryAuthOption(pieceMetadata);
  const authSummary = summarizeAuthOption(authOption, cloudOAuthApp);

  const basePayload = {
    externalId: target.externalId,
    pieceName: target.pieceName,
    pieceVersion: target.pieceVersion || pieceMetadata.version,
    displayName: target.displayName,
    projectId: status.projectId,
    runtimeFlowId: status.runtimeFlow.activepieces_flow_id,
    requirements: status.requirements,
    auth: authSummary,
  };

  if (authSummary.mode !== 'oauth') {
    return {
      type: authSummary.mode,
      ...basePayload,
    };
  }

  const scopes = Array.isArray(authOption.scope) ? authOption.scope : [];
  const props = {};
  const authorization = await getOAuth2AuthorizationUrl({
    token: status.token,
    pieceName: target.pieceName,
    pieceVersion: target.pieceVersion || pieceMetadata.version,
    projectId: status.projectId,
    clientId: cloudOAuthApp.clientId,
    redirectUrl: CLOUD_OAUTH_REDIRECT_URL,
    scopes,
    props,
  });
  const authorizationMethod = authOption.authorizationMethod || null;

  return {
    type: 'oauth',
    ...basePayload,
    authorizationUrl: authorization.authorizationUrl,
    redirectUrl: CLOUD_OAUTH_REDIRECT_URL,
    codeVerifier: authorization.codeVerifier || null,
    clientId: cloudOAuthApp.clientId,
    scope: scopes.join(' '),
    authorizationMethod,
    props,
  };
}

export async function completeActivepiecesOAuthConnection({ supabase, user, automation, externalId, pieceName, pieceVersion, clientId, code, codeVerifier, scope, authorizationMethod = null, props = {} }) {
  const status = await listRuntimeConnectionStatus({ supabase, user, automation });
  const target = status.requirements.find((requirement) => requirement.externalId === externalId && requirement.pieceName === pieceName);

  if (!target) {
    throw new Error('Connection does not belong to this automation runtime flow');
  }

  const connection = await upsertAppConnection({
    token: status.token,
    connection: {
      externalId,
      displayName: target.displayName,
      pieceName,
      pieceVersion: pieceVersion || target.pieceVersion,
      projectId: status.projectId,
      type: 'CLOUD_OAUTH2',
      value: {
        type: 'CLOUD_OAUTH2',
        client_id: clientId,
        code,
        code_challenge: codeVerifier || undefined,
        scope: scope || '',
        authorization_method: authorizationMethod || undefined,
        props,
      },
    },
  });

  return {
    connection,
    status: await listRuntimeConnectionStatus({ supabase, user, automation }),
  };
}

export async function completeActivepiecesManualConnection({ supabase, user, automation, externalId, pieceName, pieceVersion, values = {} }) {
  const status = await listRuntimeConnectionStatus({ supabase, user, automation });
  const target = status.requirements.find((requirement) => requirement.externalId === externalId && requirement.pieceName === pieceName);

  if (!target) {
    throw new Error('Connection does not belong to this automation runtime flow');
  }

  const pieceMetadata = await getPieceMetadata({
    token: status.token,
    pieceName: target.pieceName,
    projectId: status.projectId,
  });
  const authOption = getPrimaryAuthOption(pieceMetadata);
  const authSummary = summarizeAuthOption(authOption, null);

  let type = authOption?.type || 'NO_AUTH';
  let value = { type };

  if (authSummary.mode === 'manual') {
    if (type === 'SECRET_TEXT') {
      if (!values.secret_text) throw new Error(`${authSummary.fields?.[0]?.label || 'API key'} is required`);
      value = { type, secret_text: values.secret_text };
    } else if (type === 'BASIC_AUTH') {
      if (!values.username || !values.password) throw new Error('Username and password are required');
      value = { type, username: values.username, password: values.password };
    } else if (type === 'CUSTOM_AUTH') {
      const props = {};
      for (const field of authSummary.fields || []) {
        if (field.required && !values[field.name]) {
          throw new Error(`${field.label || field.name} is required`);
        }
        if (values[field.name] !== undefined) props[field.name] = values[field.name];
      }
      value = { type, props };
    }
  } else if (authSummary.mode === 'no_auth') {
    type = 'NO_AUTH';
    value = { type };
  } else {
    throw new Error(`Manual connection is not supported for ${target.displayName}`);
  }

  const connection = await upsertAppConnection({
    token: status.token,
    connection: {
      externalId,
      displayName: target.displayName,
      pieceName,
      pieceVersion: pieceVersion || target.pieceVersion || pieceMetadata.version,
      projectId: status.projectId,
      type,
      value,
    },
  });

  return {
    connection,
    status: await listRuntimeConnectionStatus({ supabase, user, automation }),
  };
}
