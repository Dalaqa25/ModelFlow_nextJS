import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];

function isAdminEmail(email) {
  return Boolean(email && ADMIN_EMAILS.includes(email));
}

export async function POST(_request, { params }) {
  try {
    const user = await getSupabaseUser();
    if (!isAdminEmail(user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('automations')
      .update({ is_active: true })
      .eq('id', id)
      .select('id, name, is_active')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      automation: data,
    });
  } catch (error) {
    console.error('[Admin Automation Approve] Error:', error);
    return NextResponse.json({
      error: 'Failed to approve automation',
      message: error.message,
    }, { status: 500 });
  }
}
