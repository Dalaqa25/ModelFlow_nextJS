import { NextResponse } from 'next/server';
import {
  getActivepiecesLaunchCookieName,
  verifyActivepiecesLaunchToken,
} from '@/lib/activepieces/launch-guard';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const originalUri = request.headers.get('x-original-uri') || '';
  const originalUrl = originalUri ? new URL(originalUri, 'https://activepieces.modelgrow.com') : null;
  const queryToken = originalUrl?.searchParams.get('mg_launch') || null;
  const token = request.cookies.get(getActivepiecesLaunchCookieName())?.value || queryToken || null;
  const payload = verifyActivepiecesLaunchToken(token);

  if (!payload) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
