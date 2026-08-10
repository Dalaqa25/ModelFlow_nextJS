import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { userDB } from '@/lib/db/supabase-db';
import { isActivepiecesConfigured } from '@/lib/activepieces/client';
import {
  completeActivepiecesManualConnection,
  completeActivepiecesOAuthConnection,
} from '@/lib/activepieces/connections';

export const dynamic = 'force-dynamic';

async function getAutomationOrThrow(supabase, automationId) {
  const { data, error } = await supabase
    .from('automations')
    .select('id, name, workflow, required_connectors, developer_keys, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
    .eq('id', automationId)
    .single();

  if (error || !data) {
    const notFound = new Error('Automation not found');
    notFound.status = 404;
    throw notFound;
  }

  return data;
}

export async function POST(request) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isActivepiecesConfigured()) {
      return NextResponse.json({ error: 'ModelGrow Builder is not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const automationId = String(body?.automationId || body?.automation_id || '').trim();
    const externalId = String(body?.externalId || '').trim();
    const pieceName = String(body?.pieceName || '').trim();
    const pieceVersion = body?.pieceVersion ? String(body.pieceVersion).trim() : null;
    const clientId = String(body?.clientId || '').trim();
    const code = String(body?.code || '').trim();
    const codeVerifier = body?.codeVerifier ? String(body.codeVerifier).trim() : null;
    const authorizationMethod = body?.authorizationMethod ? String(body.authorizationMethod).trim() : null;
    const props = body?.props && typeof body.props === 'object' ? body.props : {};
    const manualValues = body?.values && typeof body.values === 'object' ? body.values : null;

    if (!automationId || !externalId || !pieceName) {
      return NextResponse.json({ error: 'automationId, externalId, and pieceName are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const user = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });
    const automation = await getAutomationOrThrow(supabase, automationId);
    const result = code
      ? await completeActivepiecesOAuthConnection({
          supabase,
          user,
          automation,
          externalId,
          pieceName,
          pieceVersion,
          clientId,
          code,
          codeVerifier,
          authorizationMethod,
          props,
        })
      : await completeActivepiecesManualConnection({
          supabase,
          user,
          automation,
          externalId,
          pieceName,
          pieceVersion,
          values: manualValues || {},
        });

    return NextResponse.json({
      success: true,
      connection: {
        id: result.connection?.id,
        externalId: result.connection?.externalId,
        pieceName: result.connection?.pieceName,
        displayName: result.connection?.displayName,
        status: result.connection?.status,
      },
      // Which account this actually connected, when it could be determined.
      // Null whenever the provider is not one we can ask, or the lookup
      // failed — the interface treats that as "no notice", never as a problem.
      accountNotice: result.accountNotice || null,
      requirements: result.status.requirements,
    });
  } catch (error) {
    console.error('[Activepieces Connection Complete] Failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to complete app connection',
    }, { status: error.status || 500 });
  }
}
