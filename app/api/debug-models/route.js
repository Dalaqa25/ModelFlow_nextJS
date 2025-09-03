import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('🔧 [DEBUG] GET /api/debug-models called');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('🔗 [DEBUG] Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('models')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ [DEBUG] Connection test failed:', connectionError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: connectionError.message,
        code: connectionError.code
      }, { status: 500 });
    }

    console.log('✅ [DEBUG] Database connection successful');

    // Test 2: Check table structure
    console.log('📋 [DEBUG] Checking models table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('models')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ [DEBUG] Table structure check failed:', tableError);
      return NextResponse.json({
        error: 'Table access failed',
        details: tableError.message,
        code: tableError.code
      }, { status: 500 });
    }

    // Test 3: Check for pending models
    console.log('🔍 [DEBUG] Checking for pending models...');
    const { data: pendingModels, error: pendingError } = await supabase
      .from('models')
      .select('id, name, status, created_at')
      .or('status.is.null,status.neq.approved')
      .order('created_at', { ascending: false })
      .limit(5);

    if (pendingError) {
      console.error('❌ [DEBUG] Pending models query failed:', pendingError);
      return NextResponse.json({
        error: 'Pending models query failed',
        details: pendingError.message,
        code: pendingError.code
      }, { status: 500 });
    }

    // Test 4: Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    };

    console.log('✅ [DEBUG] All tests completed successfully');

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      connection: 'OK',
      tableAccess: 'OK',
      pendingModelsCount: pendingModels?.length || 0,
      samplePendingModels: pendingModels,
      tableStructure: tableInfo?.[0] ? Object.keys(tableInfo[0]) : 'No data'
    });

  } catch (error) {
    console.error('❌ [DEBUG] Exception in debug endpoint:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}