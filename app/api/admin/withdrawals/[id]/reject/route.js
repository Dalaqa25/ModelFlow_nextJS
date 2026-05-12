import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com'];

/**
 * POST /api/admin/withdrawals/[id]/reject
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
    const body = await request.json();
    const { reason } = body;

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('id', id)
      .eq('transaction_type', 'withdrawal_pending')
      .eq('status', 'pending')
      .single();

    if (withdrawalError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found or already processed' },
        { status: 404 }
      );
    }

    // Update transaction status to failed
    await supabase
      .from('token_transactions')
      .update({
        status: 'failed',
        metadata: {
          ...withdrawal.metadata,
          rejected_by: user.email,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || 'No reason provided'
        }
      })
      .eq('id', id);

    console.log('[Admin Reject] Withdrawal rejected:', {
      withdrawal_id: id,
      user_id: withdrawal.user_id,
      amount: withdrawal.usd_amount,
      reason
    });

    // TODO: Send notification to user (email)

    return NextResponse.json({
      success: true,
      withdrawal_id: id,
      message: 'Withdrawal rejected'
    });

  } catch (error) {
    console.error('[Admin Reject] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reject withdrawal', message: error.message },
      { status: 500 }
    );
  }
}
