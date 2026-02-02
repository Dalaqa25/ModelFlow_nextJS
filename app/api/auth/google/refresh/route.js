import { NextResponse } from 'next/server';
import { getValidGoogleAccessToken } from '@/lib/auth/google-oauth';
import { userDB } from '@/lib/db/supabase-db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/auth/google/refresh
 * Refreshes Google access token for a user
 * 
 * Body: { email: string }
 * Returns: { success: boolean, access_token: string, token_expiry: string }
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await userDB.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get valid access token (will refresh if needed)
    const accessToken = await getValidGoogleAccessToken(user.id);

    // Get updated integration to get token_expiry
    const { data: integration } = await supabase
      .from('user_automations')
      .select('token_expiry')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .not('access_token', 'is', null)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      access_token: accessToken,
      token_expiry: integration?.token_expiry || null,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to refresh token',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/google/refresh?email=user@example.com
 * Alternative endpoint using query parameter
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await userDB.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get valid access token (will refresh if needed)
    const accessToken = await getValidGoogleAccessToken(user.id);

    // Get updated integration to get token_expiry
    const { data: integration } = await supabase
      .from('user_automations')
      .select('token_expiry')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .not('access_token', 'is', null)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      access_token: accessToken,
      token_expiry: integration?.token_expiry || null,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to refresh token',
        details: error.message,
      },
      { status: 500 }
    );
  }
}


