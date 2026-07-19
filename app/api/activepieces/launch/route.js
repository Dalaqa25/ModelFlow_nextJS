import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { userDB } from '@/lib/db/supabase-db';
import { createAdminClient } from '@/lib/db/supabase-server';
import { getActivepiecesBrowserAuthForModelGrowUser } from '@/lib/activepieces/provisioning';
import { getActivepiecesBaseUrl, isActivepiecesConfigured } from '@/lib/activepieces/client';
import {
  getActivepiecesLaunchCookieDomain,
  getActivepiecesLaunchCookieName,
  issueActivepiecesLaunchToken,
} from '@/lib/activepieces/launch-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authUser = await getSupabaseUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isActivepiecesConfigured()) {
    return NextResponse.json({ error: 'ModelGrow Builder is not configured' }, { status: 500 });
  }

  try {
    const supabase = createAdminClient();
    const user = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });

    const { authResponse } = await getActivepiecesBrowserAuthForModelGrowUser({ supabase, user });
    const builderUrl = new URL('/authenticate', getActivepiecesBaseUrl());
    builderUrl.searchParams.set('response', JSON.stringify(authResponse));
    builderUrl.searchParams.set('mg_launch', issueActivepiecesLaunchToken({ userId: user.id, email: user.email }));
    const response = NextResponse.redirect(builderUrl);
    response.cookies.set({
      name: getActivepiecesLaunchCookieName(),
      value: issueActivepiecesLaunchToken({ userId: user.id, email: user.email }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 90,
      path: '/',
      ...(getActivepiecesLaunchCookieDomain() ? { domain: getActivepiecesLaunchCookieDomain() } : {}),
    });

    return response;
  } catch (error) {
    console.error('[Activepieces Launch] Failed to prepare builder:', error);
    return NextResponse.json({
      error: 'Failed to open ModelGrow Builder',
      message: error.message,
    }, { status: 500 });
  }
}
