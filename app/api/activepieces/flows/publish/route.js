import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { userDB } from '@/lib/db/supabase-db';
import { createAdminClient } from '@/lib/db/supabase-server';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { getActivepiecesBrowserAuthForModelGrowUser } from '@/lib/activepieces/provisioning';
import { getFlow, getFlowTemplate, isActivepiecesConfigured, publishFlow } from '@/lib/activepieces/client';
import { getLegacyTriggerTypeFromWorkflow } from '@/lib/activepieces/lifecycle';
import {
  getFlowDisplayName,
  getSourceFlowBlockMessage,
  getSourceFlowBlockReason,
} from '@/lib/activepieces/flow-guards';
import {
  analyzeActivepiecesWorkflow,
  getRequiredConnectorsFromContract,
  getRequiredInputsFromContract,
} from '@/lib/activepieces/workflow-analyzer';
import {
  buildRuntimePublishTestResult,
  verifyPublishTestToken,
} from '@/lib/activepieces/publish-test';
import { notifyAutomationReviewRequested } from '@/lib/email/admin-review-notifications';

export const dynamic = 'force-dynamic';

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 2000;
const MAX_TOKEN_COST = 10000;

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeTokenCost(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(Math.round(parsed), MAX_TOKEN_COST);
}

async function pausePublishedSourceFlow({ token, projectId, flowId }) {
  if (!token || !projectId || !flowId) return false;

  try {
    const flow = await getFlow({ token, projectId, flowId });
    if (String(flow?.status || flow?.version?.status || '').toUpperCase() !== 'ENABLED') {
      return false;
    }

    await publishFlow({
      token,
      projectId,
      flowId,
      status: 'DISABLED',
    });

    console.info('[Activepieces Publish] Paused source builder flow after publishing to prevent duplicate live triggers', {
      projectId,
      flowId,
    });
    return true;
  } catch (error) {
    console.warn('[Activepieces Publish] Could not pause source builder flow after publishing', {
      projectId,
      flowId,
      message: error?.message,
      status: error?.status,
    });
    return false;
  }
}

export async function POST(request) {
  const authUser = await getSupabaseUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isActivepiecesConfigured()) {
    return NextResponse.json({ error: 'ModelGrow Builder is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const flowId = normalizeText(body?.flowId);
    const title = normalizeText(body?.title);
    const description = normalizeText(body?.description);
    const tokenCost = normalizeTokenCost(body?.tokenCost);
    const publishTestToken = normalizeText(body?.publishTestToken);

    if (!flowId) {
      return NextResponse.json({ error: 'Flow is required' }, { status: 400 });
    }
    if (!title || title.length > MAX_TITLE) {
      return NextResponse.json({ error: `Title is required and must be ${MAX_TITLE} characters or less` }, { status: 400 });
    }
    if (!description || description.length > MAX_DESCRIPTION) {
      return NextResponse.json({ error: `Description is required and must be ${MAX_DESCRIPTION} characters or less` }, { status: 400 });
    }

    const supabase = createAdminClient();
    const user = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });

    const { link, authResponse } = await getActivepiecesBrowserAuthForModelGrowUser({ supabase, user });
    const projectId = authResponse.projectId || link.activepieces_project_id;

    const flow = await getFlow({ token: authResponse.token, flowId, projectId });
    if (!flow?.id) {
      return NextResponse.json({ error: 'Flow not found in your builder workspace' }, { status: 404 });
    }
    const blockReason = getSourceFlowBlockReason(flow);
    if (blockReason) {
      return NextResponse.json({
        error: getSourceFlowBlockMessage(blockReason),
        reason: blockReason,
      }, { status: blockReason === 'runtime_copy' ? 403 : 409 });
    }

    const template = await getFlowTemplate({ token: authResponse.token, flowId, projectId });
    const analyzedContract = await analyzeActivepiecesWorkflow({
      template,
      token: authResponse.token,
      projectId,
    });

    const publishTestVerification = verifyPublishTestToken({
      token: publishTestToken,
      userEmail: authUser.email,
      projectId,
      flow,
    });
    if (!publishTestVerification.valid) {
      return NextResponse.json({
        error: 'Run and pass the required publish test before publishing this automation.',
        reason: publishTestVerification.reason,
      }, { status: 409 });
    }

    const publishTest = buildRuntimePublishTestResult({
      flow,
      contract: analyzedContract,
      template,
      requireRuntimeRun: false,
    });
    if (publishTest.status !== 'passed') {
      return NextResponse.json({
        error: 'The required publish test no longer passes. Fix the listed issues and run the test again.',
        result: publishTest,
      }, { status: 422 });
    }

    if (analyzedContract.unresolved.length > 0) {
      return NextResponse.json({
        error: 'This workflow contains requirements ModelGrow could not classify.',
        unresolved: analyzedContract.unresolved,
      }, { status: 422 });
    }

    const setupContract = {
      ...analyzedContract,
      confirmedAt: new Date().toISOString(),
    };
    const requiredConnectors = getRequiredConnectorsFromContract(setupContract);
    const requiredInputs = getRequiredInputsFromContract(setupContract);
    const triggerType = getLegacyTriggerTypeFromWorkflow({ template });

    let embedding = null;
    try {
      embedding = await generateEmbedding(`${title} ${description}`);
    } catch (error) {
      console.warn('[Activepieces Publish] Failed to generate embedding:', error.message);
    }

    const { data: existing } = await supabase
      .from('automations')
      .select('id')
      .eq('author_email', authUser.email)
      .eq('activepieces_source_project_id', projectId)
      .eq('activepieces_source_flow_id', flowId)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({
        error: 'This builder flow is already published in ModelGrow. Edit the existing listing instead of publishing it again.',
        reason: 'already_published',
        automationId: existing.id,
      }, { status: 409 });
    }

    const automationPayload = {
      name: title,
      description,
      author_email: authUser.email,
      token_cost: tokenCost,
      workflow: {
        engine: 'activepieces',
        modelgrow_submission: {
          user_id: authUser.id,
          submitted_at: new Date().toISOString(),
          source: 'modelgrow_builder',
        },
        source_project_id: projectId,
        source_flow_id: flowId,
        source_flow_name: getFlowDisplayName(flow) || title,
        template,
        setup_contract_version: setupContract.version,
        setup_contract: setupContract,
        publish_test: {
          ...publishTest,
          token_verified_at: new Date().toISOString(),
        },
      },
      embedding,
      required_connectors: requiredConnectors,
      required_inputs: requiredInputs,
      developer_keys: {},
      required_scopes: [],
      // A changed workflow must pass marketplace review again.
      is_active: false,
      activepieces_source_project_id: projectId,
      activepieces_source_flow_id: flowId,
      activepieces_trigger_type: triggerType,
    };

    const { data: automation, error: publicationError } = await supabase
      .from('automations')
      .insert(automationPayload)
      .select()
      .single();

    if (publicationError) throw publicationError;

    const sourceFlowPaused = await pausePublishedSourceFlow({
      token: authResponse.token,
      projectId,
      flowId,
    });

    notifyAutomationReviewRequested({
      automation,
      authorEmail: authUser.email,
      source: 'ModelGrow Builder',
    }).catch((emailError) => {
      console.error('[Activepieces Publish] Failed to send review notification email:', emailError);
    });

    return NextResponse.json({
      success: true,
      updated: false,
      automation,
      sourceFlowPaused,
      detected: {
        requiredConnectors,
        requiredInputs,
        triggerType,
        setupContract,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Activepieces Publish] Failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to publish builder flow',
    }, { status: 500 });
  }
}
