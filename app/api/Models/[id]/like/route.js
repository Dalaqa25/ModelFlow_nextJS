import { NextResponse } from "next/server";
import { modelDB } from "@/lib/db/supabase-db";
import { getSupabaseUser } from "@/lib/auth-utils";

export async function POST(req, { params }) {
    try {
        const user = await getSupabaseUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const model = await modelDB.getModelById(params.id);

        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // For now, just increment the likes count
        // In the future, you might want to create a separate likes table to track who liked what
        const updatedModel = await modelDB.updateModel(params.id, {
            likes: (model.likes || 0) + 1
        });

        return NextResponse.json({ likes: updatedModel.likes });
    } catch (error) {
        console.error("Error liking model:", error);
        return NextResponse.json({ error: "Error liking model" }, { status: 500 });
    }
}