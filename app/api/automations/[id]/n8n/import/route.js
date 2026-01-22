import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request, { params }) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const { id: automationId } = params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(automationId)) {
      return NextResponse.json({ error: 'Invalid automation ID format' }, { status: 400 });
    }

    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, author_email, workflow, n8n_workflow_id')
      .eq('id', automationId)
      .single();

    if (automationError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (automation.author_email !== user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (automation.n8n_workflow_id && !force) {
      return NextResponse.json({
        success: true,
        alreadyImported: true,
        n8nWorkflowId: automation.n8n_workflow_id,
      });
    }

    if (!automation.workflow) {
      return NextResponse.json({ error: 'Automation has no workflow JSON saved' }, { status: 400 });
    }

    const n8nBaseUrl = (process.env.N8N_BASE_URL || '').replace(/\/$/, '');
    const n8nApiKey = process.env.N8N_API_KEY || process.env.X_N8N_API_KEY;

    if (!n8nBaseUrl) {
      return NextResponse.json({ error: 'Missing N8N_BASE_URL environment variable' }, { status: 500 });
    }

    if (!n8nApiKey) {
      return NextResponse.json(
        { error: 'Missing N8N_API_KEY (or X_N8N_API_KEY) environment variable' },
        { status: 500 }
      );
    }

    const payload = extractWorkflowPayload(automation.workflow, automation.name);

    const n8nRes = await fetch(`${n8nBaseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!n8nRes.ok) {
      const errorBody = await n8nRes.text().catch(() => '');
      return NextResponse.json(
        {
          error: 'Failed to create workflow in n8n',
          status: n8nRes.status,
          details: errorBody,
        },
        { status: 502 }
      );
    }

    const createdWorkflow = await n8nRes.json();
    const n8nWorkflowId = createdWorkflow?.id;

    if (!n8nWorkflowId) {
      return NextResponse.json(
        { error: 'n8n did not return workflow id', details: createdWorkflow },
        { status: 502 }
      );
    }

    const { error: updateError } = await supabase
      .from('automations')
      .update({ n8n_workflow_id: n8nWorkflowId })
      .eq('id', automationId);

    if (updateError) {
      return NextResponse.json(
        {
          error: 'Workflow created in n8n but failed to store workflowId in database',
          n8nWorkflowId,
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, n8nWorkflowId, createdWorkflow });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
