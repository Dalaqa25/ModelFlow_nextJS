import { NextResponse } from 'next/server';
import { userDB, userIntegrationDB } from '@/lib/db/supabase-db';

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

    // Get Google integration
    const integration = await userIntegrationDB.getIntegrationByUserAndProvider(
      user.id,
      'google'
    );

    if (!integration) {
      return NextResponse.json(
        { 
          error: 'No Google integration found for this user',
          message: 'Please authenticate with Google first at /api/auth/google/test'
        },
        { status: 404 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
    const isExpired = expiresAt ? expiresAt <= now : false;

    // Return the tokens
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      google_integration: {
        provider: integration.provider,
        provider_user_id: integration.provider_user_id,
        provider_email: integration.provider_email,
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
        expires_at: integration.expires_at,
        is_expired: isExpired,
        created_at: integration.created_at,
        updated_at: integration.updated_at,
      },
      token_status: {
        is_expired: isExpired,
        expires_at: integration.expires_at,
        time_until_expiry: expiresAt ? Math.floor((expiresAt - now) / 1000) + ' seconds' : 'unknown',
      }
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

