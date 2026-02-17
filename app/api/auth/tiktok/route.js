import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const automationId = searchParams.get('automation_id');
    const userId = searchParams.get('user_id');

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/auth/tiktok/callback';

    if (!clientKey) {
      return NextResponse.json({ 
        error: 'TIKTOK_CLIENT_KEY is not set in environment variables' 
      }, { status: 500 });
    }

    // TikTok scopes - request only what we need
    const scopes = [
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
      'video.upload',
      'video.publish'  // Required for Direct Post API
    ];

    // Generate random state for CSRF protection
    const state = Buffer.from(JSON.stringify({ 
      automation_id: automationId,
      user_id: userId,
      timestamp: Date.now()
    })).toString('base64');

    // Construct TikTok OAuth authorization URL
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.set('client_key', clientKey);
    authUrl.searchParams.set('scope', scopes.join(','));
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    console.log('Initiating TikTok OAuth with scopes:', scopes);

    // Redirect to TikTok OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('TikTok OAuth error:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate TikTok OAuth',
      details: error.message 
    }, { status: 500 });
  }
}
