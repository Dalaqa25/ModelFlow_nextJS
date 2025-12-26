import { NextResponse } from 'next/server';
import { validateEmail } from '@/lib/validation-utils';
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
    const { email } = await request.json();
    const cleanEmail = email?.trim()?.toLowerCase();
    
    // Basic validation
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid email address',
        field: 'email'
      }, { status: 400 });
    }

    // Test admin client connection and list users to verify functionality
    try {
      const { data: testData, error: testError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 5 });
      if (testData?.users?.length > 0) {
        // Check if our target email is in the list
        const targetUser = testData.users.find(u => u.email === cleanEmail);
      }
    } catch (e) {
      // Error handled silently
    }

    // Check if user exists in Supabase Auth
    let authUser;
    
    try {
      // Use listUsers with email filter to find the user
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        throw listError;
      }
      
      if (listData?.users) {
        authUser = listData.users.find(u => u.email?.toLowerCase() === cleanEmail);
      } else {
        authUser = null;
      }
    } catch (e) {
      authUser = null;
    }

    // Also check our database
    let dbUser;
    try {
      dbUser = await userDB.getUserByEmail(cleanEmail);
    } catch (e) {
      dbUser = null;
    }

    // If user doesn't exist in auth, return error
    if (!authUser) {
      if (dbUser) {
        // User exists in DB but not in Auth - this is the issue!
        return NextResponse.json({ 
          error: 'Account found in database but not in authentication system. Please contact support or try signing up again.',
          field: 'email',
          debug: {
            auth_user_missing: true,
            db_user_exists: true,
            cleanEmail,
            originalEmail: email,
            dbUserDetails: dbUser
          }
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: 'No account found with this email address. Please sign up first.',
          field: 'email',
          debug: {
            both_missing: true,
            cleanEmail,
            originalEmail: email
          }
        }, { status: 404 });
      }
    }

    // Send OTP for existing user login
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false, // 🚫 don't auto-create
      },
    });

    if (error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    // Ensure user record exists in our database (might not exist for older users)
    try {
      const existingUser = await userDB.getUserByEmail(cleanEmail);
      if (!existingUser) {
        // Create user record if it doesn't exist (for users created before our system)
        await userDB.upsertUser({
          email: cleanEmail,
          name: cleanEmail, // Use email as fallback name
        });
      }
    } catch (e) {
      // Error handled silently
    }

    return NextResponse.json({ 
      message: 'OTP sent to email. Please check your inbox for the verification code.'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
}
