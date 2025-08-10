import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSupabaseUser } from "@/lib/auth-utils";

export async function POST(req, { params }) {
    try {
        const user = await getSupabaseUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const model = await prisma.model.findUnique({
            where: { id: params.id }
        });

        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // Check if user has already liked the model
        if (model.likedBy.includes(user.email)) {
            return NextResponse.json({ error: "Already liked" }, { status: 400 });
        }

        // Add user's email to likedBy array and increment likes count
        const updatedModel = await prisma.model.update({
            where: { id: params.id },
            data: {
                likedBy: {
                    push: user.email
                },
                likes: {
                    increment: 1
                }
            }
        });

        return NextResponse.json({ likes: updatedModel.likes });
    } catch (error) {
        console.error("Error liking model:", error);
        return NextResponse.json({ error: "Error liking model" }, { status: 500 });
    }
}