import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { messageDB } from '@/lib/db/message-db';
import { resolvePublicUserFromAuth } from '@/lib/messages/public-user';

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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const existing = await messageDB.findThreadBetweenUsers(me.id, userId);

    if (existing) {
      return NextResponse.json({
        exists: true,
        threadId: existing.id,
        status: existing.status,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('[messages/threads/check GET]', error);
    return NextResponse.json({ error: 'Failed to check thread existence' }, { status: 500 });
  }
}
