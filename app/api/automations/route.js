import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/embeddings';

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
    console.error('Error fetching automations:', error);
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
    const price = parseInt(formData.get('price'));
    const videoLink = formData.get('videoLink');
    const imageFile = formData.get('image');
    const automationFile = formData.get('automationFile');
    const developerKeysJson = formData.get('developerKeys');

    // Validate required fields
    if (!name || !description || isNaN(price) || !automationFile) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price, and automation file are required' },
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
      console.error('Failed to generate embedding:', embeddingError);
      // Continue without embedding - it's not critical
    }

    // TODO: Upload image to storage if provided
    let imageUrl = null;
    if (imageFile) {
      // For now, skip image upload - you can add Supabase storage later
      console.log('Image upload not implemented yet');
    }

    // Extract required connectors from workflow nodes
    const requiredConnectors = [];
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      workflow.nodes.forEach(node => {
        if (node.type && node.type !== 'n8n-nodes-base.start') {
          // Extract connector/service name from node type
          const connector = node.type.replace('n8n-nodes-base.', '');
          if (!requiredConnectors.includes(connector)) {
            requiredConnectors.push(connector);
          }
        }
      });
    }

    // Parse developer keys if provided
    let developerKeys = {};
    if (developerKeysJson) {
      try {
        developerKeys = JSON.parse(developerKeysJson);
        console.log('🔑 Developer keys provided:', Object.keys(developerKeys));
      } catch (e) {
        console.error('Failed to parse developer keys:', e);
      }
    }

    // Extract required inputs (placeholders like {{VARIABLE_NAME}})
    // Exclude developer keys from required inputs
    const requiredInputs = [];
    const workflowString = JSON.stringify(workflow);
    const placeholderRegex = /\{\{([A-Z_]+)\}\}/g;
    const developerKeyNames = Object.keys(developerKeys);
    
    let match;
    while ((match = placeholderRegex.exec(workflowString)) !== null) {
      const placeholder = match[1];
      // Only add if it's not a developer key and not already in the list
      if (!developerKeyNames.includes(placeholder) && !requiredInputs.includes(placeholder)) {
        requiredInputs.push(placeholder);
      }
    }

    // Insert into database
    const { data, error } = await supabase
      .from('automations')
      .insert({
        name: name.trim(),
        description: description.trim(),
        author_email: user.email,
        price_cents: price,
        currency_code: 'USD',
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
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save automation' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create automation' },
      { status: 500 }
    );
  }
}
