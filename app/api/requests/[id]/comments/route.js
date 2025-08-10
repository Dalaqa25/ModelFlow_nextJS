import { NextResponse } from 'next/server';
import { prisma } from "@/lib/db/prisma";
import { getSupabaseUser } from "@/lib/auth-utils";

export async function POST(req, { params }) {
    try {
        const user = await getSupabaseUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        
        // Verify request exists
        const request = await prisma.request.findUnique({
            where: { id }
        });
        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                requestId: id,
                authorEmail: user.email
            }
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Error creating comment" }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        const { id } = params;
        
        const comments = await prisma.comment.findMany({
            where: { requestId: id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Error fetching comments" }, { status: 500 });
    }
}