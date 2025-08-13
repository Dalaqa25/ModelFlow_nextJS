import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { purchaseDB } from "@/lib/db/supabase-db";

export async function GET() {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const purchasedModels = await purchaseDB.getPurchasedModelsByUser(user.email);
        
        // Filter out archived models and return only active ones
        const activeModels = purchasedModels.filter(purchase => purchase.model && !purchase.model.archived);
        
        return NextResponse.json(activeModels);
    } catch (error) {
        console.error('Error fetching purchased models:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}