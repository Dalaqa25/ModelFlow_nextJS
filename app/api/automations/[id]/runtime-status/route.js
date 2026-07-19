import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { userDB } from '@/lib/db/supabase-db';
import { createAdminClient } from '@/lib/db/supabase-server';
import { getActivepiecesRuntimeStatus } from '@/lib/activepieces/runtime-status';
import { ensureRuntimeFlowForAutomation } from '@/lib/activepieces/provisioning';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: automationId } = await params;
    const supabase = createAdminClient();
    const user = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });

    const status = await getActivepiecesRuntimeStatus({
      supabase,
      user,
      automationId,
      limit: 20,
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('[Runtime Status] Failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to load automation runtime status',
    }, { status: error.status || 500 });
  }
}

export async function POST(_request, { params }) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: automationId } = await params;
    const supabase = createAdminClient();
    const user = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });

    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, is_active, name, workflow, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
      .eq('id', automationId)
      .maybeSingle();

    if (automationError) throw automationError;

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (!automation.activepieces_source_flow_id) {
      return NextResponse.json({ error: 'This automation is not powered by ModelGrow Builder.' }, { status: 400 });
    }

    await ensureRuntimeFlowForAutomation({
      supabase,
      user,
      automation,
    });

    const status = await getActivepiecesRuntimeStatus({
      supabase,
      user,
      automationId,
      limit: 20,
    });

    return NextResponse.json({
      ...status,
      repairedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Runtime Status Repair] Failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to repair automation runtime',
    }, { status: error.status || 500 });
  }
}
