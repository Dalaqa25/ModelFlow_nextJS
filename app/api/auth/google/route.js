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
    
    // Comprehensive Google API scopes for automation runner
    const scopes = [
      // Basic profile
      'openid',
      'email',
      'profile',
      
      // YouTube Data API v3 - Full access
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtubepartner',
      'https://www.googleapis.com/auth/youtube.channel-memberships.creator',
      
      // Google Sheets - Full access (read/write)
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      
      // Google Docs - Full access
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/documents.readonly',
      
      // Google Drive - Full access
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata',
      'https://www.googleapis.com/auth/drive.appdata',
      
      // Gmail - Full access
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.readonly',
      
      // Google Calendar - Full access
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      
      // Google Slides - Full access
      'https://www.googleapis.com/auth/presentations',
      'https://www.googleapis.com/auth/presentations.readonly',
      
      // Google Forms - Full access
      'https://www.googleapis.com/auth/forms.body',
      'https://www.googleapis.com/auth/forms.responses.readonly',
      
      // Google Tasks
      'https://www.googleapis.com/auth/tasks',
      
      // Google Contacts
      'https://www.googleapis.com/auth/contacts',
      'https://www.googleapis.com/auth/contacts.readonly',
    ].join(' ');
    
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline'); // Required to get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to ensure refresh token

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to initiate Google OAuth',
      details: error.message 
    }, { status: 500 });
  }
}
