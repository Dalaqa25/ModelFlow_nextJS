import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { certifyNativeAutomation } from '@/lib/automation-runtime/client';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];

export async function POST(_request, { params }) {
  try {
    const user = await getSupabaseUser();
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await certifyNativeAutomation({ automationId: id });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin Automation Certification] Error:', error);
    return NextResponse.json({
      error: error.message || 'Certification failed',
      code: error.code || 'AUTOMATION_CERTIFICATION_FAILED',
      details: error.data || null,
    }, { status: error.status && error.status >= 400 ? error.status : 500 });
  }
}
