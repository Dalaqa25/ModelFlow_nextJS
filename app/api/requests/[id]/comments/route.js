import { NextResponse } from 'next/server';
import { requestDB, requestCommentDB } from "@/lib/db/supabase-db";
import { getSupabaseUser } from "@/lib/auth-utils";

export async function POST(req, { params }) {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify request exists
        const request = await requestDB.getRequestById(id);
        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }

        const comment = await requestCommentDB.createComment({
            content: content.trim(),
            request_id: id,
            author_email: user.email
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Error creating comment" }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const comments = await requestCommentDB.getCommentsByRequestId(id);

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Error fetching comments" }, { status: 500 });
    }
}