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
    const errorDescription = searchParams.get('error_description');

    // Parse state to get automation_id and user_id
    let automationId = null;
    let testUserId = null;
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        automationId = stateData.automation_id;
        testUserId = stateData.user_id;
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }

    // Handle OAuth errors
    if (error) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        `${baseUrl}/main?tiktok_error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    // Check if authorization code is present
    if (!code) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/main?tiktok_error=missing_code`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/auth/tiktok/callback',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('TikTok token exchange failed:', errorData);
      return NextResponse.json({ 
        error: 'Failed to exchange authorization code for tokens',
        details: errorData 
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('TikTok token error:', tokenData);
      return NextResponse.json({ 
        error: tokenData.error,
        details: tokenData.error_description 
      }, { status: 400 });
    }

    const { access_token, refresh_token, expires_in, scope, open_id } = tokenData.data || tokenData;
    
    // Parse granted scopes
    const grantedScopes = scope ? scope.split(',') : [];
    console.log('TikTok granted scopes:', grantedScopes);
    
    // Calculate expiration time (expires_in is in seconds)
    const tokenExpiry = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    if (!access_token) {
      return NextResponse.json({ 
        error: 'No access token received from TikTok' 
      }, { status: 400 });
    }

    // Get the currently logged-in user from session
    const { getSupabaseUser } = await import('@/lib/auth/auth-utils');
    const currentUser = await getSupabaseUser();
    
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'You must be logged in to connect TikTok account' 
      }, { status: 401 });
    }

    // Find user in database by EMAIL
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
          details: `Automation with id ${automationId} does not exist`
        }, { status: 404 });
      }

      // Save tokens for specific automation
      const { error: upsertError } = await supabase
        .from('user_automations')
        .upsert({
          user_id: userId,
          automation_id: automationId,
          provider: 'tiktok',
          access_token: access_token,
          refresh_token: refresh_token,
          token_expiry: tokenExpiry,
          granted_scopes: grantedScopes,
          provider_user_id: open_id, // Store TikTok's open_id
          is_active: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,automation_id'
        });

      if (upsertError) {
        console.error('Failed to save TikTok tokens:', upsertError);
        return NextResponse.json({ 
          error: 'Failed to save TikTok tokens',
          details: upsertError.message 
        }, { status: 500 });
      }

      console.log('TikTok tokens saved successfully for automation:', automationId);
    } else {
      console.warn('[TikTok OAuth] No automation_id provided in callback');
      return NextResponse.json({ 
        error: 'No automation specified',
        details: 'Please connect TikTok through an automation setup'
      }, { status: 400 });
    }

    // Return success - close popup and notify parent window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TikTok Connected</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'tiktok_connected', 
                success: true,
                automation_id: ${automationId ? `'${automationId}'` : 'null'}
              }, '*');
              window.close();
            } else {
              window.location.href = '/main?tiktok_connected=true';
            }
          </script>
          <p>TikTok connected successfully! This window should close automatically...</p>
        </body>
      </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
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
                type: 'tiktok_connected', 
                success: false, 
                error: '${error.message.replace(/'/g, "\\'")}'
              }, '*');
              window.close();
            } else {
              window.location.href = '/main?tiktok_error=${encodeURIComponent(error.message)}';
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
