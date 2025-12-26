import { NextResponse } from 'next/server';
import { userDB } from '@/lib/db/supabase-db';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key for auth admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request) {
  try {
    const { email, token } = await request.json();
    
    if (!email || !token) {
      return NextResponse.json({ 
        error: 'Email and OTP code are required' 
      }, { status: 400 });
    }

    // Verify the OTP
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    // Ensure app-level user row exists after successful verification
    if (data?.user?.email) {
      try {
        const userRecord = await userDB.upsertUser({
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
        });
      } catch (e) {
        // Don't fail the entire request if user creation fails
        // The auth session is still valid
      }
    }

    return NextResponse.json({
      message: 'OTP verified successfully',
      session: data.session, // includes access_token, refresh_token
      user: data.user,
      redirect: '/main', // Tell frontend to redirect to main
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
}