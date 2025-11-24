import { NextResponse } from 'next/server';
import { getValidGoogleAccessToken } from '@/lib/google-oauth';
import { userDB } from '@/lib/db/supabase-db';

/**
 * POST /api/auth/google/refresh
 * Refreshes Google access token for a user
 * 
 * Body: { email: string }
 * Returns: { success: boolean, access_token: string, expires_at: string }
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

    // Get updated integration to get expires_at
    const { userIntegrationDB } = await import('@/lib/db/supabase-db');
    const integration = await userIntegrationDB.getIntegrationByUserAndProvider(
      user.id,
      'google'
    );

    return NextResponse.json({
      success: true,
      access_token: accessToken,
      expires_at: integration?.expires_at || null,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
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

    // Get updated integration to get expires_at
    const { userIntegrationDB } = await import('@/lib/db/supabase-db');
    const integration = await userIntegrationDB.getIntegrationByUserAndProvider(
      user.id,
      'google'
    );

    return NextResponse.json({
      success: true,
      access_token: accessToken,
      expires_at: integration?.expires_at || null,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return NextResponse.json(
      {
        error: 'Failed to refresh token',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

