import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];

function isAdminEmail(email) {
  return Boolean(email && ADMIN_EMAILS.includes(email));
}

function normalizeReason(value) {
  const reason = String(value || '').trim();
  return reason || 'No reason provided';
}

export async function POST(request, { params }) {
  try {
    const user = await getSupabaseUser();
    if (!isAdminEmail(user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = normalizeReason(body?.reason);
    const rejectedAt = new Date().toISOString();
    const supabase = createAdminClient();

    const { data: existing, error: existingError } = await supabase
      .from('automations')
      .select('id, name, author_email, workflow')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    const nextWorkflow = {
      ...(existing.workflow || {}),
      review_status: 'rejected',
      rejected_by: user.email,
      rejected_at: rejectedAt,
      rejection_reason: reason,
    };

    const { data, error } = await supabase
      .from('automations')
      .update({
        is_active: false,
        workflow: nextWorkflow,
      })
      .eq('id', id)
      .select('id, name, author_email, is_active, workflow')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (existing.author_email) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_email: existing.author_email,
          type: 'model_rejection',
          title: 'Automation rejected',
          message: `"${existing.name}" was rejected. Reason: ${reason}`,
          read: false,
        });

      if (notificationError) {
        console.warn('[Admin Automation Reject] Notification failed:', notificationError.message);
      }
    }

    return NextResponse.json({
      success: true,
      automation: {
        ...data,
        review_status: 'rejected',
      },
    });
  } catch (error) {
    console.error('[Admin Automation Reject] Error:', error);
    return NextResponse.json({
      error: 'Failed to reject automation',
      message: error.message,
    }, { status: 500 });
  }
}
