import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import connect from "@/lib/db/connect";
import User from "@/lib/db/User";
import Model from "@/lib/db/Model";
import ArchivedModel from "@/lib/db/ArchivedModel";
import mongoose from "mongoose";

export async function GET() {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();

        // Find the user and get purchased model IDs
        const userDoc = await User.findOne({ email: user.email });
        if (!userDoc) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const purchasedModels = userDoc.purchasedModels || [];
        const modelIds = purchasedModels.map(pm => pm.modelId?.toString());

        // Fetch all active models
        const models = await Model.find({ _id: { $in: modelIds } });
        const foundModelIds = models.map(m => m._id.toString());

        // Find missing IDs (archived)
        const missingIds = modelIds.filter(id => !foundModelIds.includes(id)).map(id => new mongoose.Types.ObjectId(id));
        let archivedModels = [];
        if (missingIds.length > 0) {
            console.log('missingIds:', missingIds);
            console.log('user.email:', user.email);
            // Debug: log the actual archived document for the first missingId
            const debugDoc = await ArchivedModel.findOne({ _id: missingIds[0] });
            console.log('Debug archived doc:', debugDoc);
            if (debugDoc) {
                console.log('purchasedBy:', debugDoc.purchasedBy, Array.isArray(debugDoc.purchasedBy));
            }
            // Temporarily remove purchasedBy filter for debugging
            archivedModels = await ArchivedModel.find({
                _id: { $in: missingIds }
            });
            console.log('archivedModels (no purchasedBy filter):', archivedModels);
        }
        const archivedModelMap = Object.fromEntries(archivedModels.map(m => [m._id.toString(), m]));
        const modelMap = Object.fromEntries(models.map(m => [m._id.toString(), m]));

        // Compose the response, marking archived models
        const result = purchasedModels.map(purchase => {
            if (!purchase.modelId) return null;
            const model = modelMap[purchase.modelId.toString()];
            if (model) {
                return {
                    ...model.toObject(),
                    purchasedAt: purchase.purchasedAt,
                    price: purchase.price,
                    archived: false
                };
            }
            const archived = archivedModelMap[purchase.modelId.toString()];
            if (archived) {
                return {
                    ...archived.toObject(),
            purchasedAt: purchase.purchasedAt,
                    price: purchase.price,
                    archived: true
                };
            }
            // If not found in either, skip
            return null;
        }).filter(Boolean);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching purchased models:", error);
        return NextResponse.json({ error: "Failed to fetch purchased models" }, { status: 500 });
    }
} 