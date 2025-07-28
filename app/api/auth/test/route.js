import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata
        },
        expires_at: session.expires_at
      } : null,
      user: user ? {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      } : null,
      sessionError: sessionError?.message,
      userError: userError?.message,
      hasSession: !!session,
      hasUser: !!user
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 