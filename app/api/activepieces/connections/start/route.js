import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { userDB } from '@/lib/db/supabase-db';
import { isActivepiecesConfigured } from '@/lib/activepieces/client';
import { prepareActivepiecesConnectionStart } from '@/lib/activepieces/connections';

export const dynamic = 'force-dynamic';

async function getAutomationOrThrow(supabase, automationId) {
  const { data, error } = await supabase
    .from('automations')
    .select('id, name, required_connectors, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
    .eq('id', automationId)
    .single();

  if (error || !data) {
    const notFound = new Error('Automation not found');
    notFound.status = 404;
    throw notFound;
  }

  if (!data.activepieces_source_flow_id) {
    const invalid = new Error('Automation is not powered by Activepieces');
    invalid.status = 400;
    throw invalid;
  }

  return data;
}

export async function POST(request) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isActivepiecesConfigured()) {
      return NextResponse.json({ error: 'Activepieces is not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const automationId = String(body?.automationId || body?.automation_id || '').trim();
    const externalId = body?.externalId ? String(body.externalId).trim() : null;

    if (!automationId) {
      return NextResponse.json({ error: 'automationId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const user = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });
    const automation = await getAutomationOrThrow(supabase, automationId);
    const result = await prepareActivepiecesConnectionStart({ supabase, user, automation, externalId });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Activepieces Connection Start] Failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to start Activepieces connection',
    }, { status: error.status || 500 });
  }
}
