import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { messageDB } from '@/lib/db/message-db';
import { containsContactInfo, contactInfoErrorMessage } from '@/lib/messages/content-validation';
import {
  resolvePublicUserFromAuth,
  displayNameFromUser,
  getPublicUserById,
} from '@/lib/messages/public-user';
import { attachSendersToMessages } from '@/lib/messages/thread-presenter';
import { notifyNewMessage } from '@/lib/messages/notify';
import { requestDB } from '@/lib/db/supabase-db';

async function getOtherParticipantId(threadId, myId) {
  const { messageSupabase } = await import('@/lib/db/message-db');
  const { data } = await messageSupabase
    .from('dm_participants')
    .select('user_id')
    .eq('thread_id', threadId);
  return (data || []).map((p) => p.user_id).find((id) => id !== myId);
}

export async function GET(request, { params }) {
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

    const messages = await messageDB.getMessages(threadId);
    const presented = await attachSendersToMessages(messages, me.id);

    await messageDB.markThreadRead(threadId, me.id);

    const otherUserId = await getOtherParticipantId(threadId, me.id);
    const otherUserRow = otherUserId ? await getPublicUserById(otherUserId) : null;

    let requestTitle = null;
    if (thread.request_id) {
      const req = await requestDB.getRequestById(thread.request_id);
      requestTitle = req?.title || null;
    }

    return NextResponse.json({
      thread: {
        id: thread.id,
        status: thread.status,
        request_id: thread.request_id,
        created_by_user_id: thread.created_by_user_id,
      },
      other_user: otherUserRow
        ? {
            id: otherUserRow.id,
            display_name: displayNameFromUser(otherUserRow),
            profile_image_url: otherUserRow.profile_image_url || null,
          }
        : null,
      request_title: requestTitle,
      messages: presented,
    });
  } catch (error) {
    console.error('[messages GET]', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

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
    const { body: messageBody } = await request.json();

    if (!messageBody?.trim()) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    if (containsContactInfo(messageBody)) {
      return NextResponse.json({ error: contactInfoErrorMessage() }, { status: 400 });
    }

    const thread = await messageDB.getThreadById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isMember = await messageDB.isParticipant(threadId, me.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (thread.status === 'declined') {
      return NextResponse.json({ error: 'This conversation was declined' }, { status: 409 });
    }

    if (thread.status !== 'active') {
      return NextResponse.json(
        { error: 'Accept the message request before sending more messages' },
        { status: 403 }
      );
    }

    const message = await messageDB.addMessage(threadId, me.id, messageBody);

    if (thread.status === 'active') {
      const otherId = await getOtherParticipantId(threadId, me.id);
      if (otherId) {
        await notifyNewMessage({
          recipientUserId: otherId,
          senderPublicUser: me,
          threadId,
        });
      }
    }

    return NextResponse.json(
      {
        id: message.id,
        body: message.body,
        created_at: message.created_at,
        is_mine: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[messages POST]', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
