import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to execute automations' },
        { status: 401 }
      );
    }

    const { automation_id, config } = await req.json();

    console.log('📥 Received execution request:', { automation_id, config });

    if (!automation_id || !config) {
      return NextResponse.json(
        { error: 'automation_id and config are required' },
        { status: 400 }
      );
    }

    // Validate automation_id is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(automation_id)) {
      console.error('❌ Invalid automation_id format:', automation_id);
      return NextResponse.json(
        { error: `Invalid automation ID format. Expected UUID, got: ${automation_id}` },
        { status: 400 }
      );
    }

    // 1. Get the automation from database
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automation_id)
      .single();

    if (automationError || !automation) {
      console.error('❌ Automation not found:', { automation_id, error: automationError });
      
      // Check if any automations exist at all
      const { data: allAutomations, error: listError } = await supabase
        .from('automations')
        .select('id, name')
        .limit(5);
      
      console.log('📋 Available automations:', allAutomations);
      
      return NextResponse.json(
        { 
          error: 'Automation not found. It may have been deleted or you may need to upload it first.',
          automation_id,
          available_count: allAutomations?.length || 0
        },
        { status: 404 }
      );
    }

    // 2. Get user's Google tokens from user_integrations
    console.log('🔍 Looking for integration with user_id:', user.id, 'email:', user.email);
    
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    console.log('📊 Integration query result:', { 
      found: !!integration, 
      error: integrationError?.message,
      integration_user_id: integration?.user_id 
    });

    if (integrationError || !integration) {
      // Check if integration exists for a different user with same email
      const { data: allIntegrations } = await supabase
        .from('user_integrations')
        .select('user_id, provider_email')
        .eq('provider', 'google')
        .limit(5);
      
      console.log('🔍 All Google integrations:', allIntegrations);
      
      return NextResponse.json(
        { 
          error: 'Google account not connected. Please connect your Google account first.', 
          debug: { 
            current_user_id: user.id,
            current_user_email: user.email,
            error: integrationError?.message,
            hint: 'Try disconnecting and reconnecting your Google account'
          } 
        },
        { status: 400 }
      );
    }

    // 3. Replace placeholders in workflow with user's config AND developer keys
    let workflowString = JSON.stringify(automation.workflow);
    
    // Inject user-provided config (like SHEET_ID, SHEET_NAME)
    Object.entries(config).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      workflowString = workflowString.replaceAll(placeholder, value);
    });

    // Inject developer keys (like OPENAI_API_KEY, OPENROUTER_API_KEY)
    if (automation.developer_keys && typeof automation.developer_keys === 'object') {
      console.log('🔑 Injecting developer keys:', Object.keys(automation.developer_keys));
      Object.entries(automation.developer_keys).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        workflowString = workflowString.replaceAll(placeholder, value);
      });
    }

    const configuredWorkflow = JSON.parse(workflowString);

    // 4. Send to Node.js automation runner
    const runnerResponse = await fetch('http://localhost:3001/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow: configuredWorkflow,
        initialData: {
          user_email: user.email
        },
        tokens: {
          access_token: integration.access_token,
          refresh_token: integration.refresh_token,
          expires_at: integration.expires_at
        },
        tokenMapping: {
          access_token: "googleAccessToken",
          refresh_token: "googleRefreshToken"
        },
        // Send developer keys to runner (for n8n credentials)
        developerKeys: automation.developer_keys || {}
      }),
    });

    if (!runnerResponse.ok) {
      const errorData = await runnerResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Automation runner failed', details: errorData },
        { status: 500 }
      );
    }

    const result = await runnerResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Automation executed successfully',
      result: result
    });

  } catch (error) {
    console.error('Automation execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute automation', message: error.message },
      { status: 500 }
    );
  }
}
