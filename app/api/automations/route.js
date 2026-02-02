import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { encryptKeys } from '@/lib/auth/encryption';

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

    // SMART OAUTH: Detect required Google services from workflow
    let requiredScopes = [];
    try {
      const { getRequiredServices } = await import('@/lib/auth/automation-scope-detector');
      requiredScopes = getRequiredServices(workflow);
      console.log(`Detected required services for "${name}":`, requiredScopes);
    } catch (scopeError) {
      console.error('Failed to detect scopes:', scopeError);
      // Fallback to safe defaults if detection fails
      requiredScopes = ['DRIVE', 'SHEETS', 'GMAIL'];
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
        required_scopes: requiredScopes, // NEW: Store required scopes
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

    // Get the automation to check ownership
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
