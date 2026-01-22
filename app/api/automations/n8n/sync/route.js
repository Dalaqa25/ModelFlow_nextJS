import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { n8nClient } from '@/lib/n8n/n8n-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

/**
 * POST /api/automations/n8n/sync
 * Syncs automations from Supabase to n8n
 */
export async function POST(request) {
  try {
    // Verify user is authenticated
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // n8nClient will throw if not configured, so we can skip manual check

    // Get all automations from Supabase (no filter)
    const { data: automations, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching automations:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch automations from database' },
        { status: 500 }
      );
    }

    if (!automations || automations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active automations to sync',
        synced: 0
      });
    }

    // Sync each automation to n8n
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const automation of automations) {
      try {
        // Parse workflow if it's a string
        let workflowData = automation.workflow;
        if (typeof workflowData === 'string') {
          try {
            workflowData = JSON.parse(workflowData);
          } catch (e) {
            throw new Error('Invalid workflow JSON format');
          }
        }

        // Clean the nodes - remove any read-only fields from each node
        const cleanedNodes = (workflowData?.nodes || []).map(node => {
          const cleanNode = {
            name: node.name,
            type: node.type,
            position: node.position,
            parameters: node.parameters || {},
            typeVersion: node.typeVersion,
          };
          
          // Include optional fields if they exist
          if (node.credentials) cleanNode.credentials = node.credentials;
          if (node.webhookId) cleanNode.webhookId = node.webhookId;
          if (node.disabled !== undefined) cleanNode.disabled = node.disabled;
          if (node.notes) cleanNode.notes = node.notes;
          if (node.notesInFlow !== undefined) cleanNode.notesInFlow = node.notesInFlow;
          
          return cleanNode;
        });

        const n8nWorkflowData = {
          name: automation.name,
          nodes: cleanedNodes,
          connections: workflowData?.connections || {},
          settings: workflowData?.settings || {},
        };

        if (workflowData?.staticData) {
          n8nWorkflowData.staticData = workflowData.staticData;
        }

        // Validate that we have at least some nodes
        if (!n8nWorkflowData.nodes || n8nWorkflowData.nodes.length === 0) {
          throw new Error('Workflow has no nodes');
        }

        // Check if this automation is already synced to n8n
        if (automation.n8n_workflow_id) {
          // Try to update the existing workflow instead of creating a new one
          try {
            await n8nClient.updateWorkflow(automation.n8n_workflow_id, n8nWorkflowData);
            
            successCount++;
            results.push({
              automation_id: automation.id,
              automation_name: automation.name,
              n8n_workflow_id: automation.n8n_workflow_id,
              status: 'success',
              action: 'updated'
            });
            
            console.log(`✓ Updated workflow "${automation.name}" (${automation.n8n_workflow_id})`);
            continue;
          } catch (updateError) {
            // If update fails (maybe workflow was deleted in n8n), create a new one
            console.warn(`Couldn't update workflow ${automation.n8n_workflow_id}, will create new one:`, updateError.message);
          }
        }

        // Create new workflow (either first time or update failed)
        console.log(`Creating workflow "${automation.name}" with ${n8nWorkflowData.nodes.length} nodes`);

        const n8nWorkflow = await n8nClient.createWorkflow(n8nWorkflowData);
        const workflowId = n8nWorkflow.id || n8nWorkflow.data?.id;

        // Now activate it separately
        try {
          await n8nClient.activateWorkflow(workflowId);
        } catch (activateError) {
          // If activation fails, that's okay - workflow is still created
          console.warn(`Created workflow ${workflowId} but couldn't activate:`, activateError.message);
        }

        successCount++;
        results.push({
          automation_id: automation.id,
          automation_name: automation.name,
          n8n_workflow_id: workflowId,
          status: 'success',
          action: 'created'
        });

        // Save the n8n workflow ID back to the database
        try {
          await supabase
            .from('automations')
            .update({ n8n_workflow_id: workflowId })
            .eq('id', automation.id);
        } catch (updateError) {
          console.warn(`Couldn't save n8n_workflow_id for automation ${automation.id}:`, updateError.message);
        }

        console.log(`✓ Created workflow "${automation.name}" (${workflowId})`);

      } catch (error) {
        errorCount++;
        results.push({
          automation_id: automation.id,
          automation_name: automation.name,
          status: 'error',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} automations successfully, ${errorCount} failed`,
      total: automations.length,
      synced: successCount,
      failed: errorCount,
      results
    });

  } catch (error) {
    console.error('Error syncing to n8n:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
