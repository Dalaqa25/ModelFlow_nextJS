import { NextResponse } from "next/server";
import { updateUserSubscription } from "@/lib/lemon/subscription";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Lemon Squeezy Subscription Webhook received:", body);

    // Get event type
    const event = body.meta?.event_name;
    const subscription = body.data?.attributes;
    const customerEmail = subscription?.user_email || subscription?.customer_email;
    const status = subscription?.status || "active";
    const lemonSqueezySubscriptionId = body.data?.id;

    // Map Lemon Squeezy variant IDs to your plan names
    const VARIANT_TO_PLAN = {
      894382: "professional",
      894370: "enterprise"
    };
    const variantId = subscription?.variant_id;
    const plan = VARIANT_TO_PLAN[variantId] || "basic";

    if (!customerEmail) {
      return NextResponse.json({ error: "Missing customer email" }, { status: 400 });
    }

    // Handle subscription events
    if (["subscription_created", "subscription_updated", "subscription_resumed"].includes(event)) {
      await updateUserSubscription(customerEmail, plan, status, lemonSqueezySubscriptionId);
      return NextResponse.json({ message: "Subscription updated" }, { status: 200 });
    }
    if (["subscription_cancelled", "subscription_expired"].includes(event)) {
      await updateUserSubscription(customerEmail, "basic", "canceled", lemonSqueezySubscriptionId);
      return NextResponse.json({ message: "Subscription canceled" }, { status: 200 });
    }

    // Ignore unrelated events
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  } catch (error) {
    console.error("Subscription webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
