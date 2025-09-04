import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import { userDB } from '@/lib/db/supabase-db';

export async function GET() {
  try {

    // Check authentication
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user from our database
    const user = await userDB.getUserByEmail(supabaseUser.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate available balance dynamically

    let availableBalance;
    if (user.withdrawn_amount === 0 || !user.withdrawn_amount) {
      availableBalance = user.total_earnings || 0;
    } else {
      availableBalance = (user.total_earnings || 0) - user.withdrawn_amount;
    }


    return NextResponse.json({ availableBalance });
  } catch (error) {
    console.error('🚨 [available-balance] Error calculating available balance:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}