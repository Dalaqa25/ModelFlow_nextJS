import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { adminSignIn, healthCheck, isActivepiecesConfigured, listProjects } from '@/lib/activepieces/client';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getSupabaseUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configured = isActivepiecesConfigured();
  const { searchParams } = new URL(request.url);
  const probe = searchParams.get('probe') === 'true';

  if (!configured || !probe) {
    return NextResponse.json({
      configured,
      probed: false,
      message: configured
        ? 'ModelGrow Builder env vars are configured. Add ?probe=true to test API reachability.'
        : 'Set ACTIVEPIECES_MCP_URL, ACTIVEPIECES_OWNER_EMAIL, and ACTIVEPIECES_OWNER_PASSWORD.',
    });
  }

  try {
    const [health, admin] = await Promise.all([
      healthCheck().catch(() => ({ ok: true })),
      adminSignIn(),
    ]);
    const projects = await listProjects({ token: admin.token, limit: 1 });

    return NextResponse.json({
      configured: true,
      probed: true,
      reachable: true,
      health,
      admin: {
        email: admin.email,
        role: admin.platformRole,
        projectId: admin.projectId,
      },
      sampleProjectCount: Array.isArray(projects?.data) ? projects.data.length : null,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      probed: true,
      reachable: false,
      error: error.message,
      status: error.status || null,
    }, { status: 502 });
  }
}
