import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { ensureActivepiecesUserForModelGrowUser } from '@/lib/activepieces/provisioning';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', authUser.email)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'ModelGrow user row not found' }, { status: 404 });
    }

    const link = await ensureActivepiecesUserForModelGrowUser({ supabase, user });

    return NextResponse.json({
      ready: link.status === 'ready',
      workspace: {
        status: link.status,
        email: link.activepieces_email,
        projectId: link.activepieces_project_id,
        role: link.activepieces_role,
        authManaged: link.metadata?.auth_managed !== false,
        linkedFrom: link.metadata?.linked_from || null,
        updatedAt: link.updated_at,
      },
    });
  } catch (error) {
    console.error('[Activepieces Ensure User] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to ensure Activepieces user/project',
    }, { status: 500 });
  }
}
