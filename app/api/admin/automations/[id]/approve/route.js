import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { certifyNativeAutomation } from '@/lib/automation-runtime/client';

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
    const { data: existing, error: existingError } = await supabase
      .from('automations')
      .select('id, name, workflow')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    const isBuilderWorkflow = existing.workflow?.engine === 'activepieces';
    if (isBuilderWorkflow && existing.workflow?.publish_test?.status !== 'passed') {
      return NextResponse.json({
        error: 'This automation cannot be approved until its required builder publish test passes.',
        reason: 'missing_passed_publish_test',
      }, { status: 409 });
    }

    if (!isBuilderWorkflow && existing.workflow?.review_sandbox?.status !== 'passed') {
      return NextResponse.json({
        error: 'Run the required Review Sandbox test successfully before approving this automation.',
        reason: 'missing_passed_review_sandbox',
      }, { status: 409 });
    }

    let certification = null;
    if (!isBuilderWorkflow) {
      const result = await certifyNativeAutomation({ automationId: id });
      certification = result.certification;
      if (certification?.status !== 'passed') {
        return NextResponse.json({
          error: `Certification failed: ${certification?.summary?.failed || 0} of 6 checks need attention.`,
          reason: 'native_n8n_certification_failed',
          certification,
        }, { status: 409 });
      }
    }

    const { data, error } = await supabase
      .from('automations')
      .update({
        is_active: true,
        workflow: {
          ...(existing.workflow || {}),
          ...(certification ? { modelgrow_certification: certification } : {}),
          review_status: 'approved',
          approved_by: user.email,
          approved_at: new Date().toISOString(),
        },
      })
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
