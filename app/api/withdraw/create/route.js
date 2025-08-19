import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import { userDB, withdrawalDB } from '@/lib/db/supabase-db';

export async function POST(request) {
  try {
    console.log('🔄 Starting withdrawal request processing...');

    // Check authentication
    const supabaseUser = await getSupabaseUser();
    console.log('👤 Supabase user check:', supabaseUser ? 'Found' : 'Not found');
    if (!supabaseUser) {
      console.log('❌ Authentication failed - no supabase user');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user from our database
    console.log('🔍 Looking up user by email:', supabaseUser.email);
    const user = await userDB.getUserByEmail(supabaseUser.email);
    console.log('👤 Database user lookup result:', user ? 'Found' : 'Not found');
    if (!user) {
      console.log('❌ User not found in database for email:', supabaseUser.email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('📥 Parsing request body...');
    const body = await request.json();
    const { paypalEmail, amount } = body;
    console.log('📋 Request data:', { paypalEmail, amount, userEmail: user.email });

    // Validate required fields
    if (!paypalEmail || !amount) {
      console.log('❌ Missing required fields:', { paypalEmail: !!paypalEmail, amount: !!amount });
      return NextResponse.json(
        { error: 'Missing required fields: paypalEmail and amount are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail)) {
      console.log('❌ Invalid email format:', paypalEmail);
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate amount (should be positive)
    if (amount <= 0) {
      console.log('❌ Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check user's available balance
    console.log('💰 Checking user balance...');
    console.log('User total earnings:', user.total_earnings);
    console.log('User withdrawn amount:', user.withdrawn_amount);

    const availableBalance = (user.total_earnings || 0) - (user.withdrawn_amount || 0);
    console.log('💰 Available balance:', availableBalance);

    if (amount > availableBalance) {
      console.log('❌ Insufficient balance. Requested:', amount, 'Available:', availableBalance);
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${(availableBalance / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create new withdrawal request
    console.log('💾 Creating withdrawal request in database...');
    const withdrawalData = {
      user_email: user.email,
      amount,
      status: 'pending',
      payment_method: 'paypal',
      payment_details: {
        paypal_email: paypalEmail
      }
    };
    console.log('📋 Withdrawal data to insert:', withdrawalData);

    const withdrawalRequest = await withdrawalDB.createWithdrawalRequest(withdrawalData);
    console.log('✅ Withdrawal request created successfully:', withdrawalRequest);

    return NextResponse.json(
      {
        message: 'Withdrawal request submitted successfully',
        requestId: withdrawalRequest.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('🚨 Error in withdrawal request creation:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);

    // Check if it's a database-related error
    if (error.code) {
      console.error('Database error code:', error.code);
    }

    // Check if it's a Supabase error
    if (error.details) {
      console.error('Supabase error details:', error.details);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}