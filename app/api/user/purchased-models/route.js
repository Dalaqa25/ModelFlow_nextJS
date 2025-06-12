import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import connect from "@/lib/db/connect";
import User from "@/lib/db/User";
import Model from "@/lib/db/Model";

export async function GET() {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();

        // Find the user and populate the purchased models
        const userDoc = await User.findOne({ email: user.email })
            .populate({
                path: 'purchasedModels.modelId',
                model: 'Model'
            });

        if (!userDoc) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Transform the data to include model details
        const purchasedModels = userDoc.purchasedModels.map(purchase => ({
            ...purchase.modelId.toObject(),
            purchasedAt: purchase.purchasedAt,
            price: purchase.price
        }));

        return NextResponse.json(purchasedModels);
    } catch (error) {
        console.error("Error fetching purchased models:", error);
        return NextResponse.json({ error: "Failed to fetch purchased models" }, { status: 500 });
    }
} 