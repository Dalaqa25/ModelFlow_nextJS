import { NextResponse } from 'next/server';
import { userDB, supabase as serviceClient } from '@/lib/db/supabase-db';

const supabase = serviceClient;

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    // Check if user exists in our database
    const dbUser = await userDB.getUserByEmail(email);
    if (!dbUser) {
      return NextResponse.json({ 
        error: 'User not found in database' 
      }, { status: 404 });
    }
    
    // Check if user already exists in auth
    let authUser;
    try {
      const { data } = await supabase.auth.admin.getUserByEmail(email);
      authUser = data?.user ?? null;
    } catch (e) {
      authUser = null;
    }
    
    if (authUser) {
      return NextResponse.json({ 
        message: 'User already exists in auth system',
        user: authUser
      });
    }
    
    // Create user in auth system
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true, // Auto-confirm
      user_metadata: {
        name: dbUser.name || email
      }
    });
    
    if (error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      message: 'User successfully migrated to auth system',
      user: data.user
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Migration failed' 
    }, { status: 500 });
  }
}