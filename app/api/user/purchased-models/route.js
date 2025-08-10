import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the user and get purchased models
        const userDoc = await prisma.user.findFirst({
            where: { email: user.email },
            include: {
                purchasedModels: true
            }
        });
        
        if (!userDoc) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const purchasedModels = userDoc.purchasedModels || [];
        const modelIds = purchasedModels.map(pm => pm.modelId);

        // Fetch all active models
        const models = await prisma.model.findMany({
            where: { id: { in: modelIds } }
        });
        const foundModelIds = models.map(m => m.id);

        // Find missing IDs (archived)
        const missingIds = modelIds.filter(id => !foundModelIds.includes(id));
        let archivedModels = [];
        if (missingIds.length > 0) {
            archivedModels = await prisma.archivedModel.findMany({
                where: {
                    id: { in: missingIds },
                    purchasedBy: { has: user.email }
                }
            });
        }
        
        const archivedModelMap = Object.fromEntries(archivedModels.map(m => [m.id, m]));
        const modelMap = Object.fromEntries(models.map(m => [m.id, m]));

        // Compose the response, marking archived models
        const result = purchasedModels.map(purchase => {
            if (!purchase.modelId) return null;
            const model = modelMap[purchase.modelId];
            if (model) {
                return {
                    ...model,
                    purchasedAt: purchase.purchasedAt,
                    price: purchase.price,
                    archived: false
                };
            }
            const archived = archivedModelMap[purchase.modelId];
            if (archived) {
                return {
                    ...archived,
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