import { NextResponse } from 'next/server';
import connect from "@/lib/db/connect";
import Comment from '@/lib/db/Comment';
import Request from '@/lib/db/Request';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(req, { params }) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();
        const { id } = params;
        
        // Verify request exists
        const request = await Request.findById(id);
        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }

        const comment = await Comment.create({
            content: content.trim(),
            requestId: id,
            authorEmail: user.email
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Error creating comment" }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        await connect();
        const { id } = params;
        
        const comments = await Comment.find({ requestId: id })
            .sort({ createdAt: -1 });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Error fetching comments" }, { status: 500 });
    }
} 