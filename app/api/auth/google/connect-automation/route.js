import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';

/**
 * Initiate Google OAuth for a specific automation
 * This creates a "pending" connection and redirects to Google OAuth
 */
export async function POST(request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId } = await request.json();
    if (!automationId) {
      return NextResponse.json({ error: 'automationId is required' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId) {
      return NextResponse.json({ 
        error: 'GOOGLE_CLIENT_ID is not set' 
      }, { status: 500 });
    }

    // Create state parameter to track this connection attempt
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      automationId,
      timestamp: Date.now(),
    })).toString('base64');

    // Construct Google OAuth authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state); // Pass context through OAuth flow
    
    // Comprehensive Google API scopes
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
    ].join(' ');
    
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      state 
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to initiate OAuth',
      details: error.message 
    }, { status: 500 });
  }
}
