import { NextResponse } from 'next/server';
import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

export async function POST(req) {
  const { plan, email } = await req.json();
  const VARIANT_IDS = {
    professional: 894382,
    enterprise: 894370,
  };
  const variantId = VARIANT_IDS[plan];
  if (!variantId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  if (!process.env.LEMONSQUEEZY_API_KEY || !process.env.LEMONSQUEEZY_STORE_ID) {
    return NextResponse.json({ error: 'Missing Lemon Squeezy config' }, { status: 500 });
  }

  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });

  try {
    const checkout = await createCheckout(process.env.LEMONSQUEEZY_STORE_ID, variantId, {
      checkoutData: { email },
      productOptions: {
        enabledVariants: [variantId],
        redirectUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
    });
    const url = checkout.data?.data?.attributes?.url;
    if (!url) return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 