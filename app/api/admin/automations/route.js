import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { syncActivepiecesSourceAvailability } from '@/lib/activepieces/source-sync';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];

function isAdminEmail(email) {
  return Boolean(email && ADMIN_EMAILS.includes(email));
}

function normalizeStatus(value) {
  if (value === 'active' || value === 'pending' || value === 'rejected') return value;
  return 'all';
}

function getReviewStatus(automation) {
  if (automation?.workflow?.review_status === 'rejected') return 'rejected';
  if (automation?.is_active) return 'active';
  return 'pending';
}

export async function GET(request) {
  try {
    const user = await getSupabaseUser();
    if (!isAdminEmail(user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = normalizeStatus(searchParams.get('status'));
    const supabase = createAdminClient();

    let query = supabase
      .from('automations')
      .select(`
        id,
        name,
        description,
        author_email,
        token_cost,
        required_connectors,
        required_inputs,
        is_active,
        total_runs,
        created_at,
        workflow,
        activepieces_source_project_id,
        activepieces_source_flow_id,
        activepieces_trigger_type
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data, error } = await query;
    if (error) throw error;

    const synced = await syncActivepiecesSourceAvailability({ supabase, automations: data || [] });
    const automationsWithStatus = synced.map((automation) => ({
      ...automation,
      review_status: getReviewStatus(automation),
    }));
    const automations = automationsWithStatus.filter((automation) => {
      if (status === 'all') return true;
      return automation.review_status === status;
    });

    return NextResponse.json({
      automations,
      counts: {
        total: automationsWithStatus.length,
        active: automationsWithStatus.filter((automation) => automation.review_status === 'active').length,
        pending: automationsWithStatus.filter((automation) => automation.review_status === 'pending').length,
        rejected: automationsWithStatus.filter((automation) => automation.review_status === 'rejected').length,
      },
    });
  } catch (error) {
    console.error('[Admin Automations GET] Error:', error);
    return NextResponse.json({
      error: 'Failed to load automations',
      message: error.message,
    }, { status: 500 });
  }
}
