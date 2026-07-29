import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];
const CERTIFICATION_DIRECTORY = path.join(
  process.cwd(),
  'data/n8n-template-library/certification',
);

function isAdmin(email) {
  return Boolean(email && ADMIN_EMAILS.includes(email));
}

function parseWorkflow(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function normalizeConnectorLabels(value) {
  const labels = normalizeArray(value).map((item) => {
    if (typeof item === 'string') return item;
    return item?.connectorId || item?.id || item?.name || null;
  }).filter(Boolean);
  return Array.from(new Set(labels));
}

function summarizeWorkflow(workflow) {
  const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : [];
  return {
    name: workflow?.name || null,
    engine: workflow?.engine || 'n8n',
    nodeCount: nodes.length,
    nodes: nodes.map((node) => ({
      name: node.name || 'Unnamed step',
      type: node.type || 'unknown',
      kind: String(node.type || '').toLowerCase().includes('trigger') ? 'trigger' : 'action',
    })),
    trigger: nodes.find((node) => String(node.type || '').toLowerCase().includes('trigger'))?.name || null,
    latestSandbox: workflow?.review_sandbox || null,
  };
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(CERTIFICATION_DIRECTORY, fileName), 'utf8'));
}

function readLibraryCertification() {
  try {
    const queue = readJson('level3-candidate-queue-current.json');
    const executions = new Map();
    const resultFiles = fs.readdirSync(CERTIFICATION_DIRECTORY)
      .filter((name) => name.startsWith('level3-controlled') && name.endsWith('.jsonl'))
      .map((name) => ({
        name,
        modifiedAt: fs.statSync(path.join(CERTIFICATION_DIRECTORY, name)).mtimeMs,
      }))
      .sort((left, right) => left.modifiedAt - right.modifiedAt);

    for (const { name } of resultFiles) {
      const lines = fs.readFileSync(path.join(CERTIFICATION_DIRECTORY, name), 'utf8')
        .split('\n')
        .filter(Boolean);
      for (const line of lines) {
        const result = JSON.parse(line);
        executions.set(String(result.templateId), result);
      }
    }

    const candidates = (queue.candidates || []).map((candidate) => ({
      ...candidate,
      controlledExecution: executions.get(String(candidate.templateId)) || null,
    }));
    const ready = candidates.filter((candidate) => candidate.level3 === 'ready_for_real_test');
    const blockerCounts = {};
    for (const candidate of candidates) {
      for (const blocker of candidate.blockers || []) {
        blockerCounts[blocker.code] = (blockerCounts[blocker.code] || 0) + 1;
      }
    }

    return {
      generatedAt: queue.generatedAt || null,
      summary: {
        level12Passed: candidates.length,
        readyForControlledExecution: ready.length,
        controlledPassed: ready.filter((candidate) => candidate.controlledExecution?.status === 'passed').length,
        controlledFailed: ready.filter((candidate) => candidate.controlledExecution?.status === 'failed').length,
        blocked: candidates.filter((candidate) => candidate.level3 === 'blocked').length,
        fullyLevel3Certified: 0,
      },
      blockerCounts,
      candidates,
      limitations: [
        'Controlled execution proves isolated n8n execution only.',
        'Full level 3 still requires real connector output, retries, duplicate prevention, and atomic token charging.',
      ],
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function GET() {
  try {
    const user = await getSupabaseUser();
    if (!isAdmin(user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('automations')
      .select('id,name,description,author_email,created_at,updated_at,is_active,total_runs,workflow,required_connectors,required_inputs')
      .eq('is_active', false)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const automations = (data || [])
      .filter((automation) => parseWorkflow(automation.workflow)?.review_status !== 'rejected')
      .map((automation) => ({
        id: automation.id,
        name: automation.name,
        description: automation.description,
        authorEmail: automation.author_email,
        createdAt: automation.created_at,
        updatedAt: automation.updated_at,
        connectors: normalizeConnectorLabels(automation.required_connectors),
        inputs: normalizeArray(automation.required_inputs),
        workflow: summarizeWorkflow(parseWorkflow(automation.workflow)),
      }));

    return NextResponse.json({
      automations,
      total: automations.length,
      libraryCertification: readLibraryCertification(),
    });
  } catch (error) {
    console.error('[Review Sandbox] List failed', error);
    return NextResponse.json({ error: 'Failed to load review sandbox', message: error.message }, { status: 500 });
  }
}
