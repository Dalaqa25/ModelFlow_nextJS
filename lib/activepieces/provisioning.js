import crypto from 'crypto';
import {
  acceptInvitation,
  adminSignIn,
  createFlow,
  createProject,
  extractInvitationToken,
  getFirstFlowTriggerFromTemplate,
  getFlowTemplate,
  importFlowTemplate,
  invitePlatformMember,
  listFlows,
  listFlowRuns,
  listProjects,
  publishFlow,
  signInActivepiecesUser,
  signUpActivepiecesUser,
  triggerWebhookFlow,
  getActivepiecesBaseUrl,
  getFlow,
} from './client.js';
import { isActivepiecesSourceMissingError, markAutomationSourceMissing } from './source-sync.js';
import { getCustomerTunablesFromWorkflow } from './setup-schema.js';

const TOKEN_TO_USD = 0.10;
const ACTIVEPIECES_CONNECTION_REF_REGEX = /\{\{\s*connections\[['"]([^'"]+)['"]\]\s*\}\}/g;
const RUNTIME_CONNECTION_REF_VERSION = 'shared-runtime-v1';

function getActivepiecesInstanceKey() {
  return getActivepiecesBaseUrl();
}

function isLinkForCurrentActivepiecesInstance(link) {
  if (!link) return false;
  return link.metadata?.activepieces_base_url === getActivepiecesInstanceKey();
}

function isPublishBlockedUntilConfigured(error) {
  const code = error?.data?.code || error?.data?.error || error?.message;
  const params = error?.data?.params || {};

  return (
    (error?.status === 400 && code === 'TRIGGER_UPDATE_STATUS') ||
    (error?.status === 404 && code === 'ENTITY_NOT_FOUND' && params.entityType === 'piece_trigger') ||
    (error?.status === 404 && code === 'ENTITY_NOT_FOUND' && /Trigger not found/i.test(params.message || ''))
  );
}

function getPublishValidationDetails(error) {
  const params = error?.data?.params || {};
  return String(params.standardError || params.standardOutput || error?.message || '').trim();
}

function buildPublishBlockedError(error) {
  const details = getPublishValidationDetails(error);
  const notionDatabaseMatch = details.match(/Could not find database with ID:\s*([a-f0-9-]+)/i);

  if (notionDatabaseMatch) {
    const detailedError = new Error(
      `Notion cannot access database ${notionDatabaseMatch[1]}. Share that Notion database with the ModelGrow connection, or configure this automation with a database from the connected Notion workspace.`
    );
    detailedError.status = 400;
    detailedError.details = details;
    return detailedError;
  }

  const detailedError = new Error('ModelGrow could not publish this automation because one of its configured app fields is invalid or inaccessible.');
  detailedError.status = 400;
  detailedError.details = details;
  return detailedError;
}

function getPieceSlug(pieceName) {
  return String(pieceName || '')
    .replace(/^@activepieces\/piece-/, '')
    .replace(/^piece-/, '')
    .trim()
    .toLowerCase();
}

function pieceNameFromConnector(connector) {
  const slug = getPieceSlug(connector);
  if (!slug || ['manual', 'webhook', 'schedule', 'trigger'].includes(slug)) return null;
  return connector?.startsWith?.('@activepieces/')
    ? connector
    : `@activepieces/piece-${slug}`;
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

function parseRequiredInputs(inputs) {
  if (Array.isArray(inputs)) return inputs;
  if (typeof inputs === 'string') {
    try {
      const parsed = JSON.parse(inputs);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return inputs.split(',').map((name) => ({ name: name.trim() })).filter((input) => input.name);
    }
  }
  return [];
}

function extractConnectionIds(value, ids = new Set()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(ACTIVEPIECES_CONNECTION_REF_REGEX)) {
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

function findConfigValue(config, input) {
  const normalizedConfig = Object.entries(config || {}).reduce((acc, [key, value]) => {
    acc[String(key).toLowerCase()] = value;
    return acc;
  }, {});

  const candidates = [
    input?.name,
    input?.fieldKey,
    input?.propName,
    input?.label,
    input?.name?.replace(/\./g, '_'),
    input?.name?.split('.').pop(),
    input?.fieldKey?.replace(/\./g, '_'),
    input?.fieldKey?.split('.').pop(),
  ]
    .filter(Boolean)
    .map((key) => String(key).toLowerCase());

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(normalizedConfig, key)) {
      return normalizedConfig[key];
    }
  }

  return undefined;
}

function coerceActivepiecesInputValue(value, { propName = null, step = null } = {}) {
  const isGoogleSheetsInsertValues =
    propName === 'values' &&
    step?.settings?.pieceName === '@activepieces/piece-google-sheets' &&
    step?.settings?.actionName === 'insert_row' &&
    step?.settings?.input?.first_row_headers !== true;

  if (Array.isArray(value) && isGoogleSheetsInsertValues) {
    return { values: value };
  }

  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  if (['{', '['].includes(trimmed[0])) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && isGoogleSheetsInsertValues) {
        return { values: parsed };
      }
      return parsed;
    } catch (_) {
      return value;
    }
  }

  if (isGoogleSheetsInsertValues) {
    return { values: [value] };
  }

  return value;
}

function parseJsonString(value) {
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function getActivepiecesRunErrorMessage(run) {
  const failedStep = run?.failedStep;
  if (!failedStep) return null;

  const parsedMessage = parseJsonString(failedStep.message);
  const apiMessage = parsedMessage?.response?.body?.error?.message;

  if (/must not be an Office file/i.test(apiMessage || '')) {
    return `${failedStep.displayName || failedStep.name} failed: Google Sheets cannot edit that file because it is an Office/Excel document. Create or convert it to a native Google Sheet, then use the new Google Sheets spreadsheet ID.`;
  }

  if (apiMessage) {
    return `${failedStep.displayName || failedStep.name} failed: ${apiMessage}`;
  }

  if (failedStep.message) {
    return `${failedStep.displayName || failedStep.name} failed: ${failedStep.message}`;
  }

  return `${failedStep.displayName || failedStep.name} failed.`;
}

function getActivepiecesRunStatus(run) {
  return run?.status || 'UNKNOWN';
}

function isActivepiecesRunSuccessful(run) {
  return Boolean(run && getActivepiecesRunStatus(run) === 'SUCCEEDED');
}

function getActivepiecesRunSummary(run) {
  if (!run) {
    return {
      runStatus: 'UNKNOWN',
      errorMessage: null,
    };
  }

  return {
    runStatus: getActivepiecesRunStatus(run),
    errorMessage: getActivepiecesRunErrorMessage(run),
  };
}

function getActivepiecesRunFailureMessage(run) {
  const summary = getActivepiecesRunSummary(run);
  if (summary.errorMessage) {
    return summary.errorMessage;
  }

  if (summary.runStatus !== 'UNKNOWN') {
    return `Automation run status: ${summary.runStatus}`;
  }

  return 'ModelGrow did not receive a completed run status.';
}

function isActivepiecesRunStillProcessing(run) {
  if (!run) return true;
  return ['QUEUED', 'RUNNING'].includes(String(getActivepiecesRunStatus(run)).toUpperCase());
}

function normalizeActivepiecesRunForResponse(run) {
  const summary = getActivepiecesRunSummary(run);
  return {
    runId: run?.id || null,
    runStatus: summary.runStatus,
    runErrorMessage: summary.errorMessage,
    run: run || null,
  };
}

function getPreparedInputValue({ value, propName, step }) {
  if (!shouldTreatValueAsProvided(value)) {
    return value;
  }

  return coerceActivepiecesInputValue(value, { propName, step });
}

function shouldTreatValueAsProvided(value) {
  return value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null';
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

function getStepConnectionExternalId(step, requiredConnectorPieceNames, { user, automation, sourceProjectId } = {}) {
  const pieceName = step?.settings?.pieceName;
  if (pieceName && requiredConnectorPieceNames.has(pieceName)) {
    return buildRuntimeConnectionExternalId({ user, automation, sourceProjectId, pieceName });
  }

  const input = step?.settings?.input || {};
  const existing = Array.from(extractConnectionIds(input))[0];
  if (existing) return existing;

  return null;
}

function prepareRuntimeStepTree(step, { config, requiredInputs, requiredConnectorPieceNames, user, automation, sourceProjectId }) {
  if (!step || typeof step !== 'object') return step;

  const next = structuredClone(step);
  if (next.settings && !next.settings.input) {
    next.settings.input = {};
  }
  const stepInputs = requiredInputs.filter((input) => input?.stepName && input.stepName === next.name);

  if (next.settings?.input && stepInputs.length > 0) {
    for (const input of stepInputs) {
      const propName = input.propName || String(input.name || '').split('.').pop();
      if (!propName) continue;

      const value = findConfigValue(config, input);
      if (shouldTreatValueAsProvided(value)) {
        next.settings.input[propName] = getPreparedInputValue({ value, propName, step: next });
      }
    }
  }

  if (next.settings?.input) {
    const externalId = getStepConnectionExternalId(next, requiredConnectorPieceNames, { user, automation, sourceProjectId });
    if (externalId) {
      next.settings.input.auth = `{{connections['${externalId}']}}`;
      next.settings.propertySettings = {
        ...(next.settings.propertySettings || {}),
        auth: { type: 'MANUAL' },
      };
    }
  }

  if (next.type === 'PIECE' || next.type === 'PIECE_TRIGGER') {
    next.valid = true;
  }

  if (next.nextAction) {
    next.nextAction = prepareRuntimeStepTree(next.nextAction, { config, requiredInputs, requiredConnectorPieceNames, user, automation, sourceProjectId });
  }
  if (Array.isArray(next.branches)) {
    next.branches = next.branches.map((branch) => prepareRuntimeStepTree(branch, { config, requiredInputs, requiredConnectorPieceNames, user, automation, sourceProjectId }));
  }
  if (Array.isArray(next.children)) {
    next.children = next.children.map((child) => prepareRuntimeStepTree(child, { config, requiredInputs, requiredConnectorPieceNames, user, automation, sourceProjectId }));
  } else if (next.children && typeof next.children === 'object') {
    next.children = Object.fromEntries(
      Object.entries(next.children).map(([key, child]) => [
        key,
        prepareRuntimeStepTree(child, { config, requiredInputs, requiredConnectorPieceNames, user, automation, sourceProjectId }),
      ])
    );
  }

  return next;
}

function buildWebhookTriggerFromEmptyTrigger(trigger) {
  return {
    ...trigger,
    valid: true,
    displayName: 'ModelGrow Run Request',
    type: 'PIECE_TRIGGER',
    settings: {
      pieceName: '@activepieces/piece-webhook',
      pieceVersion: process.env.ACTIVEPIECES_WEBHOOK_PIECE_VERSION || '0.1.35',
      triggerName: 'catch_webhook',
      input: {
        authType: 'none',
        authFields: {},
      },
      propertySettings: {
        authType: { type: 'MANUAL' },
        authFields: { type: 'MANUAL' },
      },
    },
  };
}

function prepareRuntimeTriggerForExecution({ trigger, automation, config, user, sourceProjectId }) {
  const requiredInputs = [
    ...parseRequiredInputs(automation.required_inputs),
    ...getCustomerTunablesFromWorkflow(automation.workflow),
  ];
  const requiredConnectorPieceNames = new Set(
    normalizeRequiredConnectors(automation.required_connectors)
      .map(pieceNameFromConnector)
      .filter(Boolean)
  );

  let prepared = structuredClone(trigger);
  if (prepared.type === 'EMPTY') {
    prepared = buildWebhookTriggerFromEmptyTrigger(prepared);
  }

  return prepareRuntimeStepTree(prepared, {
    config,
    requiredInputs,
    requiredConnectorPieceNames,
    user,
    automation,
    sourceProjectId,
  });
}

function getPasswordSecret() {
  return process.env.ACTIVEPIECES_USER_PASSWORD_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function normalizeNamePart(value, fallback) {
  const cleaned = String(value || '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim();
  return cleaned || fallback;
}

function splitName(name, email) {
  const fallback = email?.split('@')?.[0] || 'ModelGrow User';
  const parts = normalizeNamePart(name || fallback, 'ModelGrow User').split(/\s+/).filter(Boolean);
  return {
    firstName: normalizeNamePart(parts[0], 'ModelGrow'),
    lastName: normalizeNamePart(parts.slice(1).join(' '), 'User'),
  };
}

export function getLinkedActivepiecesEmail(user) {
  return user.email.toLowerCase().trim();
}

export function getDeterministicActivepiecesPassword(user) {
  const secret = getPasswordSecret();
  if (!secret) {
    throw new Error('ACTIVEPIECES_USER_PASSWORD_SECRET or SUPABASE_SERVICE_ROLE_KEY is required');
  }

  const digest = crypto
    .createHmac('sha256', secret)
    .update(`${user.id}:${getLinkedActivepiecesEmail(user)}`)
    .digest('base64url')
    .slice(0, 36);

  return `ModelGrow-${digest}-2026`;
}

async function getExistingUserLink({ supabase, userId }) {
  const { data, error } = await supabase
    .from('activepieces_user_links')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function buildReadyLinkPayload({ user, authResponse, role = 'MEMBER', metadata = {} }) {
  const builderProjectId = authResponse.projectId;

  return {
    user_id: user.id,
    user_email: user.email,
    activepieces_user_id: authResponse.id,
    activepieces_project_id: builderProjectId,
    activepieces_builder_project_id: builderProjectId,
    activepieces_runtime_project_id: null,
    activepieces_platform_id: authResponse.platformId,
    activepieces_email: authResponse.email || getLinkedActivepiecesEmail(user),
    activepieces_role: role,
    status: 'ready',
    error_message: null,
    metadata: {
      provisioned_at: new Date().toISOString(),
      activepieces_base_url: getActivepiecesInstanceKey(),
      auth_managed: true,
      ...metadata,
    },
    updated_at: new Date().toISOString(),
  };
}

function isActivepiecesExistingUserConflict(error) {
  return error?.status === 409 || error?.message === 'EXISTING_USER' || error?.data?.code === 'EXISTING_USER';
}

function buildExternalActivepiecesAccountError(email) {
  const error = new Error(
    `A builder account for ${email} already exists outside ModelGrow. Direct builder accounts are not supported for ModelGrow-managed builder access.`
  );
  error.status = 409;
  error.code = 'ACTIVEPIECES_EXTERNAL_ACCOUNT_EXISTS';
  return error;
}

function getBuilderProjectId(link) {
  return link?.activepieces_builder_project_id || link?.activepieces_project_id || null;
}

function getRuntimeProjectId(link) {
  const runtimeProjectId = link?.activepieces_runtime_project_id || null;
  if (!runtimeProjectId) return null;

  // Runtime flows must never live in the visible builder project. Older builds
  // used that as a fallback when Activepieces hit the project limit, which made
  // internal runtime copies editable from the user's builder. Treat any matching
  // builder/runtime id as unsafe regardless of the old metadata shape.
  if (runtimeProjectId === getBuilderProjectId(link)) {
    return null;
  }

  return runtimeProjectId;
}

function getConfiguredPlatformRuntimeProjectId() {
  return (
    process.env.ACTIVEPIECES_PLATFORM_RUNTIME_PROJECT_ID ||
    process.env.ACTIVEPIECES_RUNTIME_PROJECT_ID ||
    ''
  ).trim() || null;
}

function isPlatformRuntimeProject(project) {
  const name = project?.displayName || project?.name || '';
  return Boolean(
    project?.metadata?.modelgrowPlatformRuntime === true ||
    /^ModelGrow Platform Runtime$/i.test(name)
  );
}

function isLegacyRuntimeProject(project) {
  return Boolean(project?.metadata?.modelgrowRuntime === true);
}

function isActivepiecesProjectLimitError(error) {
  const message = error?.data?.params?.message || error?.message || '';
  return error?.status === 402 && /Maximum limit of .* project reached/i.test(message);
}

function buildRuntimeProjectRequiredError(error) {
  const wrapped = new Error(
    'ModelGrow could not create or use a hidden runtime workspace. Configure ACTIVEPIECES_PLATFORM_RUNTIME_PROJECT_ID, or clear old builder workspace clutter / raise the builder project limit, then try again.'
  );
  wrapped.status = 409;
  wrapped.code = 'ACTIVEPIECES_RUNTIME_PROJECT_REQUIRED';
  wrapped.data = error?.data;
  return wrapped;
}

async function ensurePlatformRuntimeProject({ admin }) {
  const configuredProjectId = getConfiguredPlatformRuntimeProjectId();
  if (configuredProjectId) {
    return {
      id: configuredProjectId,
      mode: 'configured_platform_runtime_project',
    };
  }

  const projectsResponse = await listProjects({ token: admin.token, limit: 100 });
  const projects = Array.isArray(projectsResponse?.data)
    ? projectsResponse.data
    : Array.isArray(projectsResponse)
      ? projectsResponse
      : [];

  const existingPlatformProject = projects.find(isPlatformRuntimeProject);
  if (existingPlatformProject?.id) {
    return {
      id: existingPlatformProject.id,
      mode: 'existing_platform_runtime_project',
    };
  }

  try {
    const project = await createProject({
      token: admin.token,
      ownerId: admin.id,
      displayName: 'ModelGrow Platform Runtime',
      metadata: {
        modelgrowPlatformRuntime: true,
      },
    });

    if (project?.id) {
      return {
        id: project.id,
        mode: 'created_platform_runtime_project',
      };
    }
  } catch (error) {
    if (!isActivepiecesProjectLimitError(error)) {
      throw error;
    }

    // Development escape hatch: when a local/free Activepieces instance has
    // already hit the project cap, reuse an existing non-builder runtime
    // project so setup can still be tested without dumping runtime flows into
    // the user's visible builder project. Production should configure a real
    // ACTIVEPIECES_PLATFORM_RUNTIME_PROJECT_ID or raise the project limit.
    if (process.env.NODE_ENV !== 'production') {
      const legacyRuntimeProject = projects.find(isLegacyRuntimeProject);
      if (legacyRuntimeProject?.id) {
        return {
          id: legacyRuntimeProject.id,
          mode: 'dev_reused_legacy_runtime_project',
        };
      }
    }

    throw buildRuntimeProjectRequiredError(error);
  }

  throw new Error('ModelGrow Builder did not return a platform runtime workspace id');
}

async function saveReadyLink({ supabase, payload }) {
  const { data, error } = await supabase
    .from('activepieces_user_links')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function ensureActivepiecesUserForModelGrowUser({ supabase, user }) {
  const existing = await getExistingUserLink({ supabase, userId: user.id });
  if (existing?.status === 'ready' && getBuilderProjectId(existing) && isLinkForCurrentActivepiecesInstance(existing)) {
    if (!existing.activepieces_builder_project_id) {
      const { data, error } = await supabase
        .from('activepieces_user_links')
        .update({
          activepieces_builder_project_id: existing.activepieces_project_id,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (!error && data) return data;
    }

    return existing;
  }

  const email = getLinkedActivepiecesEmail(user);
  const ownerEmail = (process.env.ACTIVEPIECES_OWNER_EMAIL || process.env.ACTIVEPIECES_ADMIN_EMAIL || '').toLowerCase().trim();

  try {
    const password = getDeterministicActivepiecesPassword(user);
    const admin = await adminSignIn();
    let authResponse;
    let role = 'MEMBER';
    let metadata = {};

    if (email === ownerEmail) {
      authResponse = admin;
      role = admin.platformRole || 'ADMIN';
    } else {
      try {
        authResponse = await signInActivepiecesUser({ email, password });
        metadata = { linked_from: 'managed_sign_in' };
      } catch (_) {
        // Continue to managed invitation + sign-up below.
      }

      if (!authResponse) {
        const invitation = await invitePlatformMember({ adminToken: admin.token, email });
        const invitationToken = extractInvitationToken(invitation);
        if (!invitationToken) {
          throw new Error('ModelGrow Builder invitation token was not returned');
        }

        await acceptInvitation({ invitationToken });

        try {
          authResponse = await signUpActivepiecesUser({
            email,
            password,
            ...splitName(user.name, email),
          });
        } catch (error) {
          if (!isActivepiecesExistingUserConflict(error)) {
            throw error;
          }
          throw buildExternalActivepiecesAccountError(email);
        }
        metadata = { linked_from: 'platform_invitation' };
      }
    }

    return saveReadyLink({
      supabase,
      payload: buildReadyLinkPayload({ user, authResponse, role, metadata }),
    });
  } catch (error) {
    await supabase
      .from('activepieces_user_links')
      .upsert({
        user_id: user.id,
        user_email: user.email,
        activepieces_email: email,
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    throw error;
  }
}

async function signInLinkedUser(user, link = null) {
  const ownerEmail = (process.env.ACTIVEPIECES_OWNER_EMAIL || process.env.ACTIVEPIECES_ADMIN_EMAIL || '').toLowerCase().trim();
  const email = getLinkedActivepiecesEmail(user);

  if (email === ownerEmail) {
    return adminSignIn();
  }

  if (link?.metadata?.auth_managed === false) {
    throw buildExternalActivepiecesAccountError(email);
  }

  return signInActivepiecesUser({
    email,
    password: getDeterministicActivepiecesPassword(user),
  });
}

export async function getActivepiecesBrowserAuthForModelGrowUser({ supabase, user }) {
  let link = await ensureActivepiecesUserForModelGrowUser({ supabase, user });
  const ownerEmail = (process.env.ACTIVEPIECES_OWNER_EMAIL || process.env.ACTIVEPIECES_ADMIN_EMAIL || '').toLowerCase().trim();
  const email = getLinkedActivepiecesEmail(user);

  if (email !== ownerEmail && link?.metadata?.auth_managed === false) {
    throw new Error('Builder account exists, but ModelGrow cannot auto sign in because it was created outside ModelGrow');
  }

  const authResponse = await signInLinkedUser(user, link);
  const builderProjectId = getBuilderProjectId(link) || authResponse.projectId;

  if (builderProjectId && (!link.activepieces_project_id || !link.activepieces_builder_project_id)) {
    const { data, error } = await supabase
      .from('activepieces_user_links')
      .update({
        activepieces_project_id: link.activepieces_project_id || builderProjectId,
        activepieces_builder_project_id: link.activepieces_builder_project_id || builderProjectId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      link = data;
    }
  }

  return {
    link,
    authResponse: {
      ...authResponse,
      projectId: builderProjectId,
    },
  };
}

export async function getActivepiecesAuthForModelGrowUser({ supabase, user }) {
  return getActivepiecesBrowserAuthForModelGrowUser({ supabase, user });
}

async function ensureRuntimeProjectForModelGrowUser({ supabase, user, link }) {
  const existingRuntimeProjectId = getRuntimeProjectId(link);
  if (existingRuntimeProjectId) return { ...link, activepieces_runtime_project_id: existingRuntimeProjectId };

  if (!link.activepieces_user_id) {
    throw new Error('Builder user id is missing; cannot create a hidden runtime workspace');
  }

  const admin = await adminSignIn();

  const platformRuntimeProject = await ensurePlatformRuntimeProject({ admin });
  if (platformRuntimeProject?.id) {
    return {
      ...link,
      activepieces_runtime_project_id: platformRuntimeProject.id,
      metadata: {
        ...(link.metadata || {}),
        runtime_project_mode: platformRuntimeProject.mode,
      },
    };
  }

  const displayName = `ModelGrow Runtime ${user.id.slice(0, 8)}`;
  let runtimeProject;

  try {
    runtimeProject = await createProject({
      token: admin.token,
      ownerId: link.activepieces_user_id,
      displayName,
      metadata: {
        modelgrowRuntime: true,
        modelgrowUserId: user.id,
      },
    });
  } catch (error) {
    if (isActivepiecesProjectLimitError(error)) {
      throw buildRuntimeProjectRequiredError(error);
    }

    const message = error?.data?.params?.message || error?.message || 'runtime workspace creation failed';
    const wrapped = new Error(`Could not create hidden ModelGrow runtime workspace: ${message}`);
    wrapped.status = error.status;
    wrapped.data = error.data;
    throw wrapped;
  }

  if (!runtimeProject?.id) {
    throw new Error('ModelGrow Builder did not return a runtime workspace id');
  }

  const { data, error } = await supabase
    .from('activepieces_user_links')
    .update({
      activepieces_runtime_project_id: runtimeProject.id,
      metadata: {
        ...(link.metadata || {}),
        activepieces_base_url: getActivepiecesInstanceKey(),
        runtime_project_created_at: new Date().toISOString(),
        runtime_project_name: displayName,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function ensureActivepiecesRuntimeConnectionProject({ supabase, user }) {
  let link = await ensureActivepiecesUserForModelGrowUser({ supabase, user });
  link = await ensureRuntimeProjectForModelGrowUser({ supabase, user, link });
  const authResponse = await adminSignIn();
  return {
    link,
    token: authResponse.token,
    projectId: link.activepieces_runtime_project_id,
  };
}

async function getExistingRuntimeFlow({ supabase, userId, automationId }) {
  const { data, error } = await supabase
    .from('activepieces_runtime_flows')
    .select('*')
    .eq('user_id', userId)
    .eq('automation_id', automationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getExistingRuntimeFlowForSource({ supabase, userId, runtimeProjectId, sourceProjectId, sourceFlowId }) {
  const { data, error } = await supabase
    .from('activepieces_runtime_flows')
    .select('*')
    .eq('user_id', userId)
    .eq('activepieces_project_id', runtimeProjectId)
    .eq('activepieces_source_project_id', sourceProjectId)
    .eq('activepieces_source_flow_id', sourceFlowId)
    .in('status', ['active', 'draft'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function isActivepiecesRuntimeFlowForSource(flow, { userId, sourceProjectId, sourceFlowId }) {
  return Boolean(
    flow?.metadata?.modelgrowRuntime === true &&
    flow?.metadata?.modelgrowUserId === userId &&
    flow?.metadata?.modelgrowSourceProjectId === sourceProjectId &&
    flow?.metadata?.modelgrowSourceFlowId === sourceFlowId
  );
}

function getActivepiecesFlowSortTime(flow) {
  return Date.parse(flow?.updated || flow?.updatedAt || flow?.created || flow?.createdAt || 0) || 0;
}

function chooseBestRuntimeFlow(flows = []) {
  return [...flows].sort((a, b) => {
    const aEnabled = String(a?.status || '').toUpperCase() === 'ENABLED' ? 1 : 0;
    const bEnabled = String(b?.status || '').toUpperCase() === 'ENABLED' ? 1 : 0;
    if (aEnabled !== bEnabled) return bEnabled - aEnabled;
    return getActivepiecesFlowSortTime(b) - getActivepiecesFlowSortTime(a);
  })[0] || null;
}

async function listActivepiecesRuntimeFlowsForSource({ token, runtimeProjectId, userId, sourceProjectId, sourceFlowId }) {
  const response = await listFlows({
    token,
    projectId: runtimeProjectId,
    limit: 100,
  });
  const flows = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];

  return flows.filter((flow) => isActivepiecesRuntimeFlowForSource(flow, { userId, sourceProjectId, sourceFlowId }));
}

async function pauseDuplicateRuntimeFlows({
  supabase,
  token,
  runtimeProjectId,
  keepFlowId,
  userId,
  sourceProjectId,
  sourceFlowId,
}) {
  if (!keepFlowId) return [];

  const runtimeFlows = await listActivepiecesRuntimeFlowsForSource({
    token,
    runtimeProjectId,
    userId,
    sourceProjectId,
    sourceFlowId,
  });
  const duplicates = runtimeFlows.filter((flow) => flow?.id && flow.id !== keepFlowId);

  for (const duplicate of duplicates) {
    if (String(duplicate.status || '').toUpperCase() !== 'ENABLED') continue;
    try {
      await publishFlow({
        token,
        flowId: duplicate.id,
        projectId: runtimeProjectId,
        status: 'DISABLED',
      });
    } catch (error) {
      console.warn('[Activepieces Runtime] Failed to disable duplicate runtime flow', {
        keepFlowId,
        duplicateFlowId: duplicate.id,
        message: error?.message,
        status: error?.status,
      });
    }
  }

  if (duplicates.length > 0) {
    await supabase
      .from('activepieces_runtime_flows')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('activepieces_project_id', runtimeProjectId)
      .eq('activepieces_source_project_id', sourceProjectId)
      .eq('activepieces_source_flow_id', sourceFlowId)
      .neq('activepieces_flow_id', keepFlowId);
  }

  return duplicates;
}

async function pauseSourceBuilderFlow({
  token,
  sourceProjectId,
  sourceFlowId,
  reason = 'runtime_enabled',
}) {
  if (!token || !sourceProjectId || !sourceFlowId) return false;

  let sourceFlow = null;
  try {
    sourceFlow = await getFlow({
      token,
      projectId: sourceProjectId,
      flowId: sourceFlowId,
    });
  } catch (error) {
    console.warn('[Activepieces Runtime] Could not inspect source builder flow before pausing', {
      sourceProjectId,
      sourceFlowId,
      reason,
      message: error?.message,
      status: error?.status,
    });
    return false;
  }

  if (String(sourceFlow?.status || sourceFlow?.version?.status || '').toUpperCase() !== 'ENABLED') {
    return false;
  }

  try {
    await publishFlow({
      token,
      flowId: sourceFlowId,
      projectId: sourceProjectId,
      status: 'DISABLED',
    });
    console.info('[Activepieces Runtime] Paused source builder flow to prevent duplicate live triggers', {
      sourceProjectId,
      sourceFlowId,
      reason,
    });
    return true;
  } catch (error) {
    console.warn('[Activepieces Runtime] Failed to pause source builder flow', {
      sourceProjectId,
      sourceFlowId,
      reason,
      message: error?.message,
      status: error?.status,
    });
    return false;
  }
}

function getRuntimeStatusFromActivepiecesFlow(flow) {
  return String(flow?.status || '').toUpperCase() === 'ENABLED' ? 'active' : 'draft';
}

async function importPreparedRuntimeFlowTemplate({
  token,
  flowId,
  projectId,
  displayName,
  trigger,
  schemaVersion = '20',
  notes = [],
  automation,
  config = {},
  user,
  sourceProjectId,
}) {
  const preparedTrigger = prepareRuntimeTriggerForExecution({
    trigger,
    automation,
    config,
    user,
    sourceProjectId,
  });

  await importFlowTemplate({
    token,
    flowId,
    projectId,
    displayName,
    trigger: preparedTrigger,
    schemaVersion,
    notes,
  });

  return preparedTrigger;
}

async function saveRuntimeFlowRecord({
  supabase,
  user,
  automation,
  runtimeProjectId,
  sourceProjectId,
  flowId,
  status,
  metadata = {},
  existingRuntimeFlowId = null,
}) {
  const runtimePayload = {
    user_id: user.id,
    automation_id: automation.id,
    activepieces_project_id: runtimeProjectId,
    activepieces_flow_id: flowId,
    activepieces_source_project_id: sourceProjectId,
    activepieces_source_flow_id: automation.activepieces_source_flow_id,
    status,
    metadata: {
      activepieces_base_url: getActivepiecesInstanceKey(),
      ...metadata,
    },
    updated_at: new Date().toISOString(),
  };

  const query = existingRuntimeFlowId
    ? supabase.from('activepieces_runtime_flows').update(runtimePayload).eq('id', existingRuntimeFlowId)
    : supabase.from('activepieces_runtime_flows').upsert(runtimePayload, { onConflict: 'user_id,automation_id' });

  const { data, error } = await query
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function ensureRuntimeFlowForAutomation({ supabase, user, automation }) {
  if (!automation.activepieces_source_flow_id) {
    throw new Error('Automation is not linked to a ModelGrow Builder source workflow');
  }

  let link = await ensureActivepiecesUserForModelGrowUser({ supabase, user });
  const existing = await getExistingRuntimeFlow({
    supabase,
    userId: user.id,
    automationId: automation.id,
  });

  link = await ensureRuntimeProjectForModelGrowUser({ supabase, user, link });
  const runtimeProjectId = getRuntimeProjectId(link);
  if (!runtimeProjectId) {
    throw new Error('Hidden ModelGrow runtime workspace is not available');
  }

  const existingMatchesRuntimeProject =
    ['active', 'draft'].includes(existing?.status) &&
    existing.activepieces_flow_id &&
    existing.activepieces_project_id === runtimeProjectId;

  const admin = await adminSignIn();
  const sourceProjectId = automation.activepieces_source_project_id || admin.projectId;

  if (
    existingMatchesRuntimeProject &&
    existing.metadata?.connection_ref_version === RUNTIME_CONNECTION_REF_VERSION
  ) {
    await pauseDuplicateRuntimeFlows({
      supabase,
      token: admin.token,
      runtimeProjectId,
      keepFlowId: existing.activepieces_flow_id,
      userId: user.id,
      sourceProjectId,
      sourceFlowId: automation.activepieces_source_flow_id,
    });
    return { link, runtimeFlow: existing };
  }

  let template;
  try {
    template = await getFlowTemplate({
      token: admin.token,
      projectId: sourceProjectId,
      flowId: automation.activepieces_source_flow_id,
    });
  } catch (error) {
    if (!isActivepiecesSourceMissingError(error)) {
      throw error;
    }

    await markAutomationSourceMissing({
      supabase,
      automation,
      reason: 'activepieces_source_flow_deleted',
    });
    throw new Error('This automation is no longer available because its source workflow was deleted.');
  }

  const trigger = getFirstFlowTriggerFromTemplate(template);
  if (!trigger) {
    throw new Error('Source workflow template does not include a trigger');
  }

  if (existingMatchesRuntimeProject) {
    let migrationTemplate = null;
    try {
      migrationTemplate = await getFlowTemplate({
        token: admin.token,
        projectId: runtimeProjectId,
        flowId: existing.activepieces_flow_id,
      });
    } catch (_) {
      // If the old runtime template cannot be read, fall back to the current
      // source trigger so we can repair the runtime flow instead of creating a
      // duplicate.
    }

    const migrationTrigger = getFirstFlowTriggerFromTemplate(migrationTemplate) || trigger;
    await importPreparedRuntimeFlowTemplate({
      token: admin.token,
      flowId: existing.activepieces_flow_id,
      projectId: runtimeProjectId,
      displayName: migrationTemplate?.flows?.[0]?.displayName || template?.flows?.[0]?.displayName || `ModelGrow Runtime - ${automation.name}`,
      trigger: migrationTrigger,
      schemaVersion: migrationTemplate?.flows?.[0]?.schemaVersion || template?.flows?.[0]?.schemaVersion || '20',
      notes: migrationTemplate?.flows?.[0]?.notes || template?.flows?.[0]?.notes || [],
      automation,
      config: {},
      user,
      sourceProjectId,
    });

    const runtimeFlow = await saveRuntimeFlowRecord({
      supabase,
      user,
      automation,
      runtimeProjectId,
      sourceProjectId,
      flowId: existing.activepieces_flow_id,
      status: existing.status,
      existingRuntimeFlowId: existing.id,
      metadata: {
        ...(existing.metadata || {}),
        connection_ref_version: RUNTIME_CONNECTION_REF_VERSION,
        connection_refs_repaired_at: new Date().toISOString(),
        source_template_name: template?.flows?.[0]?.displayName || null,
      },
    });
    await pauseDuplicateRuntimeFlows({
      supabase,
      token: admin.token,
      runtimeProjectId,
      keepFlowId: runtimeFlow.activepieces_flow_id,
      userId: user.id,
      sourceProjectId,
      sourceFlowId: automation.activepieces_source_flow_id,
    });
    return { link, runtimeFlow };
  }

  if (!existing) {
    const reusableRuntimeFlow = await getExistingRuntimeFlowForSource({
      supabase,
      userId: user.id,
      runtimeProjectId,
      sourceProjectId,
      sourceFlowId: automation.activepieces_source_flow_id,
    });

    if (reusableRuntimeFlow?.activepieces_flow_id) {
      await importPreparedRuntimeFlowTemplate({
        token: admin.token,
        flowId: reusableRuntimeFlow.activepieces_flow_id,
        projectId: runtimeProjectId,
        displayName: template?.flows?.[0]?.displayName || `ModelGrow Runtime - ${automation.name}`,
        trigger,
        schemaVersion: template?.flows?.[0]?.schemaVersion || '20',
        notes: template?.flows?.[0]?.notes || [],
        automation,
        config: {},
        user,
        sourceProjectId,
      });

      const runtimeFlow = await saveRuntimeFlowRecord({
        supabase,
        user,
        automation,
        runtimeProjectId,
        sourceProjectId,
        flowId: reusableRuntimeFlow.activepieces_flow_id,
        status: reusableRuntimeFlow.status,
        existingRuntimeFlowId: reusableRuntimeFlow.id,
        metadata: {
          ...(reusableRuntimeFlow.metadata || {}),
          reattached_at: new Date().toISOString(),
          previous_automation_id: reusableRuntimeFlow.automation_id,
          source_template_name: template?.flows?.[0]?.displayName || null,
          connection_ref_version: RUNTIME_CONNECTION_REF_VERSION,
        },
      });
      await pauseDuplicateRuntimeFlows({
        supabase,
        token: admin.token,
        runtimeProjectId,
        keepFlowId: runtimeFlow.activepieces_flow_id,
        userId: user.id,
        sourceProjectId,
        sourceFlowId: automation.activepieces_source_flow_id,
      });
      return { link, runtimeFlow };
    }

    const existingActivepiecesFlows = await listActivepiecesRuntimeFlowsForSource({
      token: admin.token,
      runtimeProjectId,
      userId: user.id,
      sourceProjectId,
      sourceFlowId: automation.activepieces_source_flow_id,
    });
    const existingActivepiecesFlow = chooseBestRuntimeFlow(existingActivepiecesFlows);

    if (existingActivepiecesFlow?.id) {
      await importPreparedRuntimeFlowTemplate({
        token: admin.token,
        flowId: existingActivepiecesFlow.id,
        projectId: runtimeProjectId,
        displayName: template?.flows?.[0]?.displayName || existingActivepiecesFlow.displayName || `ModelGrow Runtime - ${automation.name}`,
        trigger,
        schemaVersion: template?.flows?.[0]?.schemaVersion || '20',
        notes: template?.flows?.[0]?.notes || [],
        automation,
        config: {},
        user,
        sourceProjectId,
      });

      const runtimeFlow = await saveRuntimeFlowRecord({
        supabase,
        user,
        automation,
        runtimeProjectId,
        sourceProjectId,
        flowId: existingActivepiecesFlow.id,
        status: getRuntimeStatusFromActivepiecesFlow(existingActivepiecesFlow),
        metadata: {
          restored_from_activepieces_at: new Date().toISOString(),
          source_template_name: template?.flows?.[0]?.displayName || null,
          connection_ref_version: RUNTIME_CONNECTION_REF_VERSION,
        },
      });
      await pauseDuplicateRuntimeFlows({
        supabase,
        token: admin.token,
        runtimeProjectId,
        keepFlowId: runtimeFlow.activepieces_flow_id,
        userId: user.id,
        sourceProjectId,
        sourceFlowId: automation.activepieces_source_flow_id,
      });
      return { link, runtimeFlow };
    }
  }

  const displayName = `ModelGrow Runtime - ${automation.name}`;
  const createdFlow = await createFlow({
    token: admin.token,
    projectId: runtimeProjectId,
    displayName,
    metadata: {
      modelgrowRuntime: true,
      modelgrowAutomationId: automation.id,
      modelgrowUserId: user.id,
      modelgrowSourceProjectId: sourceProjectId,
      modelgrowSourceFlowId: automation.activepieces_source_flow_id,
    },
  });

  await importPreparedRuntimeFlowTemplate({
    token: admin.token,
    flowId: createdFlow.id,
    projectId: runtimeProjectId,
    displayName,
    trigger,
    schemaVersion: template?.flows?.[0]?.schemaVersion || '20',
    notes: template?.flows?.[0]?.notes || [],
    automation,
    config: {},
    user,
    sourceProjectId,
  });

  let runtimeStatus = 'active';
  let publishError = null;
  try {
    await publishFlow({
      token: admin.token,
      flowId: createdFlow.id,
      projectId: runtimeProjectId,
      status: 'ENABLED',
    });
  } catch (error) {
    if (!isPublishBlockedUntilConfigured(error)) {
      throw error;
    }

    runtimeStatus = 'draft';
    publishError = error.message;
  }

  const runtimeFlow = await saveRuntimeFlowRecord({
    supabase,
    user,
    automation,
    runtimeProjectId,
    sourceProjectId,
    flowId: createdFlow.id,
    status: runtimeStatus,
    metadata: {
      copied_at: new Date().toISOString(),
      source_template_name: template?.flows?.[0]?.displayName || null,
      publish_error: publishError,
      publish_blocked_until_connections: Boolean(publishError),
      connection_ref_version: RUNTIME_CONNECTION_REF_VERSION,
    },
  });

  await pauseDuplicateRuntimeFlows({
    supabase,
    token: admin.token,
    runtimeProjectId,
    keepFlowId: runtimeFlow.activepieces_flow_id,
    userId: user.id,
    sourceProjectId,
    sourceFlowId: automation.activepieces_source_flow_id,
  });

  return { link, runtimeFlow };
}

const ACTIVEPIECES_TERMINAL_RUN_STATUSES = new Set([
  'SUCCEEDED',
  'FAILED',
  'INTERNAL_ERROR',
  'TIMEOUT',
  'STOPPED',
]);

async function waitForLatestRun({ token, projectId, flowId, startedAt, attempts = 30, delayMs = 2000 }) {
  let latestRun = null;

  for (let i = 0; i < attempts; i += 1) {
    const runs = await listFlowRuns({ token, projectId, flowId, limit: 10 });
    latestRun = runs?.data?.find((run) => !startedAt || new Date(run.created) >= startedAt) || runs?.data?.[0] || null;

    if (latestRun && ACTIVEPIECES_TERMINAL_RUN_STATUSES.has(String(latestRun.status || '').toUpperCase())) {
      return latestRun;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return latestRun;
}

export async function configureActivepiecesAutomation({ supabase, user, automation, config }) {
  const { runtimeFlow } = await ensureRuntimeFlowForAutomation({ supabase, user, automation });
  const admin = await adminSignIn();
  const runtimeTemplate = await getFlowTemplate({
    token: admin.token,
    projectId: runtimeFlow.activepieces_project_id,
    flowId: runtimeFlow.activepieces_flow_id,
  });
  const runtimeTrigger = getFirstFlowTriggerFromTemplate(runtimeTemplate);
  if (!runtimeTrigger) {
    throw new Error('Runtime workflow template does not include a trigger');
  }

  const preparedTrigger = prepareRuntimeTriggerForExecution({
    trigger: runtimeTrigger,
    automation,
    config,
    user,
    sourceProjectId: runtimeFlow.activepieces_source_project_id || automation.activepieces_source_project_id,
  });

  await importFlowTemplate({
    token: admin.token,
    flowId: runtimeFlow.activepieces_flow_id,
    projectId: runtimeFlow.activepieces_project_id,
    displayName: runtimeTemplate?.flows?.[0]?.displayName || `ModelGrow Runtime - ${automation.name}`,
    trigger: preparedTrigger,
    schemaVersion: runtimeTemplate?.flows?.[0]?.schemaVersion || '20',
    notes: runtimeTemplate?.flows?.[0]?.notes || [],
  });

  try {
    await publishFlow({
      token: admin.token,
      flowId: runtimeFlow.activepieces_flow_id,
      projectId: runtimeFlow.activepieces_project_id,
      status: 'ENABLED',
    });

    await supabase
      .from('activepieces_runtime_flows')
      .update({
        status: 'active',
        metadata: {
          ...(runtimeFlow.metadata || {}),
          prepared_at: new Date().toISOString(),
          publish_error: null,
          publish_blocked_until_connections: false,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', runtimeFlow.id);

    await supabase
      .from('user_automations')
      .upsert({
        user_id: user.id,
        automation_id: automation.id,
        parameters: config || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,automation_id',
        ignoreDuplicates: false,
      });

    await pauseSourceBuilderFlow({
      token: admin.token,
      sourceProjectId: runtimeFlow.activepieces_source_project_id || automation.activepieces_source_project_id,
      sourceFlowId: runtimeFlow.activepieces_source_flow_id || automation.activepieces_source_flow_id,
      reason: 'runtime_configured',
    });
  } catch (error) {
    if (isPublishBlockedUntilConfigured(error)) {
      throw buildPublishBlockedError(error);
    }
    throw error;
  }

  return {
    runtimeFlow,
    token: admin.token,
    projectId: runtimeFlow.activepieces_project_id,
    flowId: runtimeFlow.activepieces_flow_id,
    trigger: preparedTrigger,
  };
}

export async function runActivepiecesAutomation({ supabase, user, automation, config }) {
  const configured = await configureActivepiecesAutomation({ supabase, user, automation, config });
  const startedAt = new Date();

  const webhookResponse = await triggerWebhookFlow({
    flowId: configured.flowId,
    payload: {
      ...config,
      modelgrow: {
        user_id: user.id,
        automation_id: automation.id,
        runtime_flow_id: configured.flowId,
      },
    },
  });

  const latestRun = await waitForLatestRun({
    token: configured.token,
    projectId: configured.projectId,
    flowId: configured.flowId,
    startedAt,
  });
  const normalizedRun = normalizeActivepiecesRunForResponse(latestRun);

  return {
    success: isActivepiecesRunSuccessful(latestRun),
    pending: isActivepiecesRunStillProcessing(latestRun),
    errorMessage: getActivepiecesRunFailureMessage(latestRun),
    webhookResponse,
    activepieces: {
      projectId: configured.projectId,
      flowId: configured.flowId,
      ...normalizedRun,
    },
  };
}

export async function recordSuccessfulTokenSpend({
  supabase,
  user,
  automation,
  tokenCost,
  engine = 'activepieces',
}) {
  if (!tokenCost || tokenCost <= 0) return { tokensRemaining: null };

  const { data: runner, error: runnerError } = await supabase
    .from('users')
    .select('id, email, token_balance')
    .eq('id', user.id)
    .single();

  if (runnerError || !runner) {
    throw new Error('User not found while charging tokens');
  }

  if (runner.token_balance < tokenCost) {
    throw new Error('Insufficient token balance');
  }

  const newBalance = runner.token_balance - tokenCost;
  const { error: deductError } = await supabase
    .from('users')
    .update({ token_balance: newBalance })
    .eq('id', user.id);

  if (deductError) throw deductError;

  await supabase.from('token_transactions').insert({
    user_id: user.id,
    transaction_type: 'spend',
    token_amount: -tokenCost,
    usd_amount: -(tokenCost * TOKEN_TO_USD),
    status: 'completed',
    metadata: {
      automation_id: automation.id,
      automation_name: automation.name,
      developer_email: automation.author_email,
      engine,
    },
  });

  return { tokensRemaining: newBalance };
}

export async function creditAutomationCreator({
  supabase,
  runnerUser,
  automation,
  tokenCost,
  engine = 'activepieces',
}) {
  if (!tokenCost || tokenCost <= 0 || !automation.author_email || automation.author_email === runnerUser.email) {
    return;
  }

  const usdAmount = tokenCost * TOKEN_TO_USD;
  const { data: creator } = await supabase
    .from('users')
    .select('id, email, total_earnings_usd')
    .eq('email', automation.author_email)
    .single();

  if (!creator) return;

  await supabase
    .from('users')
    .update({ total_earnings_usd: (parseFloat(creator.total_earnings_usd) || 0) + usdAmount })
    .eq('id', creator.id);

  await supabase.from('token_transactions').insert({
    user_id: creator.id,
    transaction_type: 'earning',
    token_amount: tokenCost,
    usd_amount: usdAmount,
    status: 'completed',
    metadata: {
      automation_id: automation.id,
      automation_name: automation.name,
      runner_id: runnerUser.id,
      runner_email: runnerUser.email,
      engine,
    },
  });
}
