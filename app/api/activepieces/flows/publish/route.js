import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { userDB } from '@/lib/db/supabase-db';
import { createAdminClient } from '@/lib/db/supabase-server';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { getActivepiecesBrowserAuthForModelGrowUser } from '@/lib/activepieces/provisioning';
import { getFlow, getFlowTemplate, isActivepiecesConfigured } from '@/lib/activepieces/client';

export const dynamic = 'force-dynamic';

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 2000;
const MAX_TOKEN_COST = 10000;

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeTokenCost(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(Math.round(parsed), MAX_TOKEN_COST);
}

function getPieceSlug(pieceName) {
  if (!pieceName || typeof pieceName !== 'string') return null;
  return pieceName
    .replace(/^@activepieces\/piece-/, '')
    .replace(/^piece-/, '')
    .trim()
    .toLowerCase();
}

function collectPiecesFromStep(step, pieces = new Set()) {
  if (!step || typeof step !== 'object') return pieces;

  const pieceName = step.settings?.pieceName || step.pieceName || step.name;
  const slug = getPieceSlug(pieceName);
  if (slug && !['manual', 'webhook', 'schedule'].includes(slug)) {
    pieces.add(slug);
  }

  if (step.nextAction) collectPiecesFromStep(step.nextAction, pieces);
  if (Array.isArray(step.branches)) {
    for (const branch of step.branches) collectPiecesFromStep(branch, pieces);
  }
  if (Array.isArray(step.children)) {
    for (const child of step.children) collectPiecesFromStep(child, pieces);
  }

  return pieces;
}

function getTemplateFlow(template) {
  if (Array.isArray(template?.flows)) return template.flows[0];
  if (template?.template?.trigger) return template.template;
  return template;
}

function getTriggerFromTemplate(template) {
  const flow = getTemplateFlow(template);
  return flow?.trigger || flow?.version?.trigger || template?.trigger || null;
}

function detectRequiredConnectors(template) {
  const trigger = getTriggerFromTemplate(template);
  return Array.from(collectPiecesFromStep(trigger)).sort();
}

function detectTriggerType(template) {
  const trigger = getTriggerFromTemplate(template);
  const pieceSlug = getPieceSlug(trigger?.settings?.pieceName || trigger?.pieceName || trigger?.name);
  if (pieceSlug === 'schedule') return 'schedule';
  if (pieceSlug === 'webhook') return 'webhook';
  if (pieceSlug === 'manual') return 'manual';
  return 'webhook';
}

export async function POST(request) {
  const authUser = await getSupabaseUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isActivepiecesConfigured()) {
    return NextResponse.json({ error: 'Activepieces is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const flowId = normalizeText(body?.flowId);
    const title = normalizeText(body?.title);
    const description = normalizeText(body?.description);
    const tokenCost = normalizeTokenCost(body?.tokenCost);

    if (!flowId) {
      return NextResponse.json({ error: 'Flow is required' }, { status: 400 });
    }
    if (!title || title.length > MAX_TITLE) {
      return NextResponse.json({ error: `Title is required and must be ${MAX_TITLE} characters or less` }, { status: 400 });
    }
    if (!description || description.length > MAX_DESCRIPTION) {
      return NextResponse.json({ error: `Description is required and must be ${MAX_DESCRIPTION} characters or less` }, { status: 400 });
    }

    const supabase = createAdminClient();
    const user = await userDB.upsertUser({
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
    });

    const { link, authResponse } = await getActivepiecesBrowserAuthForModelGrowUser({ supabase, user });
    const projectId = authResponse.projectId || link.activepieces_project_id;

    const flow = await getFlow({ token: authResponse.token, flowId, projectId });
    if (!flow?.id) {
      return NextResponse.json({ error: 'Flow not found in your builder workspace' }, { status: 404 });
    }

    const template = await getFlowTemplate({ token: authResponse.token, flowId, projectId });
    const requiredConnectors = detectRequiredConnectors(template);
    const triggerType = detectTriggerType(template);

    let embedding = null;
    try {
      embedding = await generateEmbedding(`${title} ${description}`);
    } catch (error) {
      console.warn('[Activepieces Publish] Failed to generate embedding:', error.message);
    }

    const { data: existing } = await supabase
      .from('automations')
      .select('id')
      .eq('author_email', authUser.email)
      .eq('activepieces_source_project_id', projectId)
      .eq('activepieces_source_flow_id', flowId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'This builder flow is already published to ModelGrow' }, { status: 409 });
    }

    const { data: automation, error: insertError } = await supabase
      .from('automations')
      .insert({
        name: title,
        description,
        author_email: authUser.email,
        token_cost: tokenCost,
        workflow: {
          engine: 'activepieces',
          source_project_id: projectId,
          source_flow_id: flowId,
          source_flow_name: flow.displayName || flow.version?.displayName || title,
          template,
        },
        embedding,
        required_connectors: requiredConnectors,
        required_inputs: [],
        developer_keys: {},
        required_scopes: [],
        is_active: false,
        activepieces_source_project_id: projectId,
        activepieces_source_flow_id: flowId,
        activepieces_trigger_type: triggerType,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      automation,
      detected: {
        requiredConnectors,
        triggerType,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Activepieces Publish] Failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to publish builder flow',
    }, { status: 500 });
  }
}
