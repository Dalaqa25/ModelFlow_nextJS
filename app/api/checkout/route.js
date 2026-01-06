import { dodopayments } from "@/lib/dodo-payments";
import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase-server";

// Product IDs from Dodo Dashboard
const CREDIT_PRODUCTS = {
    1000: process.env.DODO_PRODUCT_1000_CREDITS,   // 1000 credits = $10
    3000: process.env.DODO_PRODUCT_3000_CREDITS,   // 3000 credits = $25
    6000: process.env.DODO_PRODUCT_6000_CREDITS,   // 6000 credits = $45
};

export async function POST(request) {
    try {
        const supabase = await createServerComponentClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { credits } = await request.json();
        const productId = CREDIT_PRODUCTS[credits];

        if (!productId) {
            return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
        }

        // Create checkout session
        const session = await dodopayments.checkoutSessions.create({
            product_cart: [
                {
                    product_id: productId,
                    quantity: 1,
                }
            ],
            customer: {
                email: user.email,
                name: user.user_metadata?.name || user.email,
            },
            return_url: process.env.DODO_PAYMENTS_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/main`,
            metadata: {
                user_id: user.id,
                user_email: user.email,
                credits: credits.toString(),
            },
        });

        return NextResponse.json({ 
            checkout_url: session.url || session.checkout_url || session.payment_link,
            session_id: session.id || session.session_id
        });

    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }
}
