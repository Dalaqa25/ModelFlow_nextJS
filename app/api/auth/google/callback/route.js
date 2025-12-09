import { NextResponse } from 'next/server';
import { userDB, userIntegrationDB } from '@/lib/db/supabase-db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('❌ Google OAuth error:', error);
      return NextResponse.json({ 
        error: 'Google OAuth authorization failed',
        details: error 
      }, { status: 400 });
    }

    // Check if authorization code is present
    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.json({ 
        error: 'Authorization code is missing' 
      }, { status: 400 });
    }

    console.log('✅ Received authorization code from Google');

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
      console.error('❌ Token exchange failed:', errorData);
      return NextResponse.json({ 
        error: 'Failed to exchange authorization code for tokens',
        details: errorData 
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    console.log('✅ Successfully exchanged code for tokens');
    console.log('📝 Access token received:', access_token ? 'Yes' : 'No');
    console.log('📝 Refresh token received:', refresh_token ? 'Yes' : 'No');
    
    // Calculate expiration time (expires_in is in seconds)
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    // Get user info from Google
    if (!access_token) {
      console.error('❌ No access token received');
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
      console.error('❌ Failed to fetch user info:', errorData);
      return NextResponse.json({ 
        error: 'Failed to fetch user information from Google',
        details: errorData 
      }, { status: 400 });
    }

    const userInfo = await userInfoResponse.json();
    const { email, id: google_user_id } = userInfo;

    // Console log all the required information
    console.log('\n🎉 ===== GOOGLE AUTHENTICATION SUCCESS =====');
    console.log('📧 Google Email:', email);
    console.log('🆔 Google User ID:', google_user_id);
    console.log('🔑 Google Access Token:', access_token);
    console.log('🔄 Google Refresh Token:', refresh_token);
    console.log('⏰ Token Expires At:', expiresAt);
    console.log('===========================================\n');

    // Get the currently logged-in user from session
    const { getSupabaseUser } = await import('@/lib/auth-utils');
    const currentUser = await getSupabaseUser();
    
    if (!currentUser) {
      console.error('❌ No authenticated user found in session');
      return NextResponse.json({ 
        error: 'You must be logged in to connect Google account' 
      }, { status: 401 });
    }

    console.log('👤 Connecting Google to logged-in user:', currentUser.id, currentUser.email);

    // Ensure user exists in users table (sync from auth.users to users table)
    // ALWAYS use the current auth user's ID
    const targetUserId = currentUser.id;
    
    try {
      console.log('🔍 Ensuring user exists in users table with ID:', targetUserId);
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
        console.log('👤 User ID not in users table, inserting...');
        
        // Check if email exists with different ID
        const { data: existingByEmail } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', currentUser.email)
          .maybeSingle();
        
        if (existingByEmail) {
          console.log('⚠️ Email exists with different ID:', existingByEmail.id, '- deleting old record');
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
          console.error('❌ Insert error:', insertError);
          throw insertError;
        }
        console.log('✅ User entry created in users table:', newUser.id);
      } else {
        console.log('✅ User already exists in users table with correct ID');
      }
    } catch (userError) {
      console.error('❌ Failed to sync user to users table:', userError);
      return NextResponse.json({ 
        error: 'Failed to sync user data',
        details: userError.message 
      }, { status: 500 });
    }

    // Save or update Google OAuth integration for the logged-in user
    try {
      console.log('💾 Saving integration for user_id:', targetUserId);
      const integration = await userIntegrationDB.upsertIntegration({
        user_id: targetUserId,
        provider: 'google',
        provider_user_id: google_user_id,
        provider_email: email,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAt,
      });

      console.log('✅ Google integration saved/updated:', integration.id);
    } catch (integrationError) {
      console.error('❌ Failed to save Google integration:', integrationError);
      return NextResponse.json({ 
        error: 'Failed to save Google integration',
        details: integrationError.message 
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        google_email: email,
        google_user_id: google_user_id,
        expires_at: expiresAt,
        user_id: targetUserId,
      }
    });

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during Google authentication',
      details: error.message 
    }, { status: 500 });
  }
}

