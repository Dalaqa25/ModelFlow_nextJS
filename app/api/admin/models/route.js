import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/models
 * Fetch all pending models (status is null or not 'approved')
 */
export async function GET() {
  try {
    // Check if user is authenticated
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin (you can modify this check as needed)
    if (user.email !== 'g.dalaqishvili01@gmail.com') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Get pending models (status is not 'approved' or is null)
    const { data: pendingModels, error } = await supabase
      .from('models')
      .select('*')
      .or('status.is.null,status.neq.approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [ADMIN API] Database error fetching pending models:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending models', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(pendingModels || []);
  } catch (error) {
    console.error('❌ [ADMIN API] Exception in GET handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}