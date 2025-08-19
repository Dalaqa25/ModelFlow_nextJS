import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { modelDB, userDB, purchaseDB } from "@/lib/db/supabase-db";

export async function POST(request, { params }) {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the model
        const { id } = params;
        const model = await modelDB.getModelById(id);
        
        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // Check if user is the author
        if (model.author_email === user.email) {
            return NextResponse.json({ error: "You cannot purchase your own model" }, { status: 400 });
        }

        // Find the user document
        const userDoc = await userDB.getUserByEmail(user.email);
        
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

        // Create transaction record
        const transactionData = {
            buyer_email: user.email,
            seller_email: model.author_email,
            model_id: model.id,
            price: model.price,
            status: 'completed'
        };

        await purchaseDB.createPurchase(transactionData);

        return NextResponse.json({
            message: "Model purchased successfully",
            model: {
                id: model.id,
                name: model.name,
                price: model.price
            }
        });
    } catch (error) {
        console.error("Error purchasing model:", error);
        return NextResponse.json({
            error: "Failed to purchase model",
            details: error.message
        }, { status: 500 });
    }
}