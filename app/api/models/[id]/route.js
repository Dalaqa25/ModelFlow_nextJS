// /app/api/models/[id]/route.js
import { modelDB, supabase } from "@/lib/db/supabase-db";
import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";

export async function GET(_req, { params }) {
    try {
        const { id } = await params;

        // Try to find in regular models first
        const model = await modelDB.getModelById(id);

        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }
        
        // Transform the data to include camelCase field names for frontend compatibility
        const transformedModel = {
            ...model,
            authorEmail: model.author_email, // Add camelCase version
            createdAt: model.created_at // Add camelCase version for consistency
        };
        
        return NextResponse.json(transformedModel);
    } catch (error) {
        console.error("Error fetching model:", error);
        return NextResponse.json({ error: "Error fetching model" }, { status: 500 });
    }
}

export async function DELETE(_req, { params }) {
    try {
        const { id } = await params;

        await modelDB.deleteModel(id);

        return NextResponse.json({ message: 'Model deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH handler removed: editing models is no longer allowed.