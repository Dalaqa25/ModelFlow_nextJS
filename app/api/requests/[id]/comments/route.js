import { NextResponse } from 'next/server';
import { requestDB, requestCommentDB } from "@/lib/db/supabase-db";
import { getSupabaseUser } from "@/lib/auth/auth-utils";
import {
  sanitizeCommentForPublic,
  enrichAuthorByEmail,
} from '@/lib/messages/public-user';
import { containsContactInfo, contactInfoErrorMessage } from '@/lib/messages/content-validation';

export async function POST(req, { params }) {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const request = await requestDB.getRequestById(id);
        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }

        if (containsContactInfo(content)) {
            return NextResponse.json({ error: contactInfoErrorMessage() }, { status: 400 });
        }

        const comment = await requestCommentDB.createComment({
            content: content.trim(),
            request_id: id,
            author_email: user.email
        });

        const authorRow = await enrichAuthorByEmail(user.email);
        return NextResponse.json(sanitizeCommentForPublic(comment, authorRow), { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Error creating comment" }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const comments = await requestCommentDB.getCommentsByRequestId(id);

        const sanitized = await Promise.all(
          comments.map(async (comment) => {
            const authorRow =
              comment.author?.id
                ? comment.author
                : await enrichAuthorByEmail(comment.author_email);
            return sanitizeCommentForPublic(comment, authorRow);
          })
        );

        return NextResponse.json(sanitized);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching comments" }, { status: 500 });
    }
}
