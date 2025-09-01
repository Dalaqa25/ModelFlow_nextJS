import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { modelDB, userDB, purchaseDB } from "@/lib/db/supabase-db";
import { createCheckoutUrl } from "@/lib/lemon/server";

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    try {
        const user = await getSupabaseUser();

        console.log('=== PURCHASE DEBUG START ===');
        console.log('User from getSupabaseUser():', user ? {
            id: user.id,
            email: user.email,
            aud: user.aud,
            role: user.role
        } : 'null');

        if (!user) {
            console.log('❌ No user found - returning 401');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the model - await params in Next.js 15
        const { id } = await params;
        console.log('Model ID from params:', id);
        
        const model = await modelDB.getModelById(id);
        console.log('Model from database:', model ? {
            id: model.id,
            name: model.name,
            author_email: model.author_email,
            price: model.price
        } : 'null');
        
        if (!model) {
            console.log('❌ Model not found - returning 404');
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // Check if user is the author
        console.log('🔍 Checking ownership:');
        console.log('  - User email:', user.email);
        console.log('  - Model author email:', model.author_email);
        console.log('  - Are they equal?', model.author_email === user.email);
        console.log('  - Email comparison (strict):', JSON.stringify(model.author_email) === JSON.stringify(user.email));
        
        if (model.author_email === user.email) {
            console.log('❌ User is the author - cannot purchase own model');
            console.log('=== PURCHASE DEBUG END ===');
            return NextResponse.json({ error: "You cannot purchase your own model" }, { status: 400 });
        }

        console.log('✅ User is not the author - proceeding with purchase');

        // Find the user document
        const userDoc = await userDB.getUserByEmail(user.email);
        console.log('User document from database:', userDoc ? {
            id: userDoc.id,
            email: userDoc.email,
            name: userDoc.name
        } : 'null');
        
        if (!userDoc) {
            console.log('❌ User document not found - returning 404');
            console.log('=== PURCHASE DEBUG END ===');
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has already purchased this model
        const userPurchases = await purchaseDB.getPurchasedModelsByUser(user.email);
        console.log('User purchases:', userPurchases.length, 'purchases found');
        
        const alreadyPurchased = userPurchases.some(
            purchase => purchase.model_id === id
        );
        console.log('Already purchased?', alreadyPurchased);

        if (alreadyPurchased) {
            console.log('❌ Model already purchased - returning 400');
            console.log('=== PURCHASE DEBUG END ===');
            return NextResponse.json({ error: "You have already purchased this model" }, { status: 400 });
        }

        console.log('🛒 Creating Lemon Squeezy checkout URL...');
        
        // Create Lemon Squeezy checkout URL
        const checkoutUrl = await createCheckoutUrl({
            price: model.price, // Price in cents from database
            userEmail: user.email,
            userId: userDoc.id,
            modelId: model.id,
            modelName: model.name,
            authorEmail: model.author_email
        });

        console.log('Checkout URL created:', checkoutUrl ? 'Success' : 'Failed');

        if (!checkoutUrl) {
            console.log('❌ Failed to create checkout URL');
            console.log('=== PURCHASE DEBUG END ===');
            return NextResponse.json({
                error: "Failed to create checkout URL. Please check if the price is supported."
            }, { status: 500 });
        }

        console.log('✅ Purchase process completed successfully');
        console.log('=== PURCHASE DEBUG END ===');

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