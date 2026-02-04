import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { id: automationId } = params;
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

    // Update user_automations: set is_active = true and save config
    const { error: updateError } = await supabase
      .from('user_automations')
      .update({
        is_active: true,
        parameters: config,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('automation_id', automationId);

    if (updateError) {
      console.error('[activate-background] Error:', updateError);
      return NextResponse.json({ error: 'Failed to activate background execution' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Background execution activated successfully',
      automation_name: automation.name
    });

  } catch (error) {
    console.error('[activate-background] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
