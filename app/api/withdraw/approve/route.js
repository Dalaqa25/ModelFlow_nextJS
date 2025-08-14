import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import { withdrawalDB } from '@/lib/db/supabase-db';

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
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // Update user's withdrawn amount and available balance
    const user = withdrawal.user;
    const newWithdrawnAmount = (user.withdrawnAmount || 0) + withdrawal.amount;

    // Update user's withdrawn amount
    await prisma.user.update({
      where: { id: user.id },
      data: { withdrawnAmount: newWithdrawnAmount }
    });

    // Update withdrawal request
    const updatedWithdrawal = await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        approvedAt: new Date()
      },
      include: { user: true }
    });

    return NextResponse.json(updatedWithdrawal);

  } catch (error) {
    console.error('Error approving withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}