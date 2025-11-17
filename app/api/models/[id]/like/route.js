import { NextResponse } from "next/server";
import { modelDB, modelLikeDB } from "@/lib/db/supabase-db";
import { getSupabaseUser } from "@/lib/auth-utils";

export async function POST(req, { params }) {
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
        
        // Check if user has already liked this model
        const hasLiked = await modelLikeDB.hasUserLikedModel(id, userEmail);
        
        let isLiked, likeCount;
        
        if (hasLiked) {
            // Unlike the model
            await modelLikeDB.removeLike(id, userEmail);
            likeCount = await modelLikeDB.getLikeCount(id);
            
            // Update the likes count in the models table
            await modelDB.updateModel(id, {
                likes: likeCount
            });
            
            isLiked = false;
        } else {
            // Like the model
            await modelLikeDB.addLike(id, userEmail);
            likeCount = await modelLikeDB.getLikeCount(id);
            
            // Update the likes count in the models table
            await modelDB.updateModel(id, {
                likes: likeCount
            });
            
            isLiked = true;
        }

        return NextResponse.json({ 
            isLiked,
            likes: likeCount,
            message: isLiked ? 'Model liked successfully' : 'Model unliked successfully'
        });
    } catch (error) {
        console.error("Error toggling model like:", error);
        return NextResponse.json({ error: "Error toggling model like" }, { status: 500 });
    }
}
