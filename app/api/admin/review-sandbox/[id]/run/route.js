import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { certifyNativeAutomation } from '@/lib/automation-runtime/client';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];

export async function POST(_request, { params }) {
  const user = await getSupabaseUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { data: automation, error } = await supabase
    .from('automations')
    .select('id,name,workflow,is_active')
    .eq('id', id)
    .single();
  if (error || !automation) return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
  if (automation.is_active) return NextResponse.json({ error: 'Only pending automations can be sandbox-tested.' }, { status: 409 });

  let workflow = automation.workflow;
  if (typeof workflow === 'string') {
    try { workflow = JSON.parse(workflow); } catch { workflow = {}; }
  }
  if (workflow?.engine === 'activepieces') {
    return NextResponse.json({ error: 'Builder workflows use the separate publish-test gate.' }, { status: 409 });
  }

  const startedAt = new Date().toISOString();
  try {
    const result = await certifyNativeAutomation({ automationId: id });
    const certification = result.certification || null;
    const sandbox = {
      status: certification?.status === 'passed' ? 'passed' : 'failed',
      reviewer: user.email,
      startedAt,
      completedAt: new Date().toISOString(),
      mode: 'safe-certification',
      certification,
    };
    const { error: updateError } = await supabase.from('automations').update({
      workflow: { ...workflow, review_sandbox: sandbox },
    }).eq('id', id);
    if (updateError) throw updateError;
    return NextResponse.json({ success: sandbox.status === 'passed', sandbox });
  } catch (error) {
    const sandbox = {
      status: 'failed', reviewer: user.email, startedAt,
      completedAt: new Date().toISOString(), mode: 'safe-certification',
      error: error.message, code: error.code || 'SANDBOX_CERTIFICATION_FAILED',
    };
    await supabase.from('automations').update({ workflow: { ...workflow, review_sandbox: sandbox } }).eq('id', id);
    return NextResponse.json({ success: false, sandbox, error: error.message }, { status: 422 });
  }
}
