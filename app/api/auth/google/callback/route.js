import { NextResponse } from 'next/server';
import { userDB, userIntegrationDB } from '@/lib/db/supabase-db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.json({ 
        error: 'Google OAuth authorization failed',
        details: error 
      }, { status: 400 });
    }

    // Check if authorization code is present
    if (!code) {
      return NextResponse.json({ 
        error: 'Authorization code is missing' 
      }, { status: 400 });
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
    const { getSupabaseUser } = await import('@/lib/auth-utils');
    const currentUser = await getSupabaseUser();
    
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'You must be logged in to connect Google account' 
      }, { status: 401 });
    }

    // Ensure user exists in users table (sync from auth.users to users table)
    // ALWAYS use the current auth user's ID
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
    return NextResponse.json({ 
      error: 'Internal server error during Google authentication',
      details: error.message 
    }, { status: 500 });
  }
}
