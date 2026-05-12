import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify Paddle webhook signature
 * Paddle Billing uses ts and h1 format
 */
function verifyPaddleSignature(rawBody, signatureHeader, secret) {
  try {
    // Parse signature header: "ts=123456;h1=abc123..."
    const parts = signatureHeader.split(';');
    const timestamp = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const signature = parts.find(p => p.startsWith('h1='))?.split('=')[1];

    if (!timestamp || !signature) {
      console.error('[Paddle] Invalid signature format');
      return false;
    }

    // Build signed payload: timestamp:rawBody
    const signedPayload = `${timestamp}:${rawBody}`;

    // Generate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signedPayload);
    const expectedSignature = hmac.digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Paddle] Signature verification error:', error);
    return false;
  }
}

/**
 * Token package mapping
 * Maps price IDs to token amounts
 */
const PRICE_TO_TOKENS = {
  'pri_01kr93twpd5gvervx27h96dr0r': { tokens: 50, bonus: 0, name: 'Starter' },
  'pri_01kr93x944txbdqb44ht5718bn': { tokens: 100, bonus: 0, name: 'Basic' },
  'pri_01kr93z5dfrn7cp6bcmjrxw7ys': { tokens: 210, bonus: 10, name: 'Popular' },
  'pri_01kr9418abadpb6t2rse4khcfv': { tokens: 550, bonus: 50, name: 'Pro' },
};

/**
 * POST /api/paddle/webhook
 * Handle Paddle webhook events
 */
export async function POST(request) {
  try {
    console.log('[Paddle Webhook] === WEBHOOK RECEIVED ===');
    
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature');
    
    console.log('[Paddle Webhook] Signature header:', signature);
    console.log('[Paddle Webhook] Body length:', rawBody.length);
    
    // Verify webhook signature
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Paddle Webhook] PADDLE_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    if (!signature) {
      console.error('[Paddle Webhook] No signature provided');
      return new Response('No signature', { status: 401 });
    }

    // Verify signature
    const isValid = verifyPaddleSignature(rawBody, signature, webhookSecret);
    console.log('[Paddle Webhook] Signature valid:', isValid);
    
    if (!isValid) {
      console.error('[Paddle Webhook] Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse webhook data
    const event = JSON.parse(rawBody);
    console.log('[Paddle Webhook] Event type:', event.event_type);
    console.log('[Paddle Webhook] Event data:', JSON.stringify(event, null, 2));

    // Handle different event types
    switch (event.event_type) {
      case 'transaction.completed':
      case 'transaction.paid':
        await handleSuccessfulPayment(event.data);
        break;

      case 'transaction.payment_failed':
        await handleFailedPayment(event.data);
        break;

      default:
        console.log('[Paddle Webhook] Unhandled event type:', event.event_type);
    }

    console.log('[Paddle Webhook] === WEBHOOK PROCESSED SUCCESSFULLY ===');
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Paddle Webhook] === ERROR ===');
    console.error('[Paddle Webhook] Error message:', error.message);
    console.error('[Paddle Webhook] Error stack:', error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle successful payment
 * Credit tokens to user account
 */
async function handleSuccessfulPayment(transaction) {
  try {
    console.log('[Paddle] Processing successful payment:', transaction.id);

    // Extract data from transaction
    const priceId = transaction.items[0]?.price?.id;
    const customData = transaction.custom_data || {};
    const userId = customData.user_id;
    const customerEmail = transaction.customer?.email;
    const paddleTransactionId = transaction.id;

    if (!userId) {
      console.error('[Paddle] No user_id in custom_data');
      return;
    }

    // IDEMPOTENCY CHECK: Check if this transaction was already processed
    const { data: existingTransaction } = await supabase
      .from('token_transactions')
      .select('id')
      .eq('paddle_transaction_id', paddleTransactionId)
      .single();

    if (existingTransaction) {
      console.log('[Paddle] Transaction already processed, skipping:', paddleTransactionId);
      return; // Already processed, don't credit again
    }

    // Get token package info
    const packageInfo = PRICE_TO_TOKENS[priceId];
    if (!packageInfo) {
      console.error('[Paddle] Unknown price ID:', priceId);
      return;
    }

    const { tokens, bonus, name } = packageInfo;
    const totalTokens = tokens;

    // Get current user token balance
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('token_balance')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[Paddle] Error fetching user:', fetchError);
      return;
    }

    const currentBalance = user?.token_balance || 0;
    const newBalance = currentBalance + totalTokens;

    // Update user token balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ token_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('[Paddle] Error updating token balance:', updateError);
      return;
    }

    // Record transaction in database
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'purchase',
        token_amount: totalTokens,
        bonus_tokens: bonus,
        usd_amount: transaction.details.totals.total / 100, // Convert cents to dollars
        paddle_transaction_id: paddleTransactionId,
        paddle_fee_amount: (transaction.details.totals.fee || 0) / 100,
        status: 'completed',
        metadata: {
          package_name: name,
          price_id: priceId,
          customer_email: customerEmail
        }
      });

    if (transactionError) {
      console.error('[Paddle] Error recording transaction:', transactionError);
    }

    console.log(`[Paddle] Successfully credited ${totalTokens} tokens to user ${userId}`);
    console.log(`[Paddle] New balance: ${newBalance} tokens`);

  } catch (error) {
    console.error('[Paddle] Error in handleSuccessfulPayment:', error);
  }
}

/**
 * Handle failed payment
 * Log the failure for debugging
 */
async function handleFailedPayment(transaction) {
  console.log('[Paddle] Payment failed:', transaction.id);
  
  // Optionally: Record failed payment attempt
  const customData = transaction.custom_data || {};
  const userId = customData.user_id;

  if (userId) {
    await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'purchase',
        token_amount: 0,
        usd_amount: transaction.details.totals.total / 100,
        paddle_transaction_id: transaction.id,
        status: 'failed',
        metadata: {
          error: transaction.status,
          reason: 'Payment failed'
        }
      });
  }
}
