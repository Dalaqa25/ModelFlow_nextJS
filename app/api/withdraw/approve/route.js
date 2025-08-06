import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import WithdrawalRequest from '@/lib/db/WithdrawalRequest';
import User from '@/lib/db/User';
import connect from '@/lib/db/connect';

export async function POST(request) {
  try {
    // Check authentication and admin status
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connect();

    // Check if user is admin (using email-based check for simplicity)
    if (supabaseUser.email !== 'g.dalaqishvili01@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { requestId } = await request.json();

    // Find the withdrawal request
    const withdrawal = await WithdrawalRequest.findById(requestId).populate('userId');
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // Update user's withdrawn amount and available balance
    const user = withdrawal.userId;
    const newWithdrawnAmount = (user.withdrawnAmount || 0) + withdrawal.amount;

    // Update user's withdrawn amount
    await User.findByIdAndUpdate(user._id, {
      withdrawnAmount: newWithdrawnAmount
    });

    // Update withdrawal request
    withdrawal.status = 'approved';
    withdrawal.approvedAt = new Date();
    await withdrawal.save();

    return NextResponse.json(withdrawal);

  } catch (error) {
    console.error('Error approving withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}