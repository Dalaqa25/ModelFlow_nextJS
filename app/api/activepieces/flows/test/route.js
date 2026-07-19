import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { userDB } from '@/lib/db/supabase-db';
import { createAdminClient } from '@/lib/db/supabase-server';
import { getActivepiecesBrowserAuthForModelGrowUser } from '@/lib/activepieces/provisioning';
import { getFlow, getFlowTemplate, isActivepiecesConfigured, listFlowRuns } from '@/lib/activepieces/client';
import {
  getSourceFlowBlockMessage,
  getSourceFlowBlockReason,
} from '@/lib/activepieces/flow-guards';
import { analyzeActivepiecesWorkflow } from '@/lib/activepieces/workflow-analyzer';
import {
  buildRuntimePublishTestResult,
  createPublishTestToken,
  getLatestSuccessfulPublishTestRun,
  getLatestTerminalPublishTestRun,
} from '@/lib/activepieces/publish-test';
import { runActivepiecesBuilderTestFlow } from '@/lib/activepieces/socket-test-runner';

export const dynamic = 'force-dynamic';

function normalizeText(value) {
  return String(value || '').trim();
}

function getFlowVersionId(flow) {
  return normalizeText(
    flow?.version?.id ||
    flow?.versionId ||
    flow?.publishedVersionId
  );
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

    if (!flowId) {
      return NextResponse.json({ error: 'Flow is required' }, { status: 400 });
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
        status: 'failed',
        error: getSourceFlowBlockMessage(blockReason),
        reason: blockReason,
        result: {
          status: 'failed',
          testedAt: new Date().toISOString(),
          flowId,
          issues: [{
            type: blockReason,
            severity: 'error',
            message: getSourceFlowBlockMessage(blockReason),
            fix: blockReason === 'not_published'
              ? 'Publish and enable the workflow inside ModelGrow Builder, then run this test again.'
              : 'Open the original builder flow instead of a runtime copy.',
          }],
        },
      }, { status: blockReason === 'runtime_copy' ? 403 : 409 });
    }

    const template = await getFlowTemplate({ token: authResponse.token, flowId, projectId });
    const contract = await analyzeActivepiecesWorkflow({
      template,
      token: authResponse.token,
      projectId,
    });

    const flowVersionId = getFlowVersionId(flow);
    if (!flowVersionId) {
      return NextResponse.json({
        status: 'failed',
        error: 'ModelGrow could not identify the builder flow version to test.',
        result: {
          status: 'failed',
          testedAt: new Date().toISOString(),
          flowId,
          issues: [{
            type: 'missing_flow_version',
            severity: 'error',
            message: 'ModelGrow could not identify the builder flow version to test.',
            fix: 'Reopen the workflow in ModelGrow Builder, save it, then try the publish test again.',
          }],
        },
      }, { status: 422 });
    }

    let triggeredRun = null;
    let runtimeError = null;
    try {
      triggeredRun = await runActivepiecesBuilderTestFlow({
        token: authResponse.token,
        projectId,
        flowVersionId,
      });
    } catch (error) {
      runtimeError = error;
      console.warn('[Activepieces Publish Test] Test-run socket unavailable; falling back to Builder run history:', {
        message: error.message,
        code: error.code,
        flowId,
        flowVersionId,
      });
    }

    const runs = await listFlowRuns({
      token: authResponse.token,
      projectId,
      flowId,
      limit: 10,
    });
    const latestRun = triggeredRun ||
      getLatestSuccessfulPublishTestRun(runs) ||
      (runtimeError ? null : getLatestTerminalPublishTestRun(runs));
    const result = buildRuntimePublishTestResult({
      flow,
      contract,
      template,
      latestRun,
      requireRuntimeRun: !runtimeError,
    });
    const token = result.status === 'passed'
      ? createPublishTestToken({ userEmail: authUser.email, projectId, flow, run: result.latestRun })
      : null;

    return NextResponse.json({
      success: result.status === 'passed',
      result,
      publishTestToken: token,
    }, { status: result.status === 'passed' ? 200 : 422 });
  } catch (error) {
    console.error('[Activepieces Publish Test] Failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to run publish test',
    }, { status: 500 });
  }
}
