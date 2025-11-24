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

    // Find or create user by email
    let user = await userDB.getUserByEmail(email);
    
    if (!user) {
      // Create new user if doesn't exist
      console.log('👤 Creating new user for:', email);
      user = await userDB.upsertUser({
        email: email,
        name: userInfo.name || email,
        profile_image_url: userInfo.picture || null,
      });
      console.log('✅ User created:', user.id);
    } else {
      console.log('👤 Existing user found:', user.id);
    }

    // Save or update Google OAuth integration
    try {
      const integration = await userIntegrationDB.upsertIntegration({
        user_id: user.id,
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
      // Don't fail the entire request, but log the error
    }

    // Return success response (you can modify this later to redirect or return data)
    return NextResponse.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        google_email: email,
        google_user_id: google_user_id,
        google_access_token: access_token,
        google_refresh_token: refresh_token,
        expires_at: expiresAt,
        user_id: user.id,
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

