import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import clientPromise from "@/lib/mongodb";
import Model from "@/lib/db/Model";
import User from "@/lib/db/User";

export async function POST(request, { params }) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await clientPromise;

        // Find the model
        const { id } = params;
        const model = await Model.findById(id);
        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // Check if user is the author
        if (model.authorEmail === user.email) {
            return NextResponse.json({ error: "You cannot purchase your own model" }, { status: 400 });
        }

        // Find the user document
        const userDoc = await User.findOne({ email: user.email });
        if (!userDoc) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Initialize purchasedModels array if it doesn't exist
        if (!userDoc.purchasedModels) {
            userDoc.purchasedModels = [];
        }

        // Check if user has already purchased this model
        const alreadyPurchased = userDoc.purchasedModels.some(
            purchase => purchase.modelId.toString() === id
        );

        if (alreadyPurchased) {
            return NextResponse.json({ error: "You have already purchased this model" }, { status: 400 });
        }

        // Add the model to user's purchased models with price
        userDoc.purchasedModels.push({
            modelId: model._id,
            purchasedAt: new Date(),
            price: model.price
        });

        await userDoc.save();

        return NextResponse.json({ 
            message: "Model purchased successfully",
            model: {
                id: model._id,
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