import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { userDB } from '@/lib/db/supabase-db';
import { adminSignIn, publishFlow } from '@/lib/activepieces/client';
import {
  activateNativeAutomation,
  deactivateNativeAutomation,
} from '@/lib/automation-runtime/client';

function isMissingActivepiecesEntity(error) {
  const combined = `${error?.code || ''} ${error?.message || ''} ${error?.data?.code || ''} ${error?.data?.message || ''}`.toUpperCase();
  return combined.includes('ENTITY_NOT_FOUND') || combined.includes('NOT_FOUND');
}

export async function PATCH(request, { params }) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { enabled } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const dbUser = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });
    const candidateUserIds = Array.from(new Set([authUser.id, dbUser?.id].filter(Boolean)));

    const { data: directUserAutomation, error: directError } = await supabase
      .from('user_automations')
      .select('id, automation_id, user_id, parameters')
      .eq('id', id)
      .in('user_id', candidateUserIds)
      .maybeSingle();

    if (directError) throw directError;

    const automationId = directUserAutomation?.automation_id || id;
    const now = new Date().toISOString();

    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, activepieces_source_flow_id')
      .eq('id', automationId)
      .maybeSingle();
    if (automationError) throw automationError;

    const { data: runtimeFlow, error: runtimeError } = await supabase
      .from('activepieces_runtime_flows')
      .select('id, activepieces_project_id, activepieces_flow_id')
      .eq('automation_id', automationId)
      .eq('user_id', dbUser.id)
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runtimeError) throw runtimeError;

    const usesActivepieces = Boolean(automation?.activepieces_source_flow_id);
    let builderStatus = null;
    if (usesActivepieces && runtimeFlow?.activepieces_project_id && runtimeFlow?.activepieces_flow_id) {
      const admin = await adminSignIn();
      builderStatus = enabled ? 'ENABLED' : 'DISABLED';
      try {
        await publishFlow({
          token: admin.token,
          projectId: runtimeFlow.activepieces_project_id,
          flowId: runtimeFlow.activepieces_flow_id,
          status: builderStatus,
        });
      } catch (error) {
        if (enabled || !isMissingActivepiecesEntity(error)) {
          throw error;
        }
        builderStatus = 'MISSING';
      }

      const { error: runtimeUpdateError } = await supabase
        .from('activepieces_runtime_flows')
        .update({
          status: enabled ? 'active' : 'paused',
          updated_at: now,
        })
        .eq('id', runtimeFlow.id);

      if (runtimeUpdateError) throw runtimeUpdateError;
    } else if (usesActivepieces && enabled) {
      return NextResponse.json({
        error: 'The ModelGrow Builder runtime copy is missing. Run setup again before enabling this automation.',
      }, { status: 409 });
    } else if (usesActivepieces && directUserAutomation) {
      const { error: disableMissingRuntimeError } = await supabase
        .from('user_automations')
        .update({ is_active: false, updated_at: now })
        .eq('id', directUserAutomation.id);
      if (disableMissingRuntimeError) throw disableMissingRuntimeError;
    } else if (directUserAutomation) {
      const runtimeUserId = directUserAutomation.user_id || dbUser.id;
      if (enabled) {
        await activateNativeAutomation({
          automationId,
          userId: runtimeUserId,
          config: directUserAutomation.parameters || {},
        });
      } else {
        await deactivateNativeAutomation({ automationId, userId: runtimeUserId });
      }
    }

    if (!automation || (!directUserAutomation && !runtimeFlow)) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Activepieces owns its runtime status update. Native n8n updates the same
    // row inside activate/deactivate, so this write is only needed for builder
    // runtime flows.
    if (runtimeFlow) {
      const { error: updateUserAutomationError } = await supabase
        .from('user_automations')
        .update({ is_active: enabled, updated_at: now })
        .eq('automation_id', automationId)
        .in('user_id', candidateUserIds);
      if (updateUserAutomationError) throw updateUserAutomationError;
    }

    return NextResponse.json({
      success: true,
      automation_id: automationId,
      enabled,
      builder_status: builderStatus,
      engine: usesActivepieces ? 'activepieces' : 'n8n-native',
      runtime_status: enabled ? 'active' : 'paused',
    });
  } catch (error) {
    console.error('[Automation Toggle] Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const dbUser = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });
    const candidateUserIds = Array.from(new Set([authUser.id, dbUser?.id].filter(Boolean)));

    // Callers use either id: the automations id (what the monitor sends) or a
    // user_automations row id. Only the row id was looked up here, so for the
    // common call this found nothing — and the deactivation below, which is
    // conditional on having found it, was skipped. The record was then deleted
    // regardless, leaving the workflow running in n8n with the only pointer to
    // it destroyed. Both forms are resolved now.
    const { data: rowIdMatch, error: directError } = await supabase
      .from('user_automations')
      .select('id, automation_id, user_id')
      .eq('id', id)
      .in('user_id', candidateUserIds)
      .maybeSingle();

    if (directError) throw directError;

    let directUserAutomation = rowIdMatch;
    if (!directUserAutomation) {
      const { data: automationIdMatch, error: automationIdError } = await supabase
        .from('user_automations')
        .select('id, automation_id, user_id')
        .eq('automation_id', id)
        .in('user_id', candidateUserIds)
        .maybeSingle();
      if (automationIdError) throw automationIdError;
      directUserAutomation = automationIdMatch;
    }

    const automationId = directUserAutomation?.automation_id || id;
    const now = new Date().toISOString();

    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, activepieces_source_flow_id')
      .eq('id', automationId)
      .maybeSingle();
    if (automationError) throw automationError;
    const usesActivepieces = Boolean(automation?.activepieces_source_flow_id);

    const { data: runtimeFlows, error: runtimeError } = await supabase
      .from('activepieces_runtime_flows')
      .select('id, activepieces_project_id, activepieces_flow_id')
      .eq('automation_id', automationId)
      .eq('user_id', dbUser.id)
      .neq('status', 'deleted');

    if (runtimeError) throw runtimeError;

    if (usesActivepieces && Array.isArray(runtimeFlows) && runtimeFlows.length > 0) {
      const admin = await adminSignIn();
      for (const runtimeFlow of runtimeFlows) {
        if (runtimeFlow.activepieces_project_id && runtimeFlow.activepieces_flow_id) {
          try {
            await publishFlow({
              token: admin.token,
              projectId: runtimeFlow.activepieces_project_id,
              flowId: runtimeFlow.activepieces_flow_id,
              status: 'DISABLED',
            });
          } catch (error) {
            if (!isMissingActivepiecesEntity(error)) {
              throw error;
            }
          }
        }
      }

      const runtimeIds = runtimeFlows.map((flow) => flow.id).filter(Boolean);
      if (runtimeIds.length > 0) {
        const { error: markRuntimeDeletedError } = await supabase
          .from('activepieces_runtime_flows')
          .update({
            status: 'deleted',
            updated_at: now,
          })
          .in('id', runtimeIds);

        if (markRuntimeDeletedError) throw markRuntimeDeletedError;
      }
    } else if (!usesActivepieces && directUserAutomation) {
      // Stopping the workflow has to succeed before the record goes, because
      // the record holds the only reference to it. Delete first and a failed
      // shutdown leaves a workflow polling someone's mailbox that nothing can
      // name, reach, or switch off — invisible to the product and to them.
      // Refusing the delete keeps it removable, and they can try again.
      try {
        await deactivateNativeAutomation({
          automationId,
          userId: directUserAutomation.user_id || dbUser.id,
        });
      } catch (error) {
        console.error('[Automation Remove] Could not stop the background workflow:', error);
        return NextResponse.json({
          error: 'Could not stop this automation, so it was not removed. Please try again.',
        }, { status: 502 });
      }
    }

    const { error: deleteUserAutomationError } = await supabase
      .from('user_automations')
      .delete()
      .eq('automation_id', automationId)
      .in('user_id', candidateUserIds);

    if (deleteUserAutomationError) throw deleteUserAutomationError;

    // The connection bindings outlive the automation otherwise, and a stale
    // one silently overrides whatever account is connected next time.
    const { error: deleteBindingsError } = await supabase
      .from('user_automation_connections')
      .delete()
      .eq('automation_id', automationId)
      .in('user_id', candidateUserIds);

    if (deleteBindingsError) {
      console.error('[Automation Remove] Left connection bindings behind:', deleteBindingsError);
    }

    if (!automation || (!directUserAutomation && (!runtimeFlows || runtimeFlows.length === 0))) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      automation_id: automationId,
      removed: true,
    });
  } catch (error) {
    console.error('[Automation Remove] Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
