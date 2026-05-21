import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { messageDB } from '@/lib/db/message-db';
import { requestDB, userDB } from '@/lib/db/supabase-db';
import { containsContactInfo, contactInfoErrorMessage } from '@/lib/messages/content-validation';
import {
  resolvePublicUserFromAuth,
  enrichAuthorByEmail,
} from '@/lib/messages/public-user';
import { attachOtherUserToThreads } from '@/lib/messages/thread-presenter';
import { notifyMessageRequest } from '@/lib/messages/notify';

export async function GET(request) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const me = await resolvePublicUserFromAuth(authUser);
    if (!me) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (status && !['pending', 'active', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const threads = await messageDB.listThreadsForUser(me.id, status || null);
    const presented = await attachOtherUserToThreads(threads, me.id);

    return NextResponse.json(presented);
  } catch (error) {
    console.error('[messages/threads GET]', error);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const me = await resolvePublicUserFromAuth(authUser);
    if (!me) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { recipientUserId, requestId, message: messageBody } = body;

    if (!recipientUserId || !messageBody?.trim()) {
      return NextResponse.json(
        { error: 'recipientUserId and message are required' },
        { status: 400 }
      );
    }

    if (containsContactInfo(messageBody)) {
      return NextResponse.json({ error: contactInfoErrorMessage() }, { status: 400 });
    }

    if (recipientUserId === me.id) {
      return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 });
    }

    const recipient = await userDB.getUserById(recipientUserId);
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    let requestTitle = null;
    if (requestId) {
      const req = await requestDB.getRequestById(requestId);
      if (!req) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }
      requestTitle = req.title;

      const authorRow = await enrichAuthorByEmail(req.author_email);
      const requestAuthorId = authorRow?.id;
      const participantIds = [me.id, recipientUserId];
      if (!participantIds.includes(requestAuthorId)) {
        // allow messaging anyone on a request thread (builder to author or vice versa)
      }

      const existing = await messageDB.findThreadBetweenUsersOnRequest(
        requestId,
        me.id,
        recipientUserId
      );

      if (existing) {
        if (existing.status === 'declined') {
          return NextResponse.json(
            { error: 'This conversation was declined. It cannot be reopened yet.' },
            { status: 409 }
          );
        }
        return NextResponse.json({
          threadId: existing.id,
          status: existing.status,
          existing: true,
        });
      }
    }

    const { thread, message } = await messageDB.createThread({
      requestId: requestId || null,
      createdByUserId: me.id,
      recipientUserId,
      initialBody: messageBody,
    });

    await notifyMessageRequest({
      recipientUserId,
      senderPublicUser: me,
      requestTitle,
      threadId: thread.id,
    });

    return NextResponse.json(
      {
        threadId: thread.id,
        status: thread.status,
        messageId: message.id,
        existing: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[messages/threads POST]', error);
    return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 });
  }
}
