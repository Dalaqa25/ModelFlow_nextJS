import { adminSignIn, getFlow, isActivepiecesConfigured } from './client.js';

export function isActivepiecesSourceMissingError(error) {
  const code = error?.data?.code || error?.data?.error || error?.message;
  return error?.status === 404 || code === 'ENTITY_NOT_FOUND';
}

function isActivepiecesBacked(automation) {
  return Boolean(automation?.activepieces_source_flow_id);
}

function mergeMissingSourceMetadata(workflow, reason) {
  if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
    return workflow;
  }

  return {
    ...workflow,
    activepieces_source_status: 'missing',
    activepieces_source_missing_at: new Date().toISOString(),
    disabled_reason: reason,
  };
}

export async function markAutomationSourceMissing({ supabase, automation, reason = 'activepieces_source_missing' }) {
  if (!automation?.id) return null;

  const update = { is_active: false };
  const mergedWorkflow = mergeMissingSourceMetadata(automation.workflow, reason);
  if (mergedWorkflow !== automation.workflow) {
    update.workflow = mergedWorkflow;
  }

  const { data, error } = await supabase
    .from('automations')
    .update(update)
    .eq('id', automation.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function checkSourceFlowExists({ adminToken, automation }) {
  const sourceProjectId = automation.activepieces_source_project_id;
  const sourceFlowId = automation.activepieces_source_flow_id;

  if (!sourceProjectId || !sourceFlowId) {
    return false;
  }

  await getFlow({
    token: adminToken,
    projectId: sourceProjectId,
    flowId: sourceFlowId,
  });

  return true;
}

export async function syncActivepiecesSourceAvailability({ supabase, automations }) {
  const rows = Array.isArray(automations) ? automations : [];
  const sourceRows = rows.filter(isActivepiecesBacked);

  if (!sourceRows.length || !isActivepiecesConfigured()) {
    return rows;
  }

  let admin;
  try {
    admin = await adminSignIn();
  } catch (error) {
    console.warn('[Activepieces Source Sync] Skipped sync:', error.message);
    return rows;
  }
  const missingIds = new Set();

  await Promise.all(sourceRows.map(async (automation) => {
    try {
      await checkSourceFlowExists({ adminToken: admin.token, automation });
    } catch (error) {
      if (!isActivepiecesSourceMissingError(error)) {
        console.warn('[Activepieces Source Sync] Source check failed:', error.message);
        return;
      }

      missingIds.add(automation.id);
      await markAutomationSourceMissing({
        supabase,
        automation,
        reason: 'activepieces_source_flow_deleted',
      });
    }
  }));

  return rows.map((automation) => (
    missingIds.has(automation.id)
      ? {
          ...automation,
          is_active: false,
          workflow: mergeMissingSourceMetadata(automation.workflow, 'activepieces_source_flow_deleted'),
        }
      : automation
  ));
}
