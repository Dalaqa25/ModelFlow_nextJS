import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const automationId = searchParams.get('automation_id');
    const userId = searchParams.get('user_id');

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';

    if (!clientId) {
      return NextResponse.json(
        { error: 'LINKEDIN_CLIENT_ID is not set in environment variables' },
        { status: 500 }
      );
    }

    // LinkedIn OAuth 2.0 scopes
    // w_member_social → post on behalf of the member (requires "Share on LinkedIn" product)
    // openid, profile, email → identity (requires "Sign In with LinkedIn using OpenID Connect" product)
    // Only request scopes that are approved for your LinkedIn app.
    // Add products at: https://www.linkedin.com/developers/apps → Products tab
    const scopes = [
      'w_member_social',
      'openid',
      'profile',
    ];

    // Generate state for CSRF protection + pass automation context through
    const state = Buffer.from(
      JSON.stringify({
        automation_id: automationId,
        user_id: userId,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Construct LinkedIn OAuth authorization URL
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);

    console.log('Initiating LinkedIn OAuth with scopes:', scopes);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate LinkedIn OAuth',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
