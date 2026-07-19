import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { activateNativeAutomation } from '@/lib/automation-runtime/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Activate an automation for a user
 * Marks the automation as active with the provided parameters
 */
export async function POST(req) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId, parameters } = await req.json();

    if (!automationId) {
      return NextResponse.json(
        { error: 'automationId is required' },
        { status: 400 }
      );
    }

    // Fetch the automation template from database
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, activepieces_source_flow_id')
      .eq('id', automationId)
      .single();

    if (automationError || !automation) {
      return NextResponse.json(
        { error: 'Automation template not found' },
        { status: 404 }
      );
    }

    if (automation.activepieces_source_flow_id) {
      return NextResponse.json({
        error: 'ModelGrow Builder automations are activated through their isolated setup flow',
      }, { status: 400 });
    }

    // Persist setup data as inactive first. The native runtime is the only
    // component allowed to flip is_active after n8n activation succeeds.
    const { error: upsertError } = await supabase
      .from('user_automations')
      .upsert({
        user_id: user.id,
        automation_id: automationId,
        parameters: parameters || {},
        provider: 'activepieces-bridge',
        is_active: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,automation_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Failed to activate automation:', upsertError);
      return NextResponse.json(
        { error: 'Failed to activate automation' },
        { status: 500 }
      );
    }

    const activation = await activateNativeAutomation({
      automationId,
      userId: user.id,
      config: parameters || {},
    });

    return NextResponse.json({
      success: true,
      message: 'Automation activated successfully!',
      automationName: automation.name,
      engine: activation.engine,
      native_workflow_id: activation.native_workflow_id,
    });

  } catch (error) {
    console.error('Error activating automation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate automation' },
      { status: 500 }
    );
  }
}
