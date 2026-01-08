import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase-db";

export async function POST(request) {
    try {
        const payload = await request.text();
        const event = JSON.parse(payload);

        // Handle payment success
        const eventType = event.type || event.event_type || "";
        if (eventType.includes("payment") && (eventType.includes("succeeded") || eventType.includes("completed") || eventType.includes("success"))) {
            const metadata = event.data?.metadata || event.metadata || {};
            
            if (!metadata?.user_email || !metadata?.credits) {
                console.error("Missing metadata in webhook");
                return NextResponse.json({ received: true, warning: "Missing metadata" });
            }

            const userEmail = metadata.user_email;
            const creditsToAdd = parseInt(metadata.credits, 10);

            // Get current user credits
            const { data: user, error: fetchError } = await supabase
                .from("users")
                .select("credits")
                .eq("email", userEmail)
                .single();

            if (fetchError) {
                console.error("Error fetching user:", fetchError);
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            const currentCredits = user?.credits || 0;
            const newCredits = currentCredits + creditsToAdd;

            // Update user credits
            const { error: updateError } = await supabase
                .from("users")
                .update({ credits: newCredits })
                .eq("email", userEmail);

            if (updateError) {
                console.error("Error updating credits:", updateError);
                return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
            }

            // Create a notification
            await supabase.from("notifications").insert({
                user_email: userEmail,
                title: "Credits Added!",
                message: `${creditsToAdd} credits have been added to your account.`,
                type: "payment",
                read: false,
            });
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
