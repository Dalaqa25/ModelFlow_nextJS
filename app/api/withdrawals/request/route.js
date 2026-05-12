import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MIN_WITHDRAWAL_USD = 100.00;
const PLATFORM_FEE_PERCENT = 0.20; // 20%

/**
 * POST /api/withdrawals/request
 * User requests a withdrawal
 */
export async function POST(request) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, payment_info } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Validate payment info
    if (!payment_info || !payment_info.method) {
      return NextResponse.json({ error: 'Payment details are required' }, { status: 400 });
    }

    // Check minimum withdrawal
    if (amount < MIN_WITHDRAWAL_USD) {
      return NextResponse.json(
        { 
          error: 'Amount below minimum',
          message: `Minimum withdrawal is $${MIN_WITHDRAWAL_USD.toFixed(2)}`,
          minimum: MIN_WITHDRAWAL_USD
        },
        { status: 400 }
      );
    }

    // Get user's earnings data (query by email — auth.users.id !== public.users.id)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, total_earnings_usd, withdrawn_usd')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const publicUserId = userData.id;

    // Calculate available balance
    const totalEarnings = parseFloat(userData.total_earnings_usd) || 0;
    const totalWithdrawn = parseFloat(userData.withdrawn_usd) || 0;
    
    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('token_transactions')
      .select('usd_amount')
      .eq('user_id', publicUserId)
      .eq('transaction_type', 'withdrawal_pending')
      .eq('status', 'pending');

    const pendingAmount = pendingWithdrawals?.reduce(
      (sum, w) => sum + parseFloat(w.usd_amount),
      0
    ) || 0;

    const available = totalEarnings - totalWithdrawn - pendingAmount;

    // Check if user has enough
    if (available < amount) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance',
          message: `You have $${available.toFixed(2)} available. You're trying to withdraw $${amount.toFixed(2)}.`,
          available,
          requested: amount
        },
        { status: 400 }
      );
    }

    // Calculate platform fee
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const payoutAmount = amount - platformFee;

    // Create withdrawal transaction
    const { data: withdrawal, error: insertError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: publicUserId,
        transaction_type: 'withdrawal_pending',
        token_amount: 0,
        usd_amount: amount,
        paddle_fee_amount: platformFee,
        status: 'pending',
        metadata: {
          payout_amount: payoutAmount,
          requested_at: new Date().toISOString(),
          user_email: userData.email,
          payment_info: payment_info  // Wise @tag or bank details
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Withdrawal Request] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    // TODO: Send notification to admin (email, Slack, etc.)
    console.log('[Withdrawal Request] New withdrawal request:', {
      user: userData.email,
      amount,
      payout: payoutAmount,
      withdrawal_id: withdrawal.id
    });

    return NextResponse.json({
      success: true,
      withdrawal_id: withdrawal.id,
      requested_amount: amount,
      platform_fee: platformFee,
      payout_amount: payoutAmount,
      status: 'pending',
      message: 'Withdrawal request submitted successfully. An admin will review it shortly.'
    });

  } catch (error) {
    console.error('[Withdrawal Request] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal request', message: error.message },
      { status: 500 }
    );
  }
}
