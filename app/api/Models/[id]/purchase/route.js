import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db/prisma";

export async function POST(request, { params }) {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the model
        const { id } = params;
        const model = await prisma.model.findUnique({
            where: { id }
        });
        
        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // Check if user is the author
        if (model.authorEmail === user.email) {
            return NextResponse.json({ error: "You cannot purchase your own model" }, { status: 400 });
        }

        // Find the user document
        const userDoc = await prisma.user.findUnique({
            where: { email: user.email },
            include: { purchasedModels: true }
        });
        
        if (!userDoc) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has already purchased this model
        const alreadyPurchased = userDoc.purchasedModels.some(
            purchase => purchase.modelId === id
        );

        if (alreadyPurchased) {
            return NextResponse.json({ error: "You have already purchased this model" }, { status: 400 });
        }

        // Add the model to user's purchased models with price
        await prisma.purchasedModel.create({
            data: {
                modelId: model.id,
                userId: userDoc.id,
                price: model.price,
                purchasedAt: new Date()
            }
        });

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