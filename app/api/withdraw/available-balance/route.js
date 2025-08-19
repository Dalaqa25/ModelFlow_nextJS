import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import { userDB } from '@/lib/db/supabase-db';

export async function GET() {
  try {
    console.log('💰 [available-balance] Starting balance calculation...');

    // Check authentication
    const supabaseUser = await getSupabaseUser();
    console.log('👤 [available-balance] Supabase user check:', supabaseUser ? 'Found' : 'Not found');
    if (!supabaseUser) {
      console.log('❌ [available-balance] Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user from our database
    console.log('🔍 [available-balance] Looking up user:', supabaseUser.email);
    const user = await userDB.getUserByEmail(supabaseUser.email);
    console.log('👤 [available-balance] User data:', user);
    if (!user) {
      console.log('❌ [available-balance] User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate available balance dynamically
    console.log('💰 [available-balance] Calculating balance...');
    console.log('Total earnings:', user.total_earnings);
    console.log('Withdrawn amount:', user.withdrawn_amount);

    let availableBalance;
    if (user.withdrawn_amount === 0 || !user.withdrawn_amount) {
      availableBalance = user.total_earnings || 0;
    } else {
      availableBalance = (user.total_earnings || 0) - user.withdrawn_amount;
    }

    console.log('💰 [available-balance] Calculated available balance:', availableBalance);

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