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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter is required' 
      }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log('🔍 Debug auth check for email:', cleanEmail);

    const debugInfo = {
      email: cleanEmail,
      originalEmail: email,
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...'
      }
    };

    // 1. Test admin client basic functionality
    try {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 10 });
      debugInfo.adminClient = {
        working: !listError,
        totalUsers: listData?.users?.length || 0,
        error: listError?.message,
        sampleEmails: listData?.users?.slice(0, 3)?.map(u => u.email) || []
      };
    } catch (e) {
      debugInfo.adminClient = {
        working: false,
        error: e.message
      };
    }

    // 2. Check auth user by email using listUsers (since getUserByEmail doesn't exist)
    try {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && listData?.users) {
        const foundUser = listData.users.find(u => u.email?.toLowerCase() === cleanEmail);
        debugInfo.authUser = {
          found: !!foundUser,
          error: null,
          user: foundUser ? {
            id: foundUser.id,
            email: foundUser.email,
            emailConfirmedAt: foundUser.email_confirmed_at,
            createdAt: foundUser.created_at,
            lastSignInAt: foundUser.last_sign_in_at,
            userMetadata: foundUser.user_metadata,
            appMetadata: foundUser.app_metadata
          } : null
        };
      } else {
        debugInfo.authUser = {
          found: false,
          error: listError?.message || 'No users data returned'
        };
      }
    } catch (e) {
      debugInfo.authUser = {
        found: false,
        error: e.message
      };
    }

    // 3. Check database user
    try {
      const dbUser = await userDB.getUserByEmail(cleanEmail);
      debugInfo.dbUser = {
        found: !!dbUser,
        user: dbUser
      };
    } catch (e) {
      debugInfo.dbUser = {
        found: false,
        error: e.message
      };
    }

    // 4. Search for similar emails in both systems
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const similarEmails = listData?.users?.filter(u => 
        u.email?.toLowerCase()?.includes(cleanEmail.split('@')[0]) ||
        u.email?.toLowerCase()?.includes(cleanEmail.split('@')[1])
      )?.map(u => u.email) || [];
      
      debugInfo.similarEmails = similarEmails.slice(0, 5);
    } catch (e) {
      debugInfo.similarEmails = [];
    }

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error.message 
    }, { status: 500 });
  }
}