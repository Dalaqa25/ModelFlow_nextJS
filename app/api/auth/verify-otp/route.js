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
      console.error('OTP verification error:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    // Ensure app-level user row exists after successful verification
    if (data?.user?.email) {
      try {
        console.log('🔄 Creating user record for:', data.user.email);
        console.log('📝 User metadata:', data.user.user_metadata);
        
        const userRecord = await userDB.upsertUser({
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
        });
        
        console.log('✅ User record created/updated:', userRecord);
      } catch (e) {
        console.error('❌ Failed to ensure user row exists after OTP verification:', e);
        // Don't fail the entire request if user creation fails
        // The auth session is still valid
      }
    } else {
      console.warn('⚠️ No user data received from OTP verification');
    }

    return NextResponse.json({
      message: 'OTP verified successfully',
      session: data.session, // includes access_token, refresh_token
      user: data.user,
      redirect: '/dashboard', // Tell frontend to redirect to dashboard
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
}