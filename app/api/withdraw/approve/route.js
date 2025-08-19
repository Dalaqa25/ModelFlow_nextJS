import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import { withdrawalDB, userDB } from '@/lib/db/supabase-db';

export async function POST(request) {
  try {
    // Check authentication and admin status
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (using email-based check for simplicity)
    if (supabaseUser.email !== 'g.dalaqishvili01@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { requestId } = await request.json();

    // Find the withdrawal request
    const withdrawal = await withdrawalDB.getWithdrawalById(requestId);
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // Get the user
    const user = await userDB.getUserByEmail(withdrawal.user_email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user's withdrawn amount
    const newWithdrawnAmount = (user.withdrawn_amount || 0) + withdrawal.amount;
    await userDB.updateUser(user.email, { withdrawn_amount: newWithdrawnAmount });

    // Update withdrawal request status
    const updatedWithdrawal = await withdrawalDB.updateWithdrawalStatus(requestId, 'approved');

    return NextResponse.json(updatedWithdrawal);

  } catch (error) {
    console.error('Error approving withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}