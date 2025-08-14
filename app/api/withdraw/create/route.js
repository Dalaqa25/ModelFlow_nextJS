import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import { userDB, withdrawalDB } from '@/lib/db/supabase-db';

export async function POST(request) {
  try {
    // Check authentication
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user from our database
    const user = await userDB.getUserByEmail(supabaseUser.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { paypalEmail, amount } = body;

    // Validate required fields
    if (!paypalEmail || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: paypalEmail and amount are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate amount (should be positive)
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Create new withdrawal request
    const withdrawalRequest = await withdrawalDB.createWithdrawalRequest({
      user_email: user.email,
      paypal_email: paypalEmail,
      amount,
      status: 'pending'
    });

    return NextResponse.json(
      {
        message: 'Withdrawal request submitted successfully',
        requestId: withdrawalRequest.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}