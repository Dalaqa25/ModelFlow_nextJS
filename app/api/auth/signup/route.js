import { NextResponse } from 'next/server';
import { validateEmail, validateUsername } from '@/lib/auth/validation-utils';
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
    const { email, userData } = await request.json();
    const username = userData?.name || '';

    // Basic validation
    const emailValidation = validateEmail(email);
    const usernameValidation = validateUsername(username);
    
    if (!emailValidation.isValid || !usernameValidation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed',
        validationErrors: {
          email: emailValidation.errors,
          username: usernameValidation.errors
        }
      }, { status: 400 });
    }

    // Check if email already exists in our users table OR in Supabase Auth
    const existingUser = await userDB.getUserByEmail(email);
    let authUser;
    try {
      // Use listUsers to find the user since getUserByEmail doesn't exist in newer versions
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      authUser = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
    } catch (e) {
      authUser = null;
    }

    // If user exists in Supabase Auth
    if (authUser) {
      // If already confirmed, block signup
      if (authUser.email_confirmed_at) {
        return NextResponse.json({ 
          error: 'Email already registered',
          field: 'email',
          message: 'An account with this email already exists. Try signing in.'
        }, { status: 409 });
      }

      // If not confirmed yet, re-send OTP and return success
      try {
        const { error } = await supabaseAdmin.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false
          }
        });
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      } catch (_) {
        // ignore resend errors, still return generic message
      }

      return NextResponse.json({
        message: 'We re-sent your verification code. Please check your inbox.'
      });
    }

    // Also guard if email exists in our app users table (should normally mirror auth)
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email already registered',
        field: 'email',
        message: 'An account with this email already exists. Try signing in.'
      }, { status: 409 });
    }

    // Check if username already exists (using name field) via service client to avoid RLS issues
    if (username) {
      const existingUsername = await userDB.getUserByName(username);
      if (existingUsername) {
        return NextResponse.json({ 
          error: 'Username already taken',
          field: 'username',
          message: 'This username is already taken. Please choose a different username.'
        }, { status: 409 });
      }
    }

    // Send OTP for new user signup
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // ✅ create user if not exist
        data: userData || {}, // Store user metadata
      },
    });

    if (error) {
      // Handle specific Supabase auth errors
      let errorMessage = error.message;
      let field = 'general';

      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
        field = 'email';
      } else if (error.message.includes('email')) {
        errorMessage = 'Please enter a valid email address.';
        field = 'email';
      }

      return NextResponse.json({ 
        error: errorMessage,
        field,
        originalError: error.message 
      }, { status: 400 });
    }

    // Pre-create the user record in our database (will be confirmed after OTP verification)
    try {
      const userRecord = await userDB.upsertUser({
        email,
        name: username || email,
      });
    } catch (e) {
      // Don't fail the signup if user record creation fails
      // The OTP verification will try again
    }

    return NextResponse.json({ 
      message: 'OTP sent to email. Please check your inbox for the verification code.'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.',
      field: 'general'
    }, { status: 500 });
  }
} 