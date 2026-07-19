import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { userDB } from '@/lib/db/supabase-db';

export const dynamic = 'force-dynamic';

function sanitizeLimit(value) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return 8;
  return Math.min(Math.max(parsed, 1), 20);
}

function isInternalOrSmokeAutomation(automation = {}) {
  const name = String(automation.name || '').toLowerCase();
  const description = String(automation.description || '').toLowerCase();
  const workflow = automation.workflow && typeof automation.workflow === 'object'
    ? automation.workflow
    : {};

  if (workflow.internal === true || workflow.modelgrow_internal === true || workflow.hidden === true) {
    return true;
  }

  return [
    'smoke test',
    'activepieces bridge smoke',
    'modelgrow activepieces bridge',
  ].some((needle) => name.includes(needle) || description.includes(needle));
}

export async function GET(request) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = sanitizeLimit(searchParams.get('limit'));
    const status = searchParams.get('status') || 'all';

    const supabase = createAdminClient();
    const dbUser = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });

    const candidateUserIds = Array.from(new Set([authUser.id, dbUser?.id].filter(Boolean)));

    let query = supabase
      .from('user_automations')
      .select(`
        id,
        automation_id,
        parameters,
        is_active,
        last_run_at,
        created_at,
        updated_at,
        automations (
          id,
          name,
          description,
          workflow,
          token_cost,
          activepieces_source_flow_id
        )
      `)
      .in('user_id', candidateUserIds)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'paused') {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    const { data: runtimeFlows, error: runtimeError } = await supabase
      .from('activepieces_runtime_flows')
      .select('id, automation_id, status, activepieces_flow_id, activepieces_project_id, created_at, updated_at')
      .eq('user_id', dbUser.id)
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false });

    if (runtimeError) throw runtimeError;

    const runtimeAutomationIds = Array.from(new Set(
      (runtimeFlows || []).map((flow) => flow.automation_id).filter(Boolean)
    ));

    let runtimeAutomationById = new Map();
    if (runtimeAutomationIds.length > 0) {
      const { data: runtimeAutomations, error: automationError } = await supabase
        .from('automations')
        .select('id, name, description, workflow, token_cost, activepieces_source_flow_id')
        .in('id', runtimeAutomationIds);

      if (automationError) throw automationError;
      runtimeAutomationById = new Map((runtimeAutomations || []).map((automation) => [automation.id, automation]));
    }

    const byAutomationId = new Map();

    for (const item of data || []) {
      if (!item.automation_id) continue;
      byAutomationId.set(item.automation_id, {
        id: item.id,
        automation_id: item.automation_id,
        name: item.automations?.name || 'Automation',
        description: item.automations?.description || '',
        workflow: item.automations?.workflow || null,
        enabled: Boolean(item.is_active),
        runtime_status: null,
        last_run_at: item.last_run_at || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        engine: item.automations?.activepieces_source_flow_id ? 'activepieces' : 'n8n-native',
        token_cost: item.automations?.token_cost || 0,
      });
    }

    for (const flow of runtimeFlows || []) {
      if (!flow.automation_id) continue;
      const automation = runtimeAutomationById.get(flow.automation_id);
      const existing = byAutomationId.get(flow.automation_id);

      byAutomationId.set(flow.automation_id, {
        id: existing?.id || flow.id,
        automation_id: flow.automation_id,
        name: existing?.name || automation?.name || 'Automation',
        description: existing?.description || automation?.description || '',
        workflow: existing?.workflow || automation?.workflow || null,
        enabled: flow.status === 'active' || Boolean(existing?.enabled),
        runtime_status: flow.status,
        last_run_at: existing?.last_run_at || null,
        created_at: existing?.created_at || flow.created_at,
        updated_at: flow.updated_at || existing?.updated_at,
        engine: automation?.activepieces_source_flow_id ? 'activepieces' : existing?.engine || 'activepieces',
        token_cost: existing?.token_cost || automation?.token_cost || 0,
      });
    }

    const automations = Array.from(byAutomationId.values())
      .filter((automation) => !isInternalOrSmokeAutomation(automation))
      .sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
      })
      .slice(0, limit)
      .map(({ workflow, ...automation }) => automation);

    return NextResponse.json({ automations });
  } catch (error) {
    console.error('[GET /api/user/automations] Failed', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load user automations' },
      { status: error.status || 500 }
    );
  }
}
