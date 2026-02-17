import { NextResponse } from 'next/server';
import { refreshTikTokAccessToken } from '@/lib/auth/tiktok-oauth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, automationId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the refresh token from database
    const query = supabase
      .from('user_automations')
      .select('refresh_token, automation_id')
      .eq('user_id', userId)
      .eq('provider', 'tiktok')
      .not('refresh_token', 'is', null);

    if (automationId) {
      query.eq('automation_id', automationId);
    }

    const { data: integration, error: fetchError } = await query.maybeSingle();

    if (fetchError || !integration) {
      return NextResponse.json({ 
        error: 'TikTok integration not found' 
      }, { status: 404 });
    }

    // Refresh the token
    const { access_token, refresh_token, expires_in } = await refreshTikTokAccessToken(
      integration.refresh_token
    );

    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Update the token in database
    const updateQuery = supabase
      .from('user_automations')
      .update({
        access_token,
        refresh_token: refresh_token || integration.refresh_token,
        token_expiry: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'tiktok');

    if (automationId) {
      updateQuery.eq('automation_id', automationId);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update token',
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      access_token,
      expires_at: newExpiresAt
    });

  } catch (error) {
    console.error('TikTok token refresh error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh TikTok token',
      details: error.message 
    }, { status: 500 });
  }
}
