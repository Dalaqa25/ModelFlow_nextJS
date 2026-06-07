import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';
import {
  creditAutomationCreator,
  recordSuccessfulTokenSpend,
  runActivepiecesAutomation,
} from '@/lib/activepieces/provisioning';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOKEN_TO_USD = 0.10;

function normalizeConfig(config) {
  const lowercaseConfig = {};
  Object.entries(config || {}).forEach(([key, value]) => {
    lowercaseConfig[key.toLowerCase()] = value;
  });
  return lowercaseConfig;
}

async function resolveAppUser(authUser, userId) {
  if (userId) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, token_balance')
      .eq('id', userId)
      .maybeSingle();

    if (profile) return profile;
  }

  if (!authUser) return null;

  const { data: byId } = await supabase
    .from('users')
    .select('id, email, name, token_balance')
    .eq('id', authUser.id)
    .maybeSingle();

  if (byId) return byId;

  if (authUser.email) {
    const { data: byEmail } = await supabase
      .from('users')
      .select('id, email, name, token_balance')
      .eq('email', authUser.email)
      .maybeSingle();

    if (byEmail) return byEmail;
  }

  return null;
}

async function assertTokenBalance(userId, tokenCost) {
  if (!tokenCost || tokenCost <= 0) return null;

  const { data: runner, error } = await supabase
    .from('users')
    .select('id, email, token_balance')
    .eq('id', userId)
    .single();

  if (error || !runner) {
    const notFound = new Error('User not found');
    notFound.status = 404;
    throw notFound;
  }

  if (runner.token_balance < tokenCost) {
    const insufficient = new Error('Insufficient token balance');
    insufficient.status = 402;
    insufficient.payload = {
      error: 'Insufficient token balance',
      required: tokenCost,
      available: runner.token_balance,
      message: `This automation costs ${tokenCost} tokens. You have ${runner.token_balance} tokens. Please purchase more tokens.`,
    };
    throw insufficient;
  }

  return runner;
}

async function logExecution({ automationId, userEmail, status, startTime, endTime, durationMs, tokenCost = 0, errorMessage = null, metadata = {} }) {
  await supabase.from('automation_executions').insert({
    automation_id: automationId,
    executed_by: userEmail,
    status,
    credits_used: status === 'success' ? tokenCost : 0,
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date(endTime).toISOString(),
    duration_ms: durationMs,
    error_message: errorMessage,
    metadata,
  });
}

async function runLegacyAutomation({ automation, user, automationId, lowercaseConfig, tokenCost, startTime }) {
  if (tokenCost > 0) {
    await assertTokenBalance(user.id, tokenCost);

    const { data: runner } = await supabase
      .from('users')
      .select('id, email, token_balance')
      .eq('id', user.id)
      .single();

    const { error: deductError } = await supabase
      .from('users')
      .update({ token_balance: runner.token_balance - tokenCost })
      .eq('id', user.id);

    if (deductError) throw new Error('Failed to process token payment');

    await supabase.from('token_transactions').insert({
      user_id: user.id,
      transaction_type: 'spend',
      token_amount: -tokenCost,
      usd_amount: -(tokenCost * TOKEN_TO_USD),
      status: 'completed',
      metadata: {
        automation_id: automationId,
        automation_name: automation.name,
        developer_email: automation.author_email,
        engine: 'legacy-runner',
      },
    });
  }

  const requiredConnectors = Array.isArray(automation.required_connectors)
    ? automation.required_connectors
    : (() => {
      try { return JSON.parse(automation.required_connectors || '[]'); } catch (_) { return []; }
    })();

  const primaryProvider = requiredConnectors.length > 0
    ? (requiredConnectors[0].toLowerCase().includes('google') || requiredConnectors[0].toLowerCase().includes('sheets') ? 'google' : requiredConnectors[0].toLowerCase())
    : 'google';

  const { data: integration } = await supabase
    .from('user_automations')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', user.id)
    .eq('automation_id', automationId)
    .eq('provider', primaryProvider)
    .maybeSingle();

  if (integration?.access_token) {
    lowercaseConfig.access_token = integration.access_token;
    if (integration.refresh_token) lowercaseConfig.refresh_token = integration.refresh_token;
  }

  const RUNNER_URL = process.env.AUTOMATION_RUNNER_URL || 'http://localhost:3001';
  const runnerResponse = await fetch(`${RUNNER_URL}/api/automations/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ automation_id: automationId, user_id: user.id, config: lowercaseConfig }),
    signal: AbortSignal.timeout(60000),
  });

  const endTime = Date.now();
  const durationMs = endTime - startTime;

  if (!runnerResponse.ok) {
    const errorData = await runnerResponse.json().catch(() => ({}));
    await logExecution({
      automationId,
      userEmail: user.email,
      status: 'failed',
      startTime,
      endTime,
      durationMs,
      errorMessage: errorData.error || 'Automation runner failed',
      metadata: { engine: 'legacy-runner' },
    });
    return NextResponse.json({ error: 'Automation runner failed', details: errorData }, { status: 500 });
  }

  const result = await runnerResponse.json();
  if (!result.success) {
    const errorMessage = (result.errors && result.errors.length > 0) ? result.errors[0] : 'Workflow execution failed';
    await logExecution({
      automationId,
      userEmail: user.email,
      status: 'failed',
      startTime,
      endTime,
      durationMs,
      errorMessage,
      metadata: { engine: 'legacy-runner' },
    });
    return NextResponse.json({ error: 'Workflow execution failed', message: errorMessage, details: result }, { status: 500 });
  }

  if (automation.requires_background) {
    await supabase
      .from('user_automations')
      .upsert({
        automation_id: automationId,
        user_id: user.id,
        parameters: lowercaseConfig,
        is_active: true,
        last_run: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'automation_id,user_id' });
  }

  await logExecution({
    automationId,
    userEmail: user.email,
    status: 'success',
    startTime,
    endTime,
    durationMs,
    tokenCost,
    metadata: { engine: 'legacy-runner' },
  });

  await supabase.rpc('increment_total_runs', { automation_uuid: automationId });

  if (tokenCost > 0 && automation.author_email !== user.email) {
    await creditAutomationCreator({ supabase, runnerUser: user, automation, tokenCost });
  }

  const { data: balance } = await supabase
    .from('users')
    .select('token_balance')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    success: true,
    message: 'Automation executed successfully',
    result,
    tokens_spent: tokenCost,
    tokens_remaining: balance?.token_balance ?? null,
    engine: 'legacy-runner',
  });
}

async function runActivepiecesBackedAutomation({ automation, user, automationId, lowercaseConfig, tokenCost, startTime }) {
  await assertTokenBalance(user.id, tokenCost);

  const result = await runActivepiecesAutomation({
    supabase,
    user,
    automation,
    config: lowercaseConfig,
  });

  const endTime = Date.now();
  const durationMs = endTime - startTime;

  if (!result.success) {
    await logExecution({
      automationId,
      userEmail: user.email,
      status: 'failed',
      startTime,
      endTime,
      durationMs,
      errorMessage: `Activepieces run status: ${result.activepieces.runStatus}`,
      metadata: { engine: 'activepieces', activepieces: result.activepieces },
    });

    return NextResponse.json({
      error: 'Activepieces workflow execution failed',
      activepieces: result.activepieces,
    }, { status: 500 });
  }

  const spend = await recordSuccessfulTokenSpend({ supabase, user, automation, tokenCost });
  await creditAutomationCreator({ supabase, runnerUser: user, automation, tokenCost });

  await logExecution({
    automationId,
    userEmail: user.email,
    status: 'success',
    startTime,
    endTime,
    durationMs,
    tokenCost,
    metadata: { engine: 'activepieces', activepieces: result.activepieces },
  });

  await supabase.rpc('increment_total_runs', { automation_uuid: automationId });

  return NextResponse.json({
    success: true,
    message: 'Automation executed successfully',
    result,
    tokens_spent: tokenCost,
    tokens_remaining: spend.tokensRemaining,
    engine: 'activepieces',
  });
}

export async function POST(req) {
  try {
    const authUser = await getSupabaseUser();
    const body = await req.json();
    const { automation_id, config, user_id } = body;

    const user = await resolveAppUser(authUser, user_id);
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to execute automations' }, { status: 401 });
    }

    if (!automation_id || !config) {
      return NextResponse.json({ error: 'automation_id and config are required' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(automation_id)) {
      return NextResponse.json({ error: 'Invalid automation ID format' }, { status: 400 });
    }

    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, is_active, requires_background, token_cost, author_email, required_connectors, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
      .eq('id', automation_id)
      .single();

    if (automationError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (!automation.is_active) {
      return NextResponse.json({ error: 'Automation is no longer available' }, { status: 410 });
    }

    const tokenCost = automation.token_cost || 0;
    const lowercaseConfig = normalizeConfig(config);
    const startTime = Date.now();

    if (automation.activepieces_source_flow_id) {
      return runActivepiecesBackedAutomation({
        automation,
        user,
        automationId: automation_id,
        lowercaseConfig,
        tokenCost,
        startTime,
      });
    }

    return runLegacyAutomation({
      automation,
      user,
      automationId: automation_id,
      lowercaseConfig,
      tokenCost,
      startTime,
    });
  } catch (error) {
    if (error.status === 402) {
      return NextResponse.json(error.payload, { status: 402 });
    }

    console.error('[Automation Execute] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute automation', message: error.message },
      { status: error.status || 500 }
    );
  }
}
