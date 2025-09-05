import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { validateSignupForm } from '@/lib/validation-utils';
import { userDB, supabase as serviceClient } from '@/lib/db/supabase-db';

export async function POST(request) {
  try {
    const { email, password, userData } = await request.json();
    const supabase = createClient();

    // Extract username from userData (name field)
    const username = userData?.name || '';

    // Server-side validation
    const validation = validateSignupForm({ email, password, username });
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed',
        validationErrors: validation.errors 
      }, { status: 400 });
    }

    // Check if email already exists in our users table OR in Supabase Auth
    const existingUser = await userDB.getUserByEmail(email);
    let authUser;
    try {
      const { data } = await serviceClient.auth.admin.getUserByEmail(email);
      authUser = data?.user ?? null;
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

      // If not confirmed yet, re-send confirmation and return success
      try {
        await serviceClient.auth.resend({ type: 'signup', email });
      } catch (_) {
        // ignore resend errors, still return generic message
      }

      // Ensure app-level users row exists immediately after (idempotent)
      try {
        await userDB.upsertUser({
          email,
          name: username || authUser.email,
        });
      } catch (e) {
        console.warn('Users upsert failed (resend branch):', e?.message || e);
      }

      return NextResponse.json({
        user: { id: authUser.id, email: authUser.email },
        emailSent: true,
        message: 'We re-sent your confirmation email. Please check your inbox.'
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

    // Attempt to create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData || {},
      },
    });

    if (error) {
      // Handle specific Supabase auth errors
      let errorMessage = error.message;
      let field = 'general';

      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
        field = 'email';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password does not meet requirements.';
        field = 'password';
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

    // Ensure app-level users row exists immediately (idempotent)
    try {
      await userDB.upsertUser({
        email,
        name: username || email,
      });
    } catch (e) {
      console.warn('Users upsert failed (new signup):', e?.message || e);
    }

    return NextResponse.json({ 
      user: data.user,
      emailSent: true,
      message: 'Account created successfully! Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.',
      field: 'general'
    }, { status: 500 });
  }
} 