import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { modelDB, userDB, purchaseDB } from "@/lib/db/supabase-db";
import { createCheckoutUrl } from "@/lib/lemon/server";

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    try {
        const user = await getSupabaseUser();

        console.log(user ? {
            id: user.id,
            email: user.email,
            aud: user.aud,
            role: user.role
        } : 'null');

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the model - await params in Next.js 15
        const { id } = await params;
        
        const model = await modelDB.getModelById(id);
        console.log(model ? {
            id: model.id,
            name: model.name,
            author_email: model.author_email,
            price: model.price
        } : 'null');
        
        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // Check if user is the author
        
        if (model.author_email === user.email) {
            return NextResponse.json({ error: "You cannot purchase your own model" }, { status: 400 });
        }


        // Find the user document
        const userDoc = await userDB.getUserByEmail(user.email);
        console.log(userDoc ? {
            id: userDoc.id,
            email: userDoc.email,
            name: userDoc.name
        } : 'null');
        
        if (!userDoc) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has already purchased this model
        const userPurchases = await purchaseDB.getPurchasedModelsByUser(user.email);
        
        const alreadyPurchased = userPurchases.some(
            purchase => purchase.model_id === id
        );

        if (alreadyPurchased) {
            return NextResponse.json({ error: "You have already purchased this model" }, { status: 400 });
        }

        
        // Create Lemon Squeezy checkout URL
        const checkoutUrl = await createCheckoutUrl({
            price: model.price, // Price in cents from database
            userEmail: user.email,
            userId: userDoc.id,
            modelId: model.id,
            modelName: model.name,
            authorEmail: model.author_email
        });


        if (!checkoutUrl) {
            return NextResponse.json({
                error: "Failed to create checkout URL. Please check if the price is supported."
            }, { status: 500 });
        }


        return NextResponse.json({
            message: "Checkout URL created successfully",
            checkoutUrl: checkoutUrl,
            model: {
                id: model.id,
                name: model.name,
                price: model.price,
                priceInDollars: (model.price / 100).toFixed(2) // Convert cents to dollars for display
            }
        });
    } catch (error) {
        console.error("=== PURCHASE ERROR ===");
        console.error("Error purchasing model:", error);
        console.error("Stack trace:", error.stack);
        console.error("=== PURCHASE ERROR END ===");
        return NextResponse.json({
            error: "Failed to purchase model",
            details: error.message
        }, { status: 500 });
    }
}