import crypto from 'crypto';
import {
  acceptInvitation,
  adminSignIn,
  createFlow,
  extractInvitationToken,
  getFirstFlowTriggerFromTemplate,
  getFlowTemplate,
  importFlowTemplate,
  invitePlatformMember,
  listFlowRuns,
  publishFlow,
  listProjects,
  listUsers,
  signInActivepiecesUser,
  signUpActivepiecesUser,
  triggerWebhookFlow,
} from './client.js';
import { isActivepiecesSourceMissingError, markAutomationSourceMissing } from './source-sync.js';

const TOKEN_TO_USD = 0.10;

function isPublishBlockedUntilConfigured(error) {
  const code = error?.data?.code || error?.data?.error || error?.message;
  return error?.status === 400 && code === 'TRIGGER_UPDATE_STATUS';
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
  return {
    user_id: user.id,
    user_email: user.email,
    activepieces_user_id: authResponse.id,
    activepieces_project_id: authResponse.projectId,
    activepieces_platform_id: authResponse.platformId,
    activepieces_email: authResponse.email || getLinkedActivepiecesEmail(user),
    activepieces_role: role,
    status: 'ready',
    error_message: null,
    metadata: {
      provisioned_at: new Date().toISOString(),
      auth_managed: true,
      ...metadata,
    },
    updated_at: new Date().toISOString(),
  };
}

async function findExistingActivepiecesUser({ adminToken, email }) {
  const users = await listUsers({ token: adminToken, limit: 200 });
  return users?.data?.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function findProjectForOwner({ adminToken, ownerId }) {
  const projects = await listProjects({ token: adminToken, limit: 200 });
  return projects?.data?.find((project) => project.ownerId === ownerId) || null;
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
  if (existing?.status === 'ready' && existing.activepieces_project_id) {
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
        const existingActivepiecesUser = await findExistingActivepiecesUser({
          adminToken: admin.token,
          email,
        });

        if (existingActivepiecesUser) {
          const project = await findProjectForOwner({
            adminToken: admin.token,
            ownerId: existingActivepiecesUser.id,
          });

          if (!project) {
            throw new Error('Existing Activepieces user does not have a project');
          }

          authResponse = {
            id: existingActivepiecesUser.id,
            email: existingActivepiecesUser.email,
            platformId: existingActivepiecesUser.platformId,
            platformRole: existingActivepiecesUser.platformRole,
            projectId: project.id,
          };
          role = existingActivepiecesUser.platformRole || 'MEMBER';
          metadata = {
            auth_managed: false,
            linked_from: 'existing_activepieces_user',
          };
        }
      }

      if (!authResponse) {
        const invitation = await invitePlatformMember({ adminToken: admin.token, email });
        const invitationToken = extractInvitationToken(invitation);
        if (!invitationToken) {
          throw new Error('Activepieces invitation token was not returned');
        }

        await acceptInvitation({ invitationToken });

        try {
          authResponse = await signUpActivepiecesUser({
            email,
            password,
            ...splitName(user.name, email),
          });
        } catch (error) {
          if (error.status !== 409 && error.message !== 'EXISTING_USER') {
            throw error;
          }
          authResponse = await signInActivepiecesUser({ email, password });
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

  if (email === ownerEmail || link?.metadata?.auth_managed === false) {
    return adminSignIn();
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
  const projectId = authResponse.projectId || link.activepieces_project_id;

  if (authResponse.projectId && authResponse.projectId !== link.activepieces_project_id) {
    const { data, error } = await supabase
      .from('activepieces_user_links')
      .update({
        activepieces_project_id: authResponse.projectId,
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
      projectId,
    },
  };
}

export async function getActivepiecesAuthForModelGrowUser({ supabase, user }) {
  return getActivepiecesBrowserAuthForModelGrowUser({ supabase, user });
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

export async function ensureRuntimeFlowForAutomation({ supabase, user, automation }) {
  if (!automation.activepieces_source_flow_id) {
    throw new Error('Automation is not linked to an Activepieces source flow');
  }

  const link = await ensureActivepiecesUserForModelGrowUser({ supabase, user });
  const existing = await getExistingRuntimeFlow({
    supabase,
    userId: user.id,
    automationId: automation.id,
  });

  if (['active', 'draft'].includes(existing?.status) && existing.activepieces_flow_id) {
    return { link, runtimeFlow: existing };
  }

  const userAuth = await signInLinkedUser(user, link);
  const admin = await adminSignIn();
  const sourceProjectId = automation.activepieces_source_project_id || admin.projectId;

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
    throw new Error('This automation is no longer available because its Activepieces source flow was deleted.');
  }

  const trigger = getFirstFlowTriggerFromTemplate(template);
  if (!trigger) {
    throw new Error('Activepieces source flow template does not include a trigger');
  }

  const displayName = `ModelGrow Runtime - ${automation.name}`;
  const createdFlow = await createFlow({
    token: userAuth.token,
    projectId: link.activepieces_project_id,
    displayName,
    metadata: {
      modelgrowAutomationId: automation.id,
      modelgrowUserId: user.id,
    },
  });

  await importFlowTemplate({
    token: userAuth.token,
    flowId: createdFlow.id,
    displayName,
    trigger,
    schemaVersion: template?.flows?.[0]?.schemaVersion || '20',
    notes: template?.flows?.[0]?.notes || [],
  });

  let runtimeStatus = 'active';
  let publishError = null;
  try {
    await publishFlow({
      token: userAuth.token,
      flowId: createdFlow.id,
      status: 'ENABLED',
    });
  } catch (error) {
    if (!isPublishBlockedUntilConfigured(error)) {
      throw error;
    }

    runtimeStatus = 'draft';
    publishError = error.message;
  }

  const runtimePayload = {
    user_id: user.id,
    automation_id: automation.id,
    activepieces_project_id: link.activepieces_project_id,
    activepieces_flow_id: createdFlow.id,
    activepieces_source_project_id: sourceProjectId,
    activepieces_source_flow_id: automation.activepieces_source_flow_id,
    status: runtimeStatus,
    metadata: {
      copied_at: new Date().toISOString(),
      source_template_name: template?.flows?.[0]?.displayName || null,
      publish_error: publishError,
      publish_blocked_until_connections: Boolean(publishError),
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('activepieces_runtime_flows')
    .upsert(runtimePayload, { onConflict: 'user_id,automation_id' })
    .select()
    .single();

  if (error) throw error;
  return { link, runtimeFlow: data };
}

async function waitForLatestRun({ token, projectId, flowId, startedAt, attempts = 8 }) {
  for (let i = 0; i < attempts; i += 1) {
    const runs = await listFlowRuns({ token, projectId, flowId, limit: 10 });
    const latestRun = runs?.data?.find((run) => !startedAt || new Date(run.created) >= startedAt) || runs?.data?.[0];
    if (latestRun) return latestRun;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return null;
}

export async function runActivepiecesAutomation({ supabase, user, automation, config }) {
  const { link, runtimeFlow } = await ensureRuntimeFlowForAutomation({ supabase, user, automation });
  const userAuth = await signInLinkedUser(user, link);
  const startedAt = new Date();

  if (runtimeFlow.status !== 'active') {
    try {
      await publishFlow({
        token: userAuth.token,
        flowId: runtimeFlow.activepieces_flow_id,
        status: 'ENABLED',
      });

      await supabase
        .from('activepieces_runtime_flows')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', runtimeFlow.id);
    } catch (error) {
      if (isPublishBlockedUntilConfigured(error)) {
        throw new Error('Please connect the required accounts before running this automation.');
      }
      throw error;
    }
  }

  const webhookResponse = await triggerWebhookFlow({
    flowId: runtimeFlow.activepieces_flow_id,
    payload: {
      ...config,
      modelgrow: {
        user_id: user.id,
        automation_id: automation.id,
        runtime_flow_id: runtimeFlow.activepieces_flow_id,
      },
    },
  });

  const latestRun = await waitForLatestRun({
    token: userAuth.token,
    projectId: link.activepieces_project_id,
    flowId: runtimeFlow.activepieces_flow_id,
    startedAt,
  });

  return {
    success: !latestRun || latestRun.status === 'SUCCEEDED',
    webhookResponse,
    activepieces: {
      projectId: link.activepieces_project_id,
      flowId: runtimeFlow.activepieces_flow_id,
      runId: latestRun?.id || null,
      runStatus: latestRun?.status || 'UNKNOWN',
      run: latestRun || null,
    },
  };
}

export async function recordSuccessfulTokenSpend({ supabase, user, automation, tokenCost }) {
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
      engine: 'activepieces',
    },
  });

  return { tokensRemaining: newBalance };
}

export async function creditAutomationCreator({ supabase, runnerUser, automation, tokenCost }) {
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
      engine: 'activepieces',
    },
  });
}
