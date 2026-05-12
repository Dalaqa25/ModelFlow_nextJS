import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com'];

/**
 * GET /api/admin/withdrawals/pending
 */
export async function GET(request) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get all pending withdrawals
    const { data: pendingWithdrawals, error: withdrawalsError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('transaction_type', 'withdrawal_pending')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (withdrawalsError) {
      console.error('[Admin Withdrawals] Error fetching withdrawals:', withdrawalsError);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      );
    }

    // For each withdrawal, get verification data
    const withdrawalsWithVerification = await Promise.all(
      pendingWithdrawals.map(async (withdrawal) => {
        // Get user info
        const { data: userInfo } = await supabase
          .from('users')
          .select('id, email, name, total_earnings_usd, withdrawn_usd')
          .eq('id', withdrawal.user_id)
          .single();

        if (!userInfo) {
          return null;
        }

        // Calculate cached available
        const cachedEarnings = parseFloat(userInfo.total_earnings_usd) || 0;
        const cachedWithdrawn = parseFloat(userInfo.withdrawn_usd) || 0;
        const cachedAvailable = cachedEarnings - cachedWithdrawn;

        // Get all transactions for verification
        const { data: transactions } = await supabase
          .from('token_transactions')
          .select('transaction_type, usd_amount, status')
          .eq('user_id', withdrawal.user_id);

        // Calculate TRUE earnings from transactions
        const trueEarnings = transactions
          ?.filter(t => t.transaction_type === 'earning' && t.status === 'completed')
          .reduce((sum, t) => sum + parseFloat(t.usd_amount), 0) || 0;

        // Calculate TRUE withdrawals (completed only, not pending)
        const trueWithdrawn = transactions
          ?.filter(t => t.transaction_type === 'withdrawal_completed' && t.status === 'completed')
          .reduce((sum, t) => sum + parseFloat(t.usd_amount), 0) || 0;

        const trueAvailable = trueEarnings - trueWithdrawn;

        // Check if legitimate
        const isLegitimate = trueAvailable >= parseFloat(withdrawal.usd_amount);
        const mismatch = Math.abs(cachedAvailable - trueAvailable) > 0.01;

        // Get earning history
        const { data: earningHistory } = await supabase
          .from('token_transactions')
          .select('created_at, usd_amount, metadata')
          .eq('user_id', withdrawal.user_id)
          .eq('transaction_type', 'earning')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(20);

        // Get previous withdrawal history
        const { data: withdrawalHistory } = await supabase
          .from('token_transactions')
          .select('created_at, usd_amount, paddle_fee_amount, status')
          .eq('user_id', withdrawal.user_id)
          .eq('transaction_type', 'withdrawal_completed')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        return {
          withdrawal_id: withdrawal.id,
          user: {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name
          },
          request: {
            amount: parseFloat(withdrawal.usd_amount),
            platform_fee: parseFloat(withdrawal.paddle_fee_amount),
            payout: withdrawal.metadata?.payout_amount || 0,
            requested_at: withdrawal.created_at,
            payment_info: withdrawal.metadata?.payment_info || null
          },
          verification: {
            is_legitimate: isLegitimate,
            has_mismatch: mismatch,
            cached_earnings: cachedEarnings,
            true_earnings: trueEarnings,
            cached_withdrawn: cachedWithdrawn,
            true_withdrawn: trueWithdrawn,
            cached_available: cachedAvailable,
            true_available: trueAvailable,
            fraud_risk: isLegitimate && !mismatch ? 'low' : 'high'
          },
          earning_history: earningHistory?.map(e => ({
            date: e.created_at,
            amount: parseFloat(e.usd_amount),
            automation: e.metadata?.automation_name,
            runner: e.metadata?.runner_email
          })) || [],
          withdrawal_history: withdrawalHistory?.map(w => ({
            date: w.created_at,
            amount: parseFloat(w.usd_amount),
            fee: parseFloat(w.paddle_fee_amount),
            payout: parseFloat(w.usd_amount) - parseFloat(w.paddle_fee_amount),
            status: w.status
          })) || []
        };
      })
    );

    // Filter out nulls
    const validWithdrawals = withdrawalsWithVerification.filter(w => w !== null);

    return NextResponse.json({
      withdrawals: validWithdrawals,
      total_pending: validWithdrawals.length
    });

  } catch (error) {
    console.error('[Admin Withdrawals] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending withdrawals', message: error.message },
      { status: 500 }
    );
  }
}
