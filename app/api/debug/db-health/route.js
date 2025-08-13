import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-db';

export async function GET() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: 'Supabase',
      connection: 'active'
    });
  } catch (error) {
    console.error('Database health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
