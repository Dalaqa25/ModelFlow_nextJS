import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com'];

/**
 * POST /api/admin/withdrawals/[id]/approve
 */
export async function POST(request, { params }) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    console.log('[Admin Approve] Attempting to approve withdrawal id:', id);

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (withdrawalError || !withdrawal) {
      console.error('[Admin Approve] Withdrawal not found:', { id, withdrawalError });
      return NextResponse.json(
        { error: 'Withdrawal not found or already processed', id },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: `Withdrawal already processed (status: ${withdrawal.status})` },
        { status: 400 }
      );
    }

    // Get user info
    const { data: userInfo } = await supabase
      .from('users')
      .select('id, email, withdrawn_usd')
      .eq('id', withdrawal.user_id)
      .single();

    if (!userInfo) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO: Process payout via Paddle/Stripe
    // For now, we'll simulate it
    const payoutAmount = withdrawal.metadata?.payout_amount || 0;
    
    console.log('[Admin Approve] Processing payout:', {
      user: userInfo.email,
      amount: payoutAmount,
      withdrawal_id: id
    });

    // Simulate Paddle payout (replace with actual Paddle API call)
    const mockPayoutId = `payout_${Date.now()}`;
    
    // TODO: Uncomment and implement actual Paddle payout
    /*
    const paddle = require('@paddle/paddle-node-sdk');
    const paddleClient = new paddle.Paddle(process.env.PADDLE_API_KEY);
    
    const payout = await paddleClient.payouts.create({
      amount: Math.round(payoutAmount * 100), // Convert to cents
      currency: 'USD',
      recipient: {
        email: userInfo.email
      }
    });
    */

    // Update withdrawn_usd in users table
    const newWithdrawnAmount = parseFloat(userInfo.withdrawn_usd) + parseFloat(withdrawal.usd_amount);
    
    await supabase
      .from('users')
      .update({
        withdrawn_usd: newWithdrawnAmount
      })
      .eq('id', withdrawal.user_id);

    // Update transaction status
    await supabase
      .from('token_transactions')
      .update({
        transaction_type: 'withdrawal_completed',
        status: 'completed',
        metadata: {
          ...withdrawal.metadata,
          payout_id: mockPayoutId, // Replace with actual payout ID
          approved_by: user.email,
          approved_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', id);

    console.log('[Admin Approve] Withdrawal approved:', {
      withdrawal_id: id,
      user: userInfo.email,
      amount: withdrawal.usd_amount,
      payout: payoutAmount,
      payout_id: mockPayoutId
    });

    // TODO: Send notification to user (email)

    return NextResponse.json({
      success: true,
      withdrawal_id: id,
      payout_id: mockPayoutId,
      amount: parseFloat(withdrawal.usd_amount),
      payout_amount: payoutAmount,
      message: 'Withdrawal approved and payout processed'
    });

  } catch (error) {
    console.error('[Admin Approve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve withdrawal', message: error.message },
      { status: 500 }
    );
  }
}
