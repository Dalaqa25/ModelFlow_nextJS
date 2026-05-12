import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const user = await getSupabaseUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from public.users by email (auth.users.id !== public.users.id)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, token_balance, total_earnings_usd, withdrawn_usd')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use public.users.id for all token_transactions queries
    const publicUserId = userData.id;

    const totalWithdrawn = parseFloat(userData.withdrawn_usd) || 0;

    // Calculate earnings from token_transactions as source of truth
    const { data: earningTxns } = await supabase
      .from('token_transactions')
      .select('usd_amount')
      .eq('user_id', publicUserId)
      .eq('transaction_type', 'earning')
      .eq('status', 'completed');

    const calculatedEarnings = earningTxns?.reduce(
      (sum, t) => sum + parseFloat(t.usd_amount || 0), 0
    ) || 0;

    // Sync cached value if out of date
    const cachedEarnings = parseFloat(userData.total_earnings_usd) || 0;
    if (calculatedEarnings > cachedEarnings) {
      await supabase
        .from('users')
        .update({ total_earnings_usd: calculatedEarnings })
        .eq('id', publicUserId);
    }

    const finalEarnings = Math.max(cachedEarnings, calculatedEarnings);
    const available = finalEarnings - totalWithdrawn;

    // Pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('token_transactions')
      .select('usd_amount')
      .eq('user_id', publicUserId)
      .eq('transaction_type', 'withdrawal_pending')
      .eq('status', 'pending');

    const pendingAmount = pendingWithdrawals?.reduce(
      (sum, w) => sum + parseFloat(w.usd_amount || 0), 0
    ) || 0;

    // Recent sales (earning transactions)
    const { data: recentEarnings } = await supabase
      .from('token_transactions')
      .select('created_at, usd_amount, metadata')
      .eq('user_id', publicUserId)
      .eq('transaction_type', 'earning')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    // Withdrawal history
    const { data: withdrawalHistory } = await supabase
      .from('token_transactions')
      .select('created_at, usd_amount, paddle_fee_amount, status, metadata')
      .eq('user_id', publicUserId)
      .in('transaction_type', ['withdrawal_pending', 'withdrawal_completed'])
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      token_balance: userData.token_balance,
      earnings: {
        total_usd: finalEarnings,
        withdrawn_usd: totalWithdrawn,
        available_usd: available,
        pending_usd: pendingAmount
      },
      recent_earnings: recentEarnings?.map(e => ({
        date: e.created_at,
        amount_usd: parseFloat(e.usd_amount),
        automation_name: e.metadata?.automation_name,
        runner_email: e.metadata?.runner_email
      })) || [],
      withdrawal_history: withdrawalHistory?.map(w => ({
        date: w.created_at,
        amount_usd: parseFloat(w.usd_amount),
        platform_fee_usd: parseFloat(w.paddle_fee_amount) || 0,
        payout_usd: w.metadata?.payout_amount || 0,
        status: w.status
      })) || []
    });

  } catch (error) {
    console.error('[Earnings API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings', message: error.message },
      { status: 500 }
    );
  }
}
