import { NextResponse } from 'next/server';
import { userDB } from '@/lib/db/supabase-db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/auth/google/get-tokens?email=user@example.com
 * Retrieves stored Google OAuth tokens for testing
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required. Usage: /api/auth/google/get-tokens?email=your@email.com' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await userDB.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found with that email' },
        { status: 404 }
      );
    }

    // Get Google automations for this user
    const { data: automations, error } = await supabase
      .from('user_automations')
      .select(`
        id,
        automation_id,
        provider,
        access_token,
        refresh_token,
        token_expiry,
        is_active,
        created_at,
        updated_at,
        automations (
          name,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('provider', 'google');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch Google automations', details: error.message },
        { status: 500 }
      );
    }

    if (!automations || automations.length === 0) {
      return NextResponse.json(
        { 
          error: 'No Google automations found for this user',
          message: 'Please connect Google through an automation setup first'
        },
        { status: 404 }
      );
    }

    // Check token expiry for each automation
    const now = new Date();
    const automationsWithStatus = automations.map(automation => {
      const expiresAt = automation.token_expiry ? new Date(automation.token_expiry) : null;
      const isExpired = expiresAt ? expiresAt <= now : false;
      
      return {
        automation_id: automation.automation_id,
        automation_name: automation.automations?.name || 'Unknown',
        automation_description: automation.automations?.description || '',
        provider: automation.provider,
        has_access_token: !!automation.access_token,
        has_refresh_token: !!automation.refresh_token,
        token_expiry: automation.token_expiry,
        is_expired: isExpired,
        is_active: automation.is_active,
        time_until_expiry: expiresAt ? Math.floor((expiresAt - now) / 1000) + ' seconds' : 'unknown',
        created_at: automation.created_at,
        updated_at: automation.updated_at,
      };
    });

    // Return the tokens
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      google_automations: automationsWithStatus,
      total_count: automationsWithStatus.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to retrieve tokens',
        details: error.message,
      },
      { status: 500 }
    );
  }
}


