import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { isMcpConfigured, smokeTestMcp } from '@/lib/activepieces/mcp-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSupabaseUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isMcpConfigured()) {
    return NextResponse.json({
      configured: false,
      error: 'ACTIVEPIECES_MCP_URL is not configured',
    }, { status: 500 });
  }

  try {
    const result = await smokeTestMcp();
    return NextResponse.json({
      configured: true,
      reachable: true,
      ...result,
    });
  } catch (error) {
    console.error('[Activepieces MCP Test] Error:', error);
    return NextResponse.json({
      configured: true,
      reachable: false,
      error: error.message || 'MCP smoke test failed',
      status: error.status || null,
      details: error.data || null,
    }, { status: 502 });
  }
}
