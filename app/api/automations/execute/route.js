import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    let user = await getSupabaseUser();
    console.log('[EXECUTE DEBUG] getSupabaseUser result:', user ? 'found' : 'null');

    // For internal server-to-server calls (from AI stream), user_id may be passed directly
    const body = await req.json();
    const { automation_id, config, user_id } = body;
    console.log('[EXECUTE DEBUG] Body received:', { automation_id, user_id, hasConfig: !!config });

    // If no session but user_id provided (internal call), validate and use it
    if (!user && user_id) {
      console.log('[EXECUTE DEBUG] No session, trying user_id fallback:', user_id);
      // Verify the user exists in database
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', user_id)
        .single();

      console.log('[EXECUTE DEBUG] User lookup result:', { profile, error });

      if (profile) {
        user = { id: profile.id, email: profile.email };
        console.log('[EXECUTE DEBUG] User set from DB:', user);
      }
    }

    if (!user) {
      console.log('[EXECUTE DEBUG] FINAL: No user, returning 401');
      return NextResponse.json(
        { error: 'You must be logged in to execute automations' },
        { status: 401 }
      );
    }

    console.log('[EXECUTE DEBUG] Auth OK, proceeding with user:', user.id);

    // Validate inputs
    if (!automation_id || !config) {
      return NextResponse.json(
        { error: 'automation_id and config are required' },
        { status: 400 }
      );
    }

    // Validate automation_id is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(automation_id)) {
      return NextResponse.json(
        { error: 'Invalid automation ID format' },
        { status: 400 }
      );
    }

    // Fetch automation details to check if it requires background processing
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, requires_background')
      .eq('id', automation_id)
      .single();

    if (automationError || !automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    console.log('[EXECUTE DEBUG] Automation type:', automation.requires_background ? 'Background (Continuous)' : 'On-Demand (Run Once)');

    // Convert config keys to lowercase for webhook body compatibility
    // (Database stores TIKTOK_URL, but workflow expects tiktok_url)
    const lowercaseConfig = {};
    Object.entries(config).forEach(([key, value]) => {
      lowercaseConfig[key.toLowerCase()] = value;
    });

    // Fetch user's Google OAuth tokens from user_automations
    const { data: integration } = await supabase
      .from('user_automations')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', user.id)
      .eq('automation_id', automation_id)
      .eq('provider', 'google')
      .maybeSingle();

    // If user has Google integration, add access_token to config
    // This allows workflows to use HTTP Request nodes with Bearer tokens
    if (integration?.access_token) {
      console.log('[EXECUTE DEBUG] Adding Google access_token to workflow payload');
      lowercaseConfig.access_token = integration.access_token;
      
      // Also add refresh_token in case workflow needs to refresh
      if (integration.refresh_token) {
        lowercaseConfig.refresh_token = integration.refresh_token;
      }
    }

    const runnerPayload = {
      automation_id,
      user_id: user.id,
      config: lowercaseConfig
    };

    const startTime = Date.now();

    const runnerResponse = await fetch('http://localhost:3001/api/automations/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runnerPayload),
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    if (!runnerResponse.ok) {
      const errorData = await runnerResponse.json().catch(() => ({}));

      // Log failed execution
      await supabase.from('automation_executions').insert({
        automation_id,
        executed_by: user.email,
        status: 'failed',
        credits_used: 0,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date(endTime).toISOString(),
        duration_ms: durationMs,
        error_message: errorData.error || 'Automation runner failed'
      });

      return NextResponse.json(
        { error: 'Automation runner failed', details: errorData },
        { status: 500 }
      );
    }

    const result = await runnerResponse.json();

    // SCENARIO 1: On-Demand (Run Once) - Just execute, don't save config
    // SCENARIO 2: Background (Continuous) - Save config for recurring execution
    if (automation.requires_background) {
      console.log('[EXECUTE DEBUG] Background automation - saving config to automation_instances');
      
      await supabase
        .from('automation_instances')
        .upsert({
          automation_id,
          user_id: user.id,
          config: lowercaseConfig,
          enabled: true,
          last_run: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'automation_id,user_id' // Update if already exists
        });
    } else {
      console.log('[EXECUTE DEBUG] On-demand automation - config not saved (run once)');
    }

    // Log successful execution and increment total_runs
    await supabase.from('automation_executions').insert({
      automation_id,
      executed_by: user.email,
      status: 'success',
      credits_used: result.credits_used || 0,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date(endTime).toISOString(),
      duration_ms: durationMs,
      error_message: null
    });

    // Increment total_runs on the automation
    await supabase.rpc('increment_total_runs', { automation_uuid: automation_id });

    return NextResponse.json({
      success: true,
      message: 'Automation executed successfully',
      result: result
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute automation', message: error.message },
      { status: 500 }
    );
  }
}
