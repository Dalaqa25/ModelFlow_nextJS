import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Parse state to get automation_id and user_id if provided
    let automationId = null;
    let testUserId = null;
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        automationId = stateData.automation_id;
        testUserId = stateData.user_id;
      } catch (e) {
        // Invalid state, continue without automation_id
      }
    }

    // Handle OAuth errors
    if (error) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/main?google_error=${encodeURIComponent(error)}`);
    }

    // Check if authorization code is present
    if (!code) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/main?google_error=missing_code`);
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      return NextResponse.json({ 
        error: 'Failed to exchange authorization code for tokens',
        details: errorData 
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    
    // Calculate expiration time (expires_in is in seconds)
    const tokenExpiry = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    // Get user info from Google
    if (!access_token) {
      return NextResponse.json({ 
        error: 'No access token received from Google' 
      }, { status: 400 });
    }

    // Get the currently logged-in user from session
    const { getSupabaseUser } = await import('@/lib/auth/auth-utils');
    const currentUser = await getSupabaseUser();
    
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'You must be logged in to connect Google account' 
      }, { status: 401 });
    }

    // Find user in database by EMAIL (not by auth ID, they might not match)
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', currentUser.email)
      .maybeSingle();
    
    if (!dbUser) {
      return NextResponse.json({ 
        error: 'User not found in database',
        details: 'Please contact support'
      }, { status: 404 });
    }

    // Use the database user ID (not the auth ID)
    const userId = testUserId || dbUser.id;

    // Save tokens to user_automations table
    if (automationId) {
      // Check if automation exists
      const { data: automation } = await supabase
        .from('automations')
        .select('id')
        .eq('id', automationId)
        .maybeSingle();
      
      if (!automation) {
        return NextResponse.json({ 
          error: 'Automation not found',
          details: `Automation with id ${automationId} does not exist in the database`
        }, { status: 404 });
      }

      // Save for specific automation
      const { error: upsertError } = await supabase
        .from('user_automations')
        .upsert({
          user_id: userId,
          automation_id: automationId,
          provider: 'google',
          access_token: access_token,
          refresh_token: refresh_token,
          token_expiry: tokenExpiry,
          is_active: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,automation_id'
        });

      if (upsertError) {
        console.error('Failed to save tokens:', upsertError);
        return NextResponse.json({ 
          error: 'Failed to save Google tokens',
          details: upsertError.message 
        }, { status: 500 });
      }
    } else {
      // No automation_id - this is a general Google connection
      // We still need to save it somewhere for the user
      // Option: Save to user_integrations for general use
      const { userIntegrationDB } = await import('@/lib/db/supabase-db');
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        await userIntegrationDB.upsertIntegration({
          user_id: userId,
          provider: 'google',
          provider_user_id: userInfo.id,
          provider_email: userInfo.email,
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: tokenExpiry,
        });
      }
    }

    // Return success - close popup and notify parent window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Connected</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'google_connected', 
                success: true,
                automation_id: ${automationId ? `'${automationId}'` : 'null'}
              }, '*');
              window.close();
            } else {
              window.location.href = '/main?google_connected=true';
            }
          </script>
          <p>Google connected successfully! This window should close automatically...</p>
        </body>
      </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connection Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'google_connected', 
                success: false, 
                error: '${error.message.replace(/'/g, "\\'")}'
              }, '*');
              window.close();
            } else {
              window.location.href = '/main?google_error=${encodeURIComponent(error.message)}';
            }
          </script>
          <p>Connection failed. This window should close automatically...</p>
        </body>
      </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
