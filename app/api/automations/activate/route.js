import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { n8nClient } from '@/lib/n8n/n8n-client';
import { getSupabaseUser } from '@/lib/auth/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Activate an automation for a user
 * This clones the workflow with credentials and parameters
 */
export async function POST(req) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId, parameters } = await req.json();

    if (!automationId) {
      return NextResponse.json(
        { error: 'automationId is required' },
        { status: 400 }
      );
    }

    // Get the user_automations record (should have credential_id from OAuth)
    const { data: userAutomation, error: fetchError } = await supabase
      .from('user_automations')
      .select('*')
      .eq('user_id', user.id)
      .eq('automation_id', automationId)
      .single();

    if (fetchError || !userAutomation) {
      return NextResponse.json(
        { error: 'Automation not found. Please connect OAuth first.' },
        { status: 404 }
      );
    }

    if (!userAutomation.n8n_credential_id) {
      return NextResponse.json(
        { error: 'Please connect your Google account first' },
        { status: 400 }
      );
    }

    // Parse credential IDs (now stored as JSON object)
    let credentialIds;
    try {
      credentialIds = typeof userAutomation.n8n_credential_id === 'string' 
        ? JSON.parse(userAutomation.n8n_credential_id)
        : userAutomation.n8n_credential_id;
    } catch (e) {
      // Fallback for old single credential ID format
      credentialIds = {
        googleOAuth2Api: userAutomation.n8n_credential_id,
        googleDriveOAuth2Api: userAutomation.n8n_credential_id,
        googleSheetsOAuth2Api: userAutomation.n8n_credential_id,
        gmailOAuth2: userAutomation.n8n_credential_id,
      };
    }

    // Fetch the automation template from database
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, workflow')
      .eq('id', automationId)
      .single();

    if (automationError || !automation) {
      return NextResponse.json(
        { error: 'Automation template not found' },
        { status: 404 }
      );
    }

    const { name: automationName, workflow } = automation;

    // Create workflow name with email prefix
    const userWorkflowName = `${user.email} - ${automationName}`;

    // Clone workflow and inject credentials + parameters
    const clonedWorkflow = cloneWorkflowWithCredentialsAndParameters(
      workflow,
      credentialIds,
      parameters || {},
      userWorkflowName
    );

    // Create workflow in n8n
    const createdWorkflow = await n8nClient.createWorkflow(clonedWorkflow);
    const n8nWorkflowId = createdWorkflow?.id || createdWorkflow?.data?.id;

    if (!n8nWorkflowId) {
      return NextResponse.json(
        { error: 'Failed to create workflow in n8n' },
        { status: 500 }
      );
    }

    // Update user_automations with workflow ID and parameters
    const { error: updateError } = await supabase
      .from('user_automations')
      .update({
        n8n_workflow_id: n8nWorkflowId.toString(),
        parameters: parameters || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('automation_id', automationId);

    if (updateError) {
      console.error('Failed to update user_automations:', updateError);
      return NextResponse.json(
        { error: 'Workflow created but failed to save mapping' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workflowId: n8nWorkflowId,
      workflowName: userWorkflowName,
      message: 'Automation activated successfully!',
    });

  } catch (error) {
    console.error('Error activating automation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate automation' },
      { status: 500 }
    );
  }
}

/**
 * Clone workflow and inject user-specific credentials and parameters
 */
function cloneWorkflowWithCredentialsAndParameters(workflow, credentialIds, parameters, workflowName) {
  console.log('=== CLONING WORKFLOW ===');
  console.log('Credential IDs:', credentialIds);
  
  // Convert workflow to string for parameter replacement
  let workflowStr = JSON.stringify(workflow);

  // Replace parameter placeholders (e.g., {{folder_id}}, {{spreadsheet_id}})
  Object.entries(parameters).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    workflowStr = workflowStr.replace(new RegExp(placeholder, 'g'), value);
  });

  // Parse back to object
  const clonedWorkflow = JSON.parse(workflowStr);

  console.log('Original nodes:', clonedWorkflow.nodes.map(n => ({ name: n.name, type: n.type, credentials: n.credentials })));

  // Clean and update nodes with credentials
  const cleanedNodes = (clonedWorkflow?.nodes || []).map(node => {
    const cleanNode = {
      name: node.name,
      type: node.type,
      position: node.position,
      parameters: node.parameters || {},
      typeVersion: node.typeVersion,
    };

    // Initialize credentials object if it doesn't exist
    cleanNode.credentials = node.credentials ? { ...node.credentials } : {};

    // Inject credentials based on node type
    // Google Drive nodes (including trigger)
    if ((node.type === 'n8n-nodes-base.googleDrive' || node.type === 'n8n-nodes-base.googleDriveTrigger') 
        && credentialIds.googleDriveOAuth2Api) {
      console.log(`Setting googleDriveOAuth2Api for node: ${node.name}`);
      cleanNode.credentials.googleDriveOAuth2Api = { id: credentialIds.googleDriveOAuth2Api };
    }
    
    // Google Sheets nodes
    else if (node.type === 'n8n-nodes-base.googleSheets' && credentialIds.googleSheetsOAuth2Api) {
      console.log(`Setting googleSheetsOAuth2Api for node: ${node.name}`);
      cleanNode.credentials.googleSheetsOAuth2Api = { id: credentialIds.googleSheetsOAuth2Api };
    }
    
    // Gmail nodes (both gmail and gmailTool)
    else if ((node.type === 'n8n-nodes-base.gmail' || node.type === 'n8n-nodes-base.gmailTool') 
        && credentialIds.gmailOAuth2) {
      console.log(`Setting gmailOAuth2 for node: ${node.name}`);
      cleanNode.credentials.gmailOAuth2 = { id: credentialIds.gmailOAuth2 };
    }

    // Generic Google OAuth nodes (fallback for any other google nodes)
    else if (node.type && node.type.toLowerCase().includes('google') && credentialIds.googleOAuth2Api) {
      console.log(`Setting googleOAuth2Api (fallback) for node: ${node.name}`);
      cleanNode.credentials.googleOAuth2Api = { id: credentialIds.googleOAuth2Api };
    }

    // AI/LangChain nodes - inject shared Groq credential
    const groqCredentialId = process.env.N8N_GROQ_CREDENTIAL_ID;
    const defaultGroqModel = 'llama-3.3-70b-versatile'; // Default model for all users
    
    if (groqCredentialId) {
      // LangChain chat model nodes
      if (node.type === '@n8n/n8n-nodes-langchain.lmChatGroq') {
        console.log(`Setting Groq credential for node: ${node.name}`);
        cleanNode.credentials.groqApi = { id: groqCredentialId };
        // Set default model if not already set
        if (!cleanNode.parameters.model || cleanNode.parameters.model === '') {
          cleanNode.parameters.model = defaultGroqModel;
          console.log(`Setting default Groq model: ${defaultGroqModel}`);
        }
      }
      // Information Extractor (uses chat model)
      else if (node.type === '@n8n/n8n-nodes-langchain.informationExtractor') {
        console.log(`Setting Groq credential for Information Extractor: ${node.name}`);
        cleanNode.credentials.groqApi = { id: groqCredentialId };
      }
      // Agent nodes (use chat model)
      else if (node.type === '@n8n/n8n-nodes-langchain.agent') {
        console.log(`Setting Groq credential for Agent: ${node.name}`);
        cleanNode.credentials.groqApi = { id: groqCredentialId };
      }
      // Generic LangChain nodes that might need AI
      else if (node.type && node.type.includes('langchain')) {
        console.log(`Setting Groq credential for LangChain node: ${node.name}`);
        cleanNode.credentials.groqApi = { id: groqCredentialId };
      }
    }

    console.log(`Node ${node.name} final credentials:`, cleanNode.credentials);

    // Include optional fields
    if (node.webhookId) cleanNode.webhookId = node.webhookId;
    if (node.disabled !== undefined) cleanNode.disabled = node.disabled;
    if (node.notes) cleanNode.notes = node.notes;
    if (node.notesInFlow !== undefined) cleanNode.notesInFlow = node.notesInFlow;

    return cleanNode;
  });

  return {
    name: workflowName,
    nodes: cleanedNodes,
    connections: clonedWorkflow?.connections || {},
    settings: clonedWorkflow?.settings || {},
    ...(clonedWorkflow?.staticData && { staticData: clonedWorkflow.staticData }),
  };
}
