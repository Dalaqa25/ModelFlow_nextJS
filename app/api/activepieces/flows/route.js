import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { userDB } from '@/lib/db/supabase-db';
import { createAdminClient } from '@/lib/db/supabase-server';
import { getActivepiecesBrowserAuthForModelGrowUser } from '@/lib/activepieces/provisioning';
import { isActivepiecesConfigured, listFlows } from '@/lib/activepieces/client';

export const dynamic = 'force-dynamic';

function normalizeFlows(response) {
  const flows = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];

  return flows.map((flow) => ({
    id: flow.id,
    displayName: flow.displayName || flow.version?.displayName || 'Untitled flow',
    status: flow.status || flow.version?.status || null,
    created: flow.created || null,
    updated: flow.updated || null,
    publishedVersionId: flow.publishedVersionId || null,
  })).filter((flow) => flow.id);
}

export async function GET() {
  const authUser = await getSupabaseUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isActivepiecesConfigured()) {
    return NextResponse.json({ error: 'Activepieces is not configured' }, { status: 500 });
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

    return NextResponse.json({
      projectId,
      flows: normalizeFlows(response),
    });
  } catch (error) {
    console.error('[Activepieces Flows] Failed to list flows:', error);
    return NextResponse.json({
      error: error.message || 'Failed to list builder flows',
    }, { status: 500 });
  }
}
