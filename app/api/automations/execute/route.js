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

    // Send minimal data to automation runner
    // Runner will fetch workflow, developer_keys, and user tokens from database
    
    // Convert config keys to lowercase for webhook body compatibility
    // (Database stores TIKTOK_URL, but workflow expects tiktok_url)
    const lowercaseConfig = {};
    Object.entries(config).forEach(([key, value]) => {
      lowercaseConfig[key.toLowerCase()] = value;
    });
    
    const runnerPayload = {
      automation_id,
      user_id: user.id,
      config: lowercaseConfig
    };

    const runnerResponse = await fetch('http://localhost:3001/api/automations/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runnerPayload),
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
    return NextResponse.json(
      { error: 'Failed to execute automation', message: error.message },
      { status: 500 }
    );
  }
}
