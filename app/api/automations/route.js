import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { encryptKeys } from '@/lib/auth/encryption';
import { n8nClient } from '@/lib/n8n/n8n-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function extractWorkflowPayload(dbWorkflow, automationName) {
  let wf = dbWorkflow;

  if (Array.isArray(wf)) {
    wf = wf[0];
  }

  if (wf && typeof wf === 'object' && wf.workflow && typeof wf.workflow === 'object') {
    wf = wf.workflow;
  }

  if (!wf || typeof wf !== 'object') {
    throw new Error('workflow is empty or not an object');
  }

  const nodes = wf.nodes;
  const connections = wf.connections;

  if (!Array.isArray(nodes)) {
    throw new Error('workflow.nodes must be an array');
  }

  if (!connections || typeof connections !== 'object') {
    throw new Error('workflow.connections must be an object');
  }

  const payload = {
    name: (automationName || wf.name || 'Imported workflow').toString(),
    nodes,
    connections,
    settings: wf.settings && typeof wf.settings === 'object' ? wf.settings : {},
    active: false,
  };

  if (wf.staticData && typeof wf.staticData === 'object') {
    payload.staticData = wf.staticData;
  }

  if (wf.pinData && typeof wf.pinData === 'object') {
    payload.pinData = wf.pinData;
  }

  return payload;
}

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mineOnly = searchParams.get('mine') === 'true';
    
    // If requesting user's own automations, show ALL (including inactive/pending)
    // Otherwise, only show active automations to the public
    if (mineOnly) {
      const user = await getSupabaseUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('author_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Public query - only active automations
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to upload an automation' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    
    const name = formData.get('name');
    const description = formData.get('description');
    const estimatedPrice = formData.get('estimatedPrice');
    const videoLink = formData.get('videoLink');
    const imageFile = formData.get('image');
    const automationFile = formData.get('automationFile');
    const developerKeysJson = formData.get('developerKeys');
    const inputTypesJson = formData.get('inputTypes');
    const requiredConnectorsJson = formData.get('requiredConnectors');

    // Validate required fields
    if (!name || !description || !automationFile) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, and automation file are required' },
        { status: 400 }
      );
    }

    // Parse the JSON workflow
    const jsonText = await automationFile.text();
    let workflow;
    try {
      workflow = JSON.parse(jsonText);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON file' },
        { status: 400 }
      );
    }

    // Generate embedding from name + description
    const embeddingText = `${name} ${description}`;
    let embedding = null;
    
    try {
      embedding = await generateEmbedding(embeddingText);
    } catch (embeddingError) {
      // Continue without embedding - it's not critical
    }

    // TODO: Upload image to storage if provided
    let imageUrl = null;
    if (imageFile) {
      // For now, skip image upload - you can add Supabase storage later
    }

    // Parse required connectors from frontend (already detected during upload)
    let requiredConnectors = [];
    if (requiredConnectorsJson) {
      try {
        requiredConnectors = JSON.parse(requiredConnectorsJson);
      } catch (e) {
        // Error handled silently
      }
    }

    // Parse developer keys if provided and encrypt them
    let developerKeys = {};
    if (developerKeysJson) {
      try {
        const rawKeys = JSON.parse(developerKeysJson);
        developerKeys = encryptKeys(rawKeys);
      } catch (e) {
        // Error handled silently
      }
    }

    // Parse input types if provided
    let inputTypes = {};
    if (inputTypesJson) {
      try {
        inputTypes = JSON.parse(inputTypesJson);
      } catch (e) {
        // Error handled silently
      }
    }

    // Build required inputs from inputTypes (configured in Step 4)
    // inputTypes contains ALL detected inputs including FILE_INPUT
    const requiredInputs = [];
    const developerKeyNames = Object.keys(developerKeys);
    
    // Credential patterns to exclude from required_inputs
    const credentialPatterns = /token|key|secret|oauth|bearer|auth|credential/i;
    
    if (inputTypes && Object.keys(inputTypes).length > 0) {
      // Use the inputTypes from Step 4 (already has all inputs with correct types)
      Object.entries(inputTypes).forEach(([inputName, inputType]) => {
        // Exclude developer keys AND credential parameters
        const isDeveloperKey = developerKeyNames.includes(inputName);
        const isCredential = credentialPatterns.test(inputName);
        
        if (!isDeveloperKey && !isCredential) {
          requiredInputs.push({
            name: inputName,
            type: inputType
          });
        }
      });
    } else {
      // Fallback: scan workflow for webhook body parameters and placeholders
      const workflowString = JSON.stringify(workflow);
      
      // Method 1: Scan for webhook body parameters like $json["body"]["tiktok_url"]
      // Handles both escaped and non-escaped quotes: $json["body"]["field"] OR $json[\"body\"][\"field\"]
      const webhookBodyRegex = /\$json\[\\*"body\\*"\]\[\\*"([^"\\]+)\\*"\]/g;
      const bodyParams = new Set();
      
      let match;
      while ((match = webhookBodyRegex.exec(workflowString)) !== null) {
        const paramName = match[1];
        // Exclude credential parameters
        if (!credentialPatterns.test(paramName)) {
          bodyParams.add(paramName);
        }
      }
      
      // Method 2: Also scan for {{PLACEHOLDER}} style parameters
      const placeholderRegex = /\{\{([A-Z_]+)\}\}/g;
      while ((match = placeholderRegex.exec(workflowString)) !== null) {
        const placeholder = match[1];
        const isDeveloperKey = developerKeyNames.includes(placeholder);
        const isCredential = credentialPatterns.test(placeholder);
        
        if (!isDeveloperKey && !isCredential) {
          bodyParams.add(placeholder);
        }
      }
      
      // Convert to required_inputs format
      bodyParams.forEach(paramName => {
        requiredInputs.push({
          name: paramName,
          type: 'text' // Default to text, can be enhanced later
        });
      });
    }

    // Insert into database
    const { data, error } = await supabase
      .from('automations')
      .insert({
        name: name.trim(),
        description: description.trim(),
        author_email: user.email,
        price_per_run: estimatedPrice ? parseFloat(estimatedPrice) : null,
        workflow: workflow,
        embedding: embedding,
        required_connectors: requiredConnectors,
        required_inputs: requiredInputs,
        developer_keys: developerKeys,
        is_active: false
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save automation' },
        { status: 500 }
      );
    }

    // Auto-sync to n8n after successful database insert
    try {
      // Clean the nodes - remove any read-only fields from each node
      const cleanedNodes = (workflow?.nodes || []).map(node => {
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
        name: name.trim(),
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

      if (n8nWorkflowId) {
        // Activate the workflow
        try {
          await n8nClient.activateWorkflow(n8nWorkflowId);
        } catch (activateError) {
          console.warn(`Created workflow ${n8nWorkflowId} but couldn't activate:`, activateError.message);
        }

        // Update automation with n8n workflow ID (but keep is_active as false for admin approval)
        const { data: updatedAutomation, error: updateError } = await supabase
          .from('automations')
          .update({ n8n_workflow_id: n8nWorkflowId })
          .eq('id', data.id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update automation with n8n_workflow_id:', updateError);
        }

        return NextResponse.json({
          ...data,
          n8n_workflow_id: n8nWorkflowId,
          is_active: false,
          message: 'Automation uploaded and synced to n8n. Awaiting admin approval.'
        }, { status: 201 });
      }
    } catch (n8nError) {
      // n8n sync failed, but automation is saved in database
      console.error('Failed to sync to n8n:', n8nError.message);
      return NextResponse.json({
        ...data,
        warning: 'Automation saved but failed to sync to n8n',
        n8n_error: n8nError.message
      }, { status: 201 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to create automation' },
      { status: 500 }
    );
  }
}


export async function DELETE(request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const automationId = searchParams.get('id');

    if (!automationId) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 });
    }

    // Get the automation to check ownership and get n8n_workflow_id
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .single();

    if (fetchError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Check if user owns this automation
    if (automation.author_email !== user.email) {
      return NextResponse.json({ error: 'You can only delete your own automations' }, { status: 403 });
    }

    // Delete from n8n if it has a workflow ID
    if (automation.n8n_workflow_id) {
      try {
        await n8nClient.deleteWorkflow(automation.n8n_workflow_id);
        console.log(`Deleted workflow ${automation.n8n_workflow_id} from n8n`);
      } catch (n8nError) {
        console.warn(`Failed to delete workflow from n8n:`, n8nError.message);
        // Continue with database deletion even if n8n deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('automations')
      .delete()
      .eq('id', automationId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Automation deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
