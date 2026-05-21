import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { messageDB } from '@/lib/db/message-db';
import { resolvePublicUserFromAuth } from '@/lib/messages/public-user';

export async function GET() {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser) {
      return NextResponse.json({ count: 0 });
    }

    const me = await resolvePublicUserFromAuth(authUser);
    if (!me) {
      return NextResponse.json({ count: 0 });
    }

    const pending = await messageDB.listThreadsForUser(me.id, 'pending');
    const active = await messageDB.listThreadsForUser(me.id, 'active');

    const incomingRequests = pending.filter((t) => t.is_incoming_request).length;
    const unreadActive = active.reduce((sum, t) => sum + (t.unread_count || 0), 0);

    return NextResponse.json({
      count: incomingRequests + unreadActive,
      incoming_requests: incomingRequests,
      unread_messages: unreadActive,
    });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}
