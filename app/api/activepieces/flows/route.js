import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { userDB } from '@/lib/db/supabase-db';
import { createAdminClient } from '@/lib/db/supabase-server';
import { getActivepiecesBrowserAuthForModelGrowUser } from '@/lib/activepieces/provisioning';
import { isActivepiecesConfigured, listFlows } from '@/lib/activepieces/client';
import {
  getFlowDisplayName,
  getSourceFlowBlockMessage,
  getSourceFlowBlockReason,
  isModelGrowRuntimeFlow,
} from '@/lib/activepieces/flow-guards';

export const dynamic = 'force-dynamic';

function normalizeFlows(response, existingByFlowId = new Map()) {
  const flows = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];

  return flows.filter((flow) => !isModelGrowRuntimeFlow(flow)).map((flow) => {
    const publishBlockReason = getSourceFlowBlockReason(flow);
    const existing = existingByFlowId.get(flow.id) || null;
    const existingBlockMessage = existing
      ? 'This builder flow is already published in ModelGrow. Open the existing listing instead of publishing it again.'
      : '';
    return {
    id: flow.id,
    displayName: getFlowDisplayName(flow),
    status: flow.status || flow.version?.status || null,
    created: flow.created || null,
    updated: flow.updated || null,
    publishedVersionId: flow.publishedVersionId || null,
    publishedToModelGrow: Boolean(existing),
    modelgrowAutomationId: existing?.id || null,
    modelgrowIsActive: existing?.is_active ?? null,
    publishable: !existing && !publishBlockReason,
    publishBlockReason: existing ? 'already_published' : publishBlockReason,
    publishBlockMessage: existingBlockMessage || getSourceFlowBlockMessage(publishBlockReason),
  };
  }).filter((flow) => flow.id);
}

export async function GET() {
  const authUser = await getSupabaseUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isActivepiecesConfigured()) {
    return NextResponse.json({ error: 'ModelGrow Builder is not configured' }, { status: 500 });
  }

  try {
    const supabase = createAdminClient();
    const user = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });

    const { link, authResponse } = await getActivepiecesBrowserAuthForModelGrowUser({ supabase, user });
    const projectId = authResponse.projectId || link.activepieces_project_id;
    const response = await listFlows({
      token: authResponse.token,
      projectId,
      limit: 100,
    });
    const rawFlows = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];
    const flowIds = rawFlows.map((flow) => flow?.id).filter(Boolean);
    let existingByFlowId = new Map();

    if (flowIds.length > 0) {
      const { data: existingAutomations, error: existingError } = await supabase
        .from('automations')
        .select('id, activepieces_source_flow_id, is_active')
        .eq('author_email', authUser.email)
        .eq('activepieces_source_project_id', projectId)
        .in('activepieces_source_flow_id', flowIds);

      if (existingError) throw existingError;
      existingByFlowId = new Map(
        (existingAutomations || []).map((automation) => [automation.activepieces_source_flow_id, automation])
      );
    }

    return NextResponse.json({
      projectId,
      flows: normalizeFlows(response, existingByFlowId),
    });
  } catch (error) {
    console.error('[Activepieces Flows] Failed to list flows:', error);
    return NextResponse.json({
      error: error.message || 'Failed to list builder flows',
    }, { status: 500 });
  }
}
