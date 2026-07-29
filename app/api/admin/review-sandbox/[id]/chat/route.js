import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { groqClient, CHAT_MODEL } from '@/lib/ai/multi-model';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2_000;

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function arrayValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function safeWorkflowContext(automation) {
  const workflow = parseJson(automation.workflow);
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  return {
    name: automation.name,
    description: automation.description || '',
    authorEmail: automation.author_email || 'Unknown author',
    engine: workflow.engine || 'n8n',
    nodeCount: nodes.length,
    nodes: nodes.slice(0, 80).map((node, index) => ({
      index: index + 1,
      name: node?.name || `Step ${index + 1}`,
      type: node?.type || 'unknown',
      typeVersion: node?.typeVersion || undefined,
      position: node?.position ? '[present]' : undefined,
    })),
    trigger: nodes.find((node) => /trigger|webhook|schedule|poll/i.test(String(node?.type || node?.name || '')))?.name || null,
    connectors: arrayValue(automation.required_connectors).map((item) => typeof item === 'string' ? item : item?.name || item?.id).filter(Boolean).slice(0, 40),
    inputs: arrayValue(automation.required_inputs).slice(0, 40),
    latestSandbox: workflow.review_sandbox ? {
      status: workflow.review_sandbox.status,
      completedAt: workflow.review_sandbox.completedAt,
      certification: workflow.review_sandbox.certification || null,
      error: workflow.review_sandbox.error || null,
    } : null,
  };
}

const REVIEW_POLICY = `You are the ModelGrow Review Assistant inside an admin-only automation review sandbox.

Your job is to have a realistic conversation with a reviewer about ONE imported automation. Explain what it appears to do, how a normal user would interact with it, what input it expects, what output it should produce, and what could block approval.

Important safety rules:
- This is analysis/simulation only. Never claim that you ran the workflow or contacted an app.
- Never send messages, publish content, edit records, modify credentials, or ask the reviewer to paste secrets.
- The separate Safe test performs readiness certification. You may explain its result, but do not pretend it is a real business-event execution.
- Use only the workflow context supplied below. If something is not visible, say that it is unknown and suggest what evidence an admin should inspect.
- Do not expose raw tokens, credentials, private node parameters, or full workflow JSON.
- Be concise, concrete, and helpful. Ask one clarifying question when the reviewer has not provided enough detail.
- When asked to role-play a user, describe the expected conversation and checkpoints without actually executing side effects.`;

export async function POST(request, { params }) {
  const user = await getSupabaseUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  if (message.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: 'Message is too long' }, { status: 413 });

  const supabase = createAdminClient();
  const { data: automation, error } = await supabase
    .from('automations')
    .select('id,name,description,author_email,is_active,workflow,required_connectors,required_inputs')
    .eq('id', id)
    .single();
  if (error || !automation) return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
  if (automation.is_active) return NextResponse.json({ error: 'Only pending automations can be reviewed here.' }, { status: 409 });

  const history = Array.isArray(body.messages) ? body.messages : [];
  const messages = history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .slice(-MAX_MESSAGES)
    .map((item) => ({ role: item.role, content: String(item.content || item.text || '').slice(0, MAX_MESSAGE_LENGTH) }));
  messages.push({ role: 'user', content: message });

  try {
    const context = safeWorkflowContext(automation);
    const response = await groqClient.chat.completions.create({
      model: process.env.REVIEW_SANDBOX_MODEL || CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: 'system', content: `${REVIEW_POLICY}\n\nSELECTED WORKFLOW (metadata only):\n${JSON.stringify(context, null, 2)}` },
        ...messages,
      ],
    });
    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('The review assistant returned an empty response');
    return NextResponse.json({ reply, mode: 'sandbox-analysis' });
  } catch (chatError) {
    console.error('[Review Sandbox] Chat failed', chatError);
    return NextResponse.json({ error: 'Review assistant is unavailable right now.' }, { status: 502 });
  }
}
