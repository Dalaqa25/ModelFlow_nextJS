import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { messageDB } from '@/lib/db/message-db';
import { resolvePublicUserFromAuth } from '@/lib/messages/public-user';

export async function POST(request, { params }) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const me = await resolvePublicUserFromAuth(authUser);
    if (!me) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { id: threadId } = await params;
    const thread = await messageDB.getThreadById(threadId);

    if (!thread) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isMember = await messageDB.isParticipant(threadId, me.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (thread.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be declined' },
        { status: 409 }
      );
    }

    if (thread.created_by_user_id === me.id) {
      return NextResponse.json(
        { error: 'You cannot decline your own message request' },
        { status: 403 }
      );
    }

    const updated = await messageDB.updateThreadStatus(threadId, 'declined');

    return NextResponse.json({ threadId: updated.id, status: updated.status });
  } catch (error) {
    console.error('[messages decline]', error);
    return NextResponse.json({ error: 'Failed to decline conversation' }, { status: 500 });
  }
}
