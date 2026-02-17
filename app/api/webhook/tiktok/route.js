import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * TikTok Webhook Handler
 * Receives events from TikTok (comments, video published, etc.)
 */
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-tiktok-signature');
    
    console.log('[TikTok Webhook] Received event');

    // Verify TikTok signature (if configured)
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (clientSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', clientSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[TikTok Webhook] Invalid signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    // Parse the event
    const event = JSON.parse(body);
    console.log('[TikTok Webhook] Event type:', event.type || event.event);

    // Store the event in database for automations to process
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'tiktok',
        event_type: event.type || event.event || 'unknown',
        payload: event,
        received_at: new Date().toISOString()
      });

    if (error) {
      console.error('[TikTok Webhook] Failed to store event:', error);
      // Still return 200 to TikTok so they don't retry
    }

    // Return success to TikTok
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[TikTok Webhook] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle GET requests (for TikTok webhook verification)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  // TikTok sends a challenge parameter to verify the webhook URL
  if (challenge) {
    console.log('[TikTok Webhook] Verification challenge received');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return new Response('TikTok Webhook Endpoint', { status: 200 });
}
