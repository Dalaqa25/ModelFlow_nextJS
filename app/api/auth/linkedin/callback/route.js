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
        console.error('Failed to parse LinkedIn OAuth state:', e);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/main?linkedin_error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    // Check if authorization code is present
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/main?linkedin_error=missing_code`);
    }

    // Exchange authorization code for access token
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('LinkedIn token exchange failed:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to exchange authorization code for tokens',
          details: errorData,
        },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('LinkedIn token error:', tokenData);
      return NextResponse.json(
        {
          error: tokenData.error,
          details: tokenData.error_description,
        },
        { status: 400 }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate expiration time
    const tokenExpiry = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    if (!access_token) {
      return NextResponse.json({ error: 'No access token received from LinkedIn' }, { status: 400 });
    }

    // Note: We skip profile fetching because the app only has "Share on LinkedIn" product enabled.
    // Profile APIs require "Sign In with LinkedIn using OpenID Connect" product.
    // We identify the user through our own Supabase auth instead.
    let providerUserId = null;
    let grantedScopes = ['w_member_social'];

    // Get the currently logged-in user from session
    const { getSupabaseUser } = await import('@/lib/auth/auth-utils');
    const currentUser = await getSupabaseUser();

    let userId = null;

    if (currentUser) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', currentUser.email)
        .maybeSingle();

      if (dbUser) {
        userId = dbUser.id;
      }
    }

    // Fall back to user_id from OAuth state (needed for cross-domain redirects
    // where the session cookie isn't sent back with the callback)
    if (!userId && testUserId) {
      const { data: stateUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', testUserId)
        .maybeSingle();

      if (stateUser) {
        userId = stateUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: 'You must be logged in to connect LinkedIn account',
          details: 'Could not identify user from session or OAuth state',
        },
        { status: 401 }
      );
    }

    // Save tokens to user_automations table
    if (automationId) {
      const { data: automation } = await supabase
        .from('automations')
        .select('id')
        .eq('id', automationId)
        .maybeSingle();

      if (!automation) {
        return NextResponse.json(
          {
            error: 'Automation not found',
            details: `Automation with id ${automationId} does not exist`,
          },
          { status: 404 }
        );
      }

      const { error: upsertError } = await supabase
        .from('user_automations')
        .upsert(
          {
            user_id: userId,
            automation_id: automationId,
            provider: 'linkedin',
            access_token: access_token,
            refresh_token: refresh_token || null,
            token_expiry: tokenExpiry,
            granted_scopes: grantedScopes,
            provider_user_id: providerUserId,
            is_active: false,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,automation_id',
          }
        );

      if (upsertError) {
        console.error('Failed to save LinkedIn tokens:', upsertError);
        return NextResponse.json(
          {
            error: 'Failed to save LinkedIn tokens',
            details: upsertError.message,
          },
          { status: 500 }
        );
      }

      console.log('LinkedIn tokens saved successfully for automation:', automationId);
    } else {
      console.warn('[LinkedIn OAuth] No automation_id provided in callback');
      return NextResponse.json(
        {
          error: 'No automation specified',
          details: 'Please connect LinkedIn through an automation setup',
        },
        { status: 400 }
      );
    }

    // Return success — close popup and notify parent window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LinkedIn Connected</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'linkedin_connected',
                success: true,
                automation_id: ${automationId ? `'${automationId}'` : 'null'}
              }, '*');
              window.close();
            } else {
              window.location.href = '/main?linkedin_connected=true';
            }
          </script>
          <p>LinkedIn connected successfully! This window should close automatically...</p>
        </body>
      </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
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
                type: 'linkedin_connected',
                success: false,
                error: '${error.message.replace(/'/g, "\\'")}'
              }, '*');
              window.close();
            } else {
              window.location.href = '/main?linkedin_error=${encodeURIComponent(error.message)}';
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
