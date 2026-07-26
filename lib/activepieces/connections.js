import crypto from 'crypto';
import {
  adminSignIn,
  getFirstFlowTriggerFromTemplate,
  getFlowTemplate,
  getActivepiecesBaseUrl,
  getOAuth2AuthorizationUrl,
  getPieceMetadata,
  listAppConnections,
  upsertAppConnection,
} from './client.js';
import {
  ensureActivepiecesRuntimeConnectionProject,
  ensureRuntimeFlowForAutomation,
} from './provisioning.js';
import { detectImportedWorkflowCredentialRequirements } from '../credentials/workflow-requirements.js';
import {
  ensureOAuthAuthorizationUrlScopes,
  mergeOAuthScopes,
  requiredOAuthScopesForImportedRequirement,
} from '../credentials/oauth-scope-requirements.js';

const CLOUD_OAUTH_REDIRECT_URL = 'https://secrets.activepieces.com/redirect';
const CLOUD_OAUTH_APPS_URL = 'https://secrets.activepieces.com/apps?edition=COMMUNITY';
const MODELGROW_OAUTH_CALLBACK_PATH = '/api/activepieces/connections/oauth/callback';
const MODELGROW_OAUTH_STATE = 'modelgrow_activepieces_v1';
const CONNECTION_REF_REGEX = /\{\{\s*connections\[['"]([^'"]+)['"]\]\s*\}\}/g;
const RUNTIME_CONNECTION_REF_VERSION = 'shared-runtime-v1';

function getPieceSlug(pieceName) {
  return String(pieceName || '')
    .replace(/^@activepieces\/piece-/, '')
    .replace(/^piece-/, '')
    .trim()
    .toLowerCase();
}

function normalizeEnvKey(value) {
  return String(value || '')
    .replace(/^@activepieces\/piece-/, '')
    .replace(/^piece-/, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getModelGrowAppBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.MODELGROW_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';

  return new URL(raw).origin;
}

function getDefaultModelGrowOAuthRedirectUrl() {
  return new URL(MODELGROW_OAUTH_CALLBACK_PATH, getModelGrowAppBaseUrl()).toString();
}

function markModelGrowOAuthAuthorizationUrl(authorizationUrl) {
  const url = new URL(authorizationUrl);
  url.searchParams.set('state', MODELGROW_OAUTH_STATE);
  return url.toString();
}

function parseModelGrowOAuthAppsJson() {
  const raw = process.env.MODELGROW_OAUTH_APPS_JSON || process.env.ACTIVEPIECES_OAUTH_APPS_JSON;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn('[ModelGrow OAuth] Ignoring invalid MODELGROW_OAUTH_APPS_JSON:', error.message);
    return {};
  }
}

function normalizeModelGrowOAuthAppConfig(config) {
  if (!config || typeof config !== 'object') return null;
  const clientId = String(config.clientId || config.client_id || '').trim();
  const clientSecret = String(config.clientSecret || config.client_secret || '').trim();

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUrl: String(config.redirectUrl || config.redirect_url || getDefaultModelGrowOAuthRedirectUrl()).trim(),
  };
}

function getModelGrowOAuthAppFromJson(pieceName) {
  const apps = parseModelGrowOAuthAppsJson();
  const slug = getPieceSlug(pieceName);
  const candidates = [
    pieceName,
    slug,
    `piece-${slug}`,
    `@activepieces/piece-${slug}`,
    normalizeEnvKey(pieceName),
    normalizeEnvKey(slug),
  ].filter(Boolean);

  for (const key of candidates) {
    const config = normalizeModelGrowOAuthAppConfig(apps[key]);
    if (config) return config;
  }

  return null;
}

function getModelGrowOAuthAppFromEnv(pieceName) {
  const envKey = normalizeEnvKey(pieceName);
  if (!envKey) return null;

  return normalizeModelGrowOAuthAppConfig({
    clientId: process.env[`MODELGROW_OAUTH_${envKey}_CLIENT_ID`],
    clientSecret: process.env[`MODELGROW_OAUTH_${envKey}_CLIENT_SECRET`],
    redirectUrl: process.env[`MODELGROW_OAUTH_${envKey}_REDIRECT_URL`],
  });
}

function getModelGrowOAuthApp(pieceName) {
  return getModelGrowOAuthAppFromJson(pieceName) || getModelGrowOAuthAppFromEnv(pieceName);
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

function pieceNameFromConnector(connector) {
  const slug = getPieceSlug(connector);
  if (!slug || ['manual', 'webhook', 'schedule', 'trigger'].includes(slug)) return null;
  return connector?.startsWith?.('@activepieces/')
    ? connector
    : `@activepieces/piece-${slug}`;
}

function buildRuntimeConnectionExternalId({ user, automation, sourceProjectId, pieceName }) {
  const slug = getPieceSlug(pieceName);
  const digest = crypto
    .createHash('sha256')
    .update([
      user?.id || 'unknown-user',
      sourceProjectId || 'unknown-project',
      automation?.activepieces_source_flow_id || automation?.id || 'unknown-flow',
      pieceName || 'unknown-piece',
    ].join(':'))
    .digest('hex')
    .slice(0, 16);

  return `modelgrow-${digest}-${slug}`;
}

function buildImportedConnectionExternalId({ user, automation, credentialKey, pieceName }) {
  const slug = getPieceSlug(pieceName);
  const digest = crypto
    .createHash('sha256')
    .update([user?.id, automation?.id, credentialKey, pieceName].filter(Boolean).join(':'))
    .digest('hex')
    .slice(0, 16);
  return `modelgrow-import-${digest}-${slug}`;
}

function normalizeRequiredConnectors(connectors) {
  if (Array.isArray(connectors)) return connectors;
  if (typeof connectors === 'string') {
    try {
      const parsed = JSON.parse(connectors);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return connectors.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
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
    throw new Error('Failed to load OAuth connection apps');
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

function getConnectionOAuthScopes({ automation, target, authOption }) {
  const pieceScopes = Array.isArray(authOption?.scope) ? authOption.scope : [];
  if (automation?.activepieces_source_flow_id) return mergeOAuthScopes(pieceScopes);

  let workflow = automation?.workflow;
  if (typeof workflow === 'string') {
    try { workflow = JSON.parse(workflow); } catch { workflow = null; }
  }
  return mergeOAuthScopes(
    pieceScopes,
    requiredOAuthScopesForImportedRequirement(workflow, target),
  );
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

async function runConnectionStage(runStage, stage, operation) {
  return runStage ? runStage(stage, 12000, operation) : operation();
}

async function getExistingRuntimeContext({ supabase, user, automation }) {
  const [linkResult, runtimeFlowResult] = await Promise.all([
    supabase
      .from('activepieces_user_links')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('activepieces_runtime_flows')
      .select('*')
      .eq('user_id', user.id)
      .eq('automation_id', automation.id)
      .maybeSingle(),
  ]);

  if (linkResult.error) throw linkResult.error;
  if (runtimeFlowResult.error) throw runtimeFlowResult.error;

  const link = linkResult.data;
  const runtimeFlow = runtimeFlowResult.data;
  const runtimeProjectId = link?.activepieces_runtime_project_id;
  const activepiecesBaseUrl = getActivepiecesBaseUrl();
  const matchesCurrentInstance =
    link?.metadata?.activepieces_base_url === activepiecesBaseUrl ||
    runtimeFlow?.metadata?.activepieces_base_url === activepiecesBaseUrl;
  const runtimeIsReady = ['active', 'draft'].includes(runtimeFlow?.status) &&
    runtimeFlow?.activepieces_flow_id &&
    runtimeFlow?.metadata?.connection_ref_version === RUNTIME_CONNECTION_REF_VERSION &&
    (
      runtimeProjectId
        ? runtimeFlow?.activepieces_project_id === runtimeProjectId
        : Boolean(runtimeFlow?.activepieces_project_id)
    );

  return link?.status === 'ready' && matchesCurrentInstance && runtimeIsReady
    ? { link, runtimeFlow }
    : null;
}

export async function getActivepiecesConnectionContext({ supabase, user, automation, runStage = null }) {
  const existingContext = await runConnectionStage(
    runStage,
    'runtime_context_lookup',
    () => getExistingRuntimeContext({ supabase, user, automation }),
  );
  const contextPromise = existingContext
    ? Promise.resolve(existingContext)
    : runConnectionStage(
        runStage,
        'runtime_provisioning',
        () => ensureRuntimeFlowForAutomation({ supabase, user, automation }),
      );
  const authPromise = runConnectionStage(
      runStage,
      'activepieces_sign_in',
      () => adminSignIn(),
    );
  const [{ link, runtimeFlow }, authResponse] = await Promise.all([contextPromise, authPromise]);
  const projectId = runtimeFlow.activepieces_project_id || link.activepieces_project_id;

  return {
    link,
    runtimeFlow,
    authResponse,
    projectId,
    token: authResponse.token,
  };
}

export async function listRuntimeConnectionStatus({ supabase, user, automation, runStage = null }) {
  const context = await getActivepiecesConnectionContext({ supabase, user, automation, runStage });
  const [requirementsResult, connectionsResponse] = await Promise.all([
    runConnectionStage(
      runStage,
      'activepieces_flow_template',
      () => getRuntimeConnectionRequirements({
        token: context.token,
        projectId: context.projectId,
        flowId: context.runtimeFlow.activepieces_flow_id,
      }),
    ),
    runConnectionStage(
      runStage,
      'activepieces_connection_list',
      () => listAppConnections({
        token: context.token,
        projectId: context.projectId,
        limit: 100,
      }),
    ),
  ]);
  let { requirements } = requirementsResult;
  if (requirements.length === 0) {
    const sourceProjectId = context.runtimeFlow.activepieces_source_project_id || automation.activepieces_source_project_id;
    requirements = normalizeRequiredConnectors(automation.required_connectors)
      .map(pieceNameFromConnector)
      .filter(Boolean)
      .map((pieceName) => ({
        externalId: buildRuntimeConnectionExternalId({ user, automation, sourceProjectId, pieceName }),
        pieceName,
        pieceVersion: null,
        displayName: humanizePiece(pieceName),
        stepName: null,
        stepDisplayName: null,
        actionName: null,
      }));
  }
  const existingConnections = normalizeAppConnections(connectionsResponse);
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

async function listImportedConnectionStatus({ supabase, user, automation }) {
  const context = await ensureActivepiecesRuntimeConnectionProject({ supabase, user });
  let workflow = automation.workflow;
  if (typeof workflow === 'string') {
    try { workflow = JSON.parse(workflow); } catch { workflow = null; }
  }
  const detected = detectImportedWorkflowCredentialRequirements(workflow, {
    developerKeyNames: Object.keys(automation.developer_keys || {}),
  });
  const connectionsResponse = await listAppConnections({
    token: context.token,
    projectId: context.projectId,
    limit: 100,
  });
  const existingConnections = normalizeAppConnections(connectionsResponse);
  const byExternalId = new Map(existingConnections.map((connection) => [connection.externalId, connection]));

  const requirements = detected.map((requirement) => {
    const externalId = buildImportedConnectionExternalId({
      user,
      automation,
      credentialKey: requirement.credentialKey,
      pieceName: requirement.pieceName,
    });
    const existingConnection = byExternalId.get(externalId);
    return {
      ...requirement,
      externalId,
      pieceVersion: null,
      stepName: requirement.nodeNames[0] || null,
      stepDisplayName: requirement.nodeNames[0] || null,
      actionName: null,
      connected: isUsableAppConnection(existingConnection),
      status: existingConnection?.status || 'missing',
      existingConnectionId: existingConnection?.id || null,
    };
  });

  return { ...context, requirements, importedWorkflow: true };
}

export async function listAutomationConnectionStatus(args) {
  return args.automation?.activepieces_source_flow_id
    ? listRuntimeConnectionStatus(args)
    : listImportedConnectionStatus(args);
}

async function persistImportedConnectionBinding({ supabase, user, automation, target, projectId, connection }) {
  if (automation.activepieces_source_flow_id || !target?.credentialKey) return;
  const { error } = await supabase.from('user_automation_connections').upsert({
    user_id: user.id,
    automation_id: automation.id,
    credential_key: target.credentialKey,
    credential_type: target.credentialType,
    connector_id: target.connectorId,
    activepieces_piece_name: target.pieceName,
    activepieces_project_id: projectId,
    activepieces_connection_external_id: connection.externalId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,automation_id,credential_key' });
  if (error) throw error;
}

export async function prepareActivepiecesConnectionStart({ supabase, user, automation, externalId = null }) {
  const status = await listAutomationConnectionStatus({ supabase, user, automation });
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
  const authOption = getPrimaryAuthOption(pieceMetadata);
  const modelGrowOAuthApp = getModelGrowOAuthApp(target.pieceName);
  const cloudOAuthApps = modelGrowOAuthApp ? null : await fetchCloudOAuthApps();
  const cloudOAuthApp = cloudOAuthApps?.[target.pieceName]?.cloudOAuth2App || cloudOAuthApps?.[target.pieceName] || null;
  const oauthApp = modelGrowOAuthApp || cloudOAuthApp;
  const authSummary = summarizeAuthOption(authOption, oauthApp);

  const basePayload = {
    externalId: target.externalId,
    pieceName: target.pieceName,
    pieceVersion: target.pieceVersion || pieceMetadata.version,
    displayName: target.displayName,
    projectId: status.projectId,
    runtimeFlowId: status.runtimeFlow?.activepieces_flow_id || null,
    requirements: status.requirements,
    auth: authSummary,
  };

  if (authSummary.mode !== 'oauth') {
    return {
      type: authSummary.mode,
      ...basePayload,
    };
  }

  const scopes = getConnectionOAuthScopes({ automation, target, authOption });
  const props = {};
  const redirectUrl = modelGrowOAuthApp?.redirectUrl || CLOUD_OAUTH_REDIRECT_URL;
  const authorization = await getOAuth2AuthorizationUrl({
    token: status.token,
    pieceName: target.pieceName,
    pieceVersion: target.pieceVersion || pieceMetadata.version,
    projectId: status.projectId,
    clientId: oauthApp.clientId,
    redirectUrl,
    scopes,
    props,
  });
  const authorizationMethod = authOption.authorizationMethod || null;
  const scopedAuthorizationUrl = ensureOAuthAuthorizationUrlScopes(
    authorization.authorizationUrl,
    scopes,
  );

  return {
    type: 'oauth',
    ...basePayload,
    authorizationUrl: modelGrowOAuthApp
      ? markModelGrowOAuthAuthorizationUrl(scopedAuthorizationUrl)
      : scopedAuthorizationUrl,
    redirectUrl,
    codeVerifier: authorization.codeVerifier || null,
    clientId: oauthApp.clientId,
    connectionType: modelGrowOAuthApp ? 'OAUTH2' : 'CLOUD_OAUTH2',
    scope: scopes.join(' '),
    authorizationMethod,
    props,
  };
}

export async function completeActivepiecesOAuthConnection({ supabase, user, automation, externalId, pieceName, pieceVersion, clientId, code, codeVerifier, authorizationMethod = null, props = {} }) {
  const status = await listAutomationConnectionStatus({ supabase, user, automation });
  const target = status.requirements.find((requirement) => requirement.externalId === externalId && requirement.pieceName === pieceName);

  if (!target) {
    throw new Error('Connection does not belong to this automation runtime flow');
  }

  const modelGrowOAuthApp = getModelGrowOAuthApp(pieceName);
  const connectionType = modelGrowOAuthApp ? 'OAUTH2' : 'CLOUD_OAUTH2';

  if (modelGrowOAuthApp && clientId && clientId !== modelGrowOAuthApp.clientId) {
    throw new Error('OAuth client mismatch. Please restart the connection.');
  }

  const pieceMetadata = await getPieceMetadata({
    token: status.token,
    pieceName: target.pieceName,
    projectId: status.projectId,
  });
  const authOption = getPrimaryAuthOption(pieceMetadata);
  const scopes = getConnectionOAuthScopes({ automation, target, authOption });
  const trustedScope = scopes.join(' ');

  const connection = await upsertAppConnection({
    token: status.token,
    connection: {
      externalId,
      displayName: target.displayName,
      pieceName,
      pieceVersion: pieceVersion || target.pieceVersion,
      projectId: status.projectId,
      type: connectionType,
      value: modelGrowOAuthApp ? {
        type: 'OAUTH2',
        client_id: modelGrowOAuthApp.clientId,
        client_secret: modelGrowOAuthApp.clientSecret,
        code,
        code_challenge: codeVerifier || undefined,
        scope: trustedScope,
        authorization_method: authorizationMethod || undefined,
        redirect_url: modelGrowOAuthApp.redirectUrl || getDefaultModelGrowOAuthRedirectUrl(),
        grant_type: 'authorization_code',
        props,
      } : {
        type: 'CLOUD_OAUTH2',
        client_id: clientId,
        code,
        code_challenge: codeVerifier || undefined,
        scope: trustedScope,
        authorization_method: authorizationMethod || undefined,
        props,
      },
    },
  });

  await persistImportedConnectionBinding({
    supabase,
    user,
    automation,
    target,
    projectId: status.projectId,
    connection,
  });

  return {
    connection,
    status: await listAutomationConnectionStatus({ supabase, user, automation }),
  };
}

export async function completeActivepiecesManualConnection({ supabase, user, automation, externalId, pieceName, pieceVersion, values = {} }) {
  const status = await listAutomationConnectionStatus({ supabase, user, automation });
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

  await persistImportedConnectionBinding({
    supabase,
    user,
    automation,
    target,
    projectId: status.projectId,
    connection,
  });

  return {
    connection,
    status: await listAutomationConnectionStatus({ supabase, user, automation }),
  };
}
