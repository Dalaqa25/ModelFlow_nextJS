import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { userDB } from '@/lib/db/supabase-db';
import { createAdminClient } from '@/lib/db/supabase-server';
import { getActivepiecesBrowserAuthForModelGrowUser } from '@/lib/activepieces/provisioning';
import { getFlow, getFlowTemplate, isActivepiecesConfigured } from '@/lib/activepieces/client';
import { analyzeActivepiecesWorkflow } from '@/lib/activepieces/workflow-analyzer';
import {
  getFlowDisplayName,
  getSourceFlowBlockMessage,
  getSourceFlowBlockReason,
} from '@/lib/activepieces/flow-guards';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const authUser = await getSupabaseUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isActivepiecesConfigured()) {
    return NextResponse.json({ error: 'ModelGrow Builder is not configured' }, { status: 500 });
  }

  try {
    const { flowId } = await request.json();
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
      return NextResponse.json({ error: 'Builder flow not found' }, { status: 404 });
    }
    const blockReason = getSourceFlowBlockReason(flow);
    if (blockReason) {
      return NextResponse.json({
        error: getSourceFlowBlockMessage(blockReason),
        reason: blockReason,
      }, { status: blockReason === 'runtime_copy' ? 403 : 409 });
    }

    const template = await getFlowTemplate({ token: authResponse.token, flowId, projectId });
    const contract = await analyzeActivepiecesWorkflow({
      template,
      token: authResponse.token,
      projectId,
    });

    return NextResponse.json({
      flow: {
        id: flow.id,
        displayName: getFlowDisplayName(flow),
      },
      contract,
    });
  } catch (error) {
    console.error('[Activepieces Analyze] Failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to analyze builder flow',
    }, { status: 500 });
  }
}
