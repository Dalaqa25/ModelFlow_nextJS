import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId) {
      return NextResponse.json({ 
        error: 'GOOGLE_CLIENT_ID is not set in environment variables' 
      }, { status: 500 });
    }

    // Construct Google OAuth authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline'); // Required to get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to ensure refresh token

    console.log('🔗 Redirecting to Google OAuth:', authUrl.toString());

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('❌ Error initiating Google OAuth:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate Google OAuth',
      details: error.message 
    }, { status: 500 });
  }
}

