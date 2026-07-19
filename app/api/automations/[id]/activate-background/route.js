import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { activateNativeAutomation } from '@/lib/automation-runtime/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { id: automationId } = await params;
    const { config } = await request.json();

    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the automation exists and requires background
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, requires_background')
      .eq('id', automationId)
      .single();

    if (automationError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (!automation.requires_background) {
      return NextResponse.json({ error: 'This automation does not require background execution' }, { status: 400 });
    }

    // The native runtime owns activation and updates is_active only after n8n
    // has successfully provisioned the persistent workflow. Never claim an
    // automation is active based on a database flag alone.
    const activation = await activateNativeAutomation({
      automationId,
      userId: user.id,
      config,
    });

    return NextResponse.json({
      success: true,
      message: 'Background execution activated successfully',
      automation_name: automation.name,
      engine: activation.engine,
      native_workflow_id: activation.native_workflow_id,
    });

  } catch (error) {
    console.error('[activate-background] Exception:', error);
    return NextResponse.json({
      error: 'Failed to activate background execution',
      message: error.message,
    }, { status: error.status || 500 });
  }
}
