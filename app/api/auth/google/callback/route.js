import { NextResponse } from 'next/server';
import { userDB, userIntegrationDB } from '@/lib/db/supabase-db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Parse state to check if this is an automation connection
    let automationContext = null;
    if (state) {
      try {
        automationContext = JSON.parse(Buffer.from(state, 'base64').toString());
      } catch (e) {
        // Invalid state, continue with normal flow
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
    const { access_token, refresh_token, expires_in, scope } = tokenData;
    
    // Calculate expiration time (expires_in is in seconds)
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    // Get user info from Google
    if (!access_token) {
      return NextResponse.json({ 
        error: 'No access token received from Google' 
      }, { status: 400 });
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text();
      return NextResponse.json({ 
        error: 'Failed to fetch user information from Google',
        details: errorData 
      }, { status: 400 });
    }

    const userInfo = await userInfoResponse.json();
    const { email, id: google_user_id } = userInfo;

    // Get the currently logged-in user from session
    const { getSupabaseUser } = await import('@/lib/auth/auth-utils');
    const currentUser = await getSupabaseUser();
    
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'You must be logged in to connect Google account' 
      }, { status: 401 });
    }

    // AUTOMATION CONNECTION FLOW - Create n8n credential
    if (automationContext && automationContext.automationId) {
      const { n8nClient } = await import('@/lib/n8n/n8n-client');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      try {
        // Create credentials for ALL Google service types in n8n
        const credentialBaseName = `${email}`;
        const credentials = await n8nClient.createAllGoogleCredentials(credentialBaseName, {
          access_token,
          refresh_token,
          expires_in,
          scope,
        });

        console.log('Created credentials:', credentials);

        // Store all credential IDs as JSON
        if (Object.keys(credentials).length === 0) {
          throw new Error('Failed to create any credentials in n8n');
        }

        // Create or update user_automations record with credentials (NO workflow yet)
        const { error: upsertError } = await supabase
          .from('user_automations')
          .upsert({
            user_id: automationContext.userId,
            automation_id: automationContext.automationId,
            provider: 'google',
            n8n_credential_id: JSON.stringify(credentials), // Store all credential IDs
            n8n_workflow_id: null, // Will be set when workflow is cloned
            is_active: false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,automation_id',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error('Failed to save credential mapping:', upsertError);
          throw upsertError;
        }

        // Success - close popup
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
                    type: 'automation_connected', 
                    success: true,
                    credentials: ${JSON.stringify(credentials)}
                  }, '*');
                  window.close();
                } else {
                  window.location.href = '/main?automation_connected=true';
                }
              </script>
              <p>Google connected successfully! This window should close automatically...</p>
            </body>
          </html>
        `;
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        });

      } catch (n8nError) {
        console.error('Failed to create n8n credential:', n8nError);
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
                    type: 'automation_connected', 
                    success: false, 
                    error: '${n8nError.message.replace(/'/g, "\\'")}' 
                  }, '*');
                  window.close();
                } else {
                  window.location.href = '/main?google_error=${encodeURIComponent(n8nError.message)}';
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

    // NORMAL USER LOGIN FLOW (existing code)
    const targetUserId = currentUser.id;
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Check if user with this ID exists
      const { data: existingById } = await supabase
        .from('users')
        .select('id')
        .eq('id', targetUserId)
        .maybeSingle();
      
      if (!existingById) {
        // Check if email exists with different ID
        const { data: existingByEmail } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', currentUser.email)
          .maybeSingle();
        
        if (existingByEmail) {
          // Delete the old user record (this will cascade delete integrations too)
          await supabase
            .from('users')
            .delete()
            .eq('id', existingByEmail.id);
        }
        
        // Insert with the current auth user's ID
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: targetUserId,
            email: currentUser.email,
            name: currentUser.user_metadata?.name || currentUser.email,
            profile_image_url: currentUser.user_metadata?.avatar_url || null,
          })
          .select()
          .single();
        
        if (insertError) {
          throw insertError;
        }
      }
    } catch (userError) {
      return NextResponse.json({ 
        error: 'Failed to sync user data',
        details: userError.message 
      }, { status: 500 });
    }

    // Save or update Google OAuth integration for the logged-in user
    try {
      const integration = await userIntegrationDB.upsertIntegration({
        user_id: targetUserId,
        provider: 'google',
        provider_user_id: google_user_id,
        provider_email: email,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAt,
      });
    } catch (integrationError) {
      return NextResponse.json({ 
        error: 'Failed to save Google integration',
        details: integrationError.message 
      }, { status: 500 });
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
              window.opener.postMessage({ type: 'google_connected', success: true }, '*');
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connection Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'google_connected', success: false, error: '${error.message.replace(/'/g, "\\'")}' }, '*');
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
