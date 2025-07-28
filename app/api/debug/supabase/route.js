import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseAnonKeyLength: supabaseAnonKey?.length || 0
    };

    // Test Supabase client creation
    let clientTest = { success: false, error: null };
    try {
      const { createClient } = await import('@/lib/supabase-server');
      const supabase = createClient();
      clientTest = { success: true, error: null };
    } catch (error) {
      clientTest = { success: false, error: error.message };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      clientTest,
      headers: {
        host: process.env.HOST || 'localhost',
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 