import { NextResponse } from 'next/server';
import { requestDB } from '@/lib/db/supabase-db';
import { sanitizeRequestForPublic, enrichAuthorByEmail } from '@/lib/messages/public-user';
import { containsContactInfo, contactInfoErrorMessage } from '@/lib/messages/content-validation';
import { getSupabaseUser } from '@/lib/auth/auth-utils';

export async function GET() {
  try {
    const requests = await requestDB.getAllRequests();
    const sanitized = await Promise.all(
      requests.map(async (req) => {
        const authorRow =
          req.author?.id ? req.author : await enrichAuthorByEmail(req.author_email);
        return sanitizeRequestForPublic(req, authorRow);
      })
    );
    return NextResponse.json(sanitized);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, tags, author_email } = body;

    const combined = `${title || ''} ${description || ''}`;
    if (containsContactInfo(combined)) {
      return NextResponse.json({ error: contactInfoErrorMessage() }, { status: 400 });
    }

    const newRequest = await requestDB.createRequest({
      title,
      description,
      tags,
      author_email: author_email || user.email,
    });

    const sanitized = sanitizeRequestForPublic(newRequest, null);
    return NextResponse.json(sanitized, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_, { params }) {
  const { id } = await params;

  try {
    const deletedRequest = await requestDB.deleteRequest(id);
    if (!deletedRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Request and related comments deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
