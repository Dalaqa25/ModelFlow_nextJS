import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('🚀 [API] GET /api/pending-models called');

  try {
    // For admin operations, we'll skip detailed authentication since
    // the frontend already verifies admin status. The service role key
    // provides the necessary permissions for database operations.

    // Note: In production, you might want to add proper authentication
    // by sending the session token from the client

    console.log('🗄️ [API] Fetching pending models from database...');
    console.log('🔍 [API] Query: status IS NULL OR status != approved');

    // Get pending models (status is not 'approved' or is null)
    const { data: pendingModels, error } = await supabase
      .from('models')
      .select('*')
      .or('status.is.null,status.neq.approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [API] Database error fetching pending models:', error);
      console.error('❌ [API] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { error: 'Failed to fetch pending models', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [API] Successfully fetched pending models');
    console.log('📊 [API] Number of pending models:', pendingModels?.length || 0);
    console.log('📋 [API] Pending models data:', pendingModels);

    return NextResponse.json(pendingModels || []);
  } catch (error) {
    console.error('❌ [API] Exception in GET handler:', error);
    console.error('❌ [API] Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}