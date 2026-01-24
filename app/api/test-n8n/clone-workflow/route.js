import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { n8nClient } from '@/lib/n8n/n8n-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { workflowId, userId, email } = await req.json();

    if (!workflowId || !userId || !email) {
      return NextResponse.json(
        { error: 'workflowId, userId, and email are required' },
        { status: 400 }
      );
    }

    // Fetch automation from database
    const { data: automation, error: dbError } = await supabase
      .from('automations')
      .select('id, name, workflow')
      .eq('id', workflowId)
      .single();

    if (dbError || !automation) {
      return NextResponse.json(
        { error: 'Automation not found in database' },
        { status: 404 }
      );
    }

    const { name: automationName, workflow } = automation;

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow JSON not found in automation' },
        { status: 400 }
      );
    }

    // Create workflow name with email prefix
    const userWorkflowName = `${email} - ${automationName}`;

    // Clean the nodes - remove read-only fields
    const cleanedNodes = (workflow?.nodes || []).map(node => {
      const cleanNode = {
        name: node.name,
        type: node.type,
        position: node.position,
        parameters: node.parameters || {},
        typeVersion: node.typeVersion,
      };
      
      if (node.credentials) cleanNode.credentials = node.credentials;
      if (node.webhookId) cleanNode.webhookId = node.webhookId;
      if (node.disabled !== undefined) cleanNode.disabled = node.disabled;
      if (node.notes) cleanNode.notes = node.notes;
      if (node.notesInFlow !== undefined) cleanNode.notesInFlow = node.notesInFlow;
      
      return cleanNode;
    });

    // Prepare n8n workflow payload (DO NOT include 'active' field - it's read-only on creation)
    const n8nWorkflowData = {
      name: userWorkflowName,
      nodes: cleanedNodes,
      connections: workflow?.connections || {},
      settings: workflow?.settings || {},
    };

    if (workflow?.staticData) {
      n8nWorkflowData.staticData = workflow.staticData;
    }

    // Create workflow in n8n
    const createdWorkflow = await n8nClient.createWorkflow(n8nWorkflowData);
    const n8nWorkflowId = createdWorkflow?.id || createdWorkflow?.data?.id;

    if (!n8nWorkflowId) {
      return NextResponse.json(
        { error: 'Failed to get workflow ID from n8n response' },
        { status: 500 }
      );
    }

    // Insert into user_automations table to create the mapping
    const { data: workflowMapping, error: mappingError } = await supabase
      .from('user_automations')
      .upsert({
        user_id: userId,
        automation_id: workflowId,
        provider: 'google', // TODO: Get from automation.required_connectors
        n8n_workflow_id: n8nWorkflowId.toString(),
        n8n_credential_id: null, // Will be set when user connects OAuth
        is_active: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,automation_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (mappingError) {
      console.error('Failed to create workflow mapping:', mappingError);
      return NextResponse.json(
        { error: 'Workflow created in n8n but failed to save mapping in database', details: mappingError.message },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      n8nWorkflowId,
      workflowName: userWorkflowName,
      userId,
      userEmail: email,
      automationId: workflowId,
      automationName,
      status: 'Workflow created in n8n and mapping saved',
      dbUpdated: true,
      workflowMapping,
      fullResponse: createdWorkflow,
    });

  } catch (error) {
    console.error('Error cloning workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clone workflow' },
      { status: 500 }
    );
  }
}
