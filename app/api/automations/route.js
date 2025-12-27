import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/embeddings';
import { encryptKeys } from '@/lib/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
        is_active: true
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
