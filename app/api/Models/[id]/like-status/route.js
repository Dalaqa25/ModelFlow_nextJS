import { NextResponse } from "next/server";
import { modelDB, modelLikeDB } from "@/lib/db/supabase-db";
import { getSupabaseUser } from "@/lib/auth-utils";

export async function GET(req, { params }) {
    try {
        const user = await getSupabaseUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const model = await modelDB.getModelById(id);
        
        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        const userEmail = user.email;
        const isLiked = await modelLikeDB.hasUserLikedModel(id, userEmail);
        const likeCount = await modelLikeDB.getLikeCount(id);

        return NextResponse.json({ 
            isLiked,
            likes: likeCount
        });
    } catch (error) {
        console.error("Error checking like status:", error);
        return NextResponse.json({ error: "Error checking like status" }, { status: 500 });
    }
}
