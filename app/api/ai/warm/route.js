import { NextResponse } from 'next/server';

import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { prewarmCodexOrchestrator } from '@/lib/ai/orchestrator-provider';

export const runtime = 'nodejs';

export async function POST(request) {
  const user = await getSupabaseUser();
  if (!user?.id) {
    return NextResponse.json({ warmed: false }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!sessionId || sessionId.length > 128) {
    return NextResponse.json({ error: 'A valid sessionId is required' }, { status: 400 });
  }

  try {
    const created = await prewarmCodexOrchestrator(`${user.id}:${sessionId}`);
    return NextResponse.json({ warmed: true, created });
  } catch (error) {
    console.warn('[AI] Codex prewarm failed:', error.message);
    // Prewarming is an optimization, never a requirement for sending a message.
    return NextResponse.json({ warmed: false }, { status: 202 });
  }
}
