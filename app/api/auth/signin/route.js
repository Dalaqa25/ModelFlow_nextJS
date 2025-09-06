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
    console.log('🚀 Sign in attempt for:', email);
    console.log('🧹 Cleaned email:', cleanEmail);
    console.log('🔢 Email length:', email?.length, 'Cleaned length:', cleanEmail?.length);
    
    // Basic validation
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.isValid) {
      console.log('❌ Email validation failed:', emailValidation.errors);
      return NextResponse.json({ 
        error: 'Invalid email address',
        field: 'email'
      }, { status: 400 });
    }
    console.log('✅ Email validation passed');

    // Test admin client connection and list users to verify functionality
    try {
      const { data: testData, error: testError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 5 });
      console.log('🔧 Admin client test - Users count:', testData?.users?.length || 0);
      if (testData?.users?.length > 0) {
        console.log('👥 Sample user emails from listUsers:', testData.users.map(u => u.email));
        // Check if our target email is in the list
        const targetUser = testData.users.find(u => u.email === cleanEmail);
        if (targetUser) {
          console.log('🎯 Target user found in listUsers:', targetUser.email);
        } else {
          console.log('🚫 Target user NOT found in first 5 users from listUsers');
        }
      }
      if (testError) {
        console.error('❌ Admin client listUsers error:', testError);
      }
    } catch (e) {
      console.error('❌ Admin client connection failed:', e);
    }

    // Check if user exists in Supabase Auth
    let authUser;
    console.log('🔍 Checking auth user for email:', cleanEmail);
    console.log('🔑 Using service key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
    console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    try {
      // Use listUsers with email filter to find the user
      console.log('🔄 Using listUsers approach to find user...');
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ listUsers error:', listError);
        throw listError;
      }
      
      if (listData?.users) {
        authUser = listData.users.find(u => u.email?.toLowerCase() === cleanEmail);
        console.log('🔍 Auth user result via listUsers:', authUser ? 'Found' : 'Not found');
        console.log('📨 Total users in auth system:', listData.users.length);
        
        if (authUser) {
          console.log('📧 Auth user details:', {
            id: authUser.id,
            email: authUser.email,
            email_confirmed_at: authUser.email_confirmed_at,
            created_at: authUser.created_at,
            user_metadata: authUser.user_metadata,
            app_metadata: authUser.app_metadata,
            aud: authUser.aud,
            role: authUser.role
          });
        } else {
          console.warn('⚠️ User not found in auth system. Available emails:', listData.users.map(u => u.email));
        }
      } else {
        console.warn('⚠️ No users data returned from listUsers');
        authUser = null;
      }
    } catch (e) {
      console.error('❌ Error checking auth user:', e);
      console.error('❌ Error details:', e.message, e.stack);
      console.error('❌ Error name:', e.name);
      console.error('❌ Error cause:', e.cause);
      authUser = null;
    }

    // Also check our database
    let dbUser;
    try {
      dbUser = await userDB.getUserByEmail(cleanEmail);
      console.log('🔍 DB user result:', dbUser ? 'Found' : 'Not found');
      if (dbUser) {
        console.log('💾 DB user details:', dbUser);
      }
    } catch (e) {
      console.error('❌ Error checking DB user:', e);
      dbUser = null;
    }

    // If user doesn't exist in auth, return error
    if (!authUser) {
      console.log('❌ No auth user found, but DB user exists:', !!dbUser);
      console.log('🔍 Debug info - cleanEmail:', cleanEmail);
      console.log('🔍 Debug info - original email:', email);
      console.log('🔍 Debug info - service key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      console.log('🔍 Debug info - supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      if (dbUser) {
        // User exists in DB but not in Auth - this is the issue!
        console.log('🚨 CRITICAL: User exists in DB but not found in Auth system!');
        console.log('🚨 DB User details:', dbUser);
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
      console.error('❌ Sign in OTP error:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    // Ensure user record exists in our database (might not exist for older users)
    try {
      console.log('🔄 Ensuring user record exists for login:', cleanEmail);
      const existingUser = await userDB.getUserByEmail(cleanEmail);
      if (!existingUser) {
        // Create user record if it doesn't exist (for users created before our system)
        await userDB.upsertUser({
          email: cleanEmail,
          name: cleanEmail, // Use email as fallback name
        });
        console.log('✅ User record created for existing auth user');
      } else {
        console.log('✅ User record already exists');
      }
    } catch (e) {
      console.warn('⚠️ Failed to ensure user record exists during signin:', e?.message || e);
    }

    return NextResponse.json({ 
      message: 'OTP sent to email. Please check your inbox for the verification code.'
    });

  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
} 