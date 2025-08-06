import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import User from '@/lib/db/User';
import connect from '@/lib/db/connect';

export async function GET() {
  try {
    // Check authentication
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connect();
    
    // Get the user from our database
    const user = await User.findOne({ authId: supabaseUser.id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Calculate available balance dynamically
    let availableBalance;
    if (user.withdrawnAmount === 0 || !user.withdrawnAmount) {
      availableBalance = user.totalEarnings;
    } else {
      availableBalance = user.totalEarnings - user.withdrawnAmount;
    }
    
    return NextResponse.json({ availableBalance });
  } catch (error) {
    console.error('Error calculating available balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}