import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const automationId = searchParams.get('automation_id');

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from('user_automations')
      .select('access_token, refresh_token, token_expiry, provider')
      .eq('user_id', userId)
      .eq('provider', 'google');

    // If automation_id is provided, filter by it
    if (automationId) {
      query = query.eq('automation_id', automationId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ 
        error: "No Google tokens found for this user" + (automationId ? " and automation" : "")
      }, { status: 404 });
    }

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expiry: data.token_expiry
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
