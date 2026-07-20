import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';
import {
  creditAutomationCreator,
  recordSuccessfulTokenSpend,
  runActivepiecesAutomation,
} from '@/lib/activepieces/provisioning';
import {
  activateNativeAutomation,
  runNativeAutomation,
} from '@/lib/automation-runtime/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function runImportedN8nAutomation({ automation, user, automationId, lowercaseConfig, tokenCost, startTime }) {
  await assertTokenBalance(user.id, tokenCost);

  let result;
  try {
    result = await runNativeAutomation({
      automationId,
      userId: user.id,
      config: lowercaseConfig,
    });
  } catch (error) {
    const endTime = Date.now();
    await logExecution({
      automationId,
      userEmail: user.email,
      status: 'failed',
      startTime,
      endTime,
      durationMs: endTime - startTime,
      errorMessage: error.message,
      metadata: { engine: 'n8n-native', code: error.code },
    });
    return NextResponse.json({
      error: 'Native n8n execution failed',
      message: error.message,
      details: error.data,
    }, { status: error.status || 500 });
  }

  const endTime = Date.now();
  const durationMs = endTime - startTime;
  const executionEngine = result.engine || 'n8n-native';

  if (automation.requires_background) {
    await activateNativeAutomation({
      automationId,
      userId: user.id,
      config: lowercaseConfig,
    });
  }

  const spend = await recordSuccessfulTokenSpend({
    supabase,
    user,
    automation,
    tokenCost,
    engine: 'n8n-native',
  });
  await creditAutomationCreator({
    supabase,
    runnerUser: user,
    automation,
    tokenCost,
    engine: 'n8n-native',
  });

  await logExecution({
    automationId,
    userEmail: user.email,
    status: 'success',
    startTime,
    endTime,
    durationMs,
    tokenCost,
    metadata: {
      engine: executionEngine,
      executionId: result.executionId || null,
    },
  });

  await supabase.rpc('increment_total_runs', { automation_uuid: automationId });

  return NextResponse.json({
    success: true,
    message: 'Automation executed successfully',
    result,
    tokens_spent: tokenCost,
    tokens_remaining: spend.tokensRemaining,
    engine: executionEngine,
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
    const runStatus = String(result.activepieces.runStatus || '').toUpperCase();
    const isStillProcessing = result.pending || ['QUEUED', 'RUNNING'].includes(runStatus);
    const errorMessage = result.errorMessage || `Automation run status: ${result.activepieces.runStatus}`;

    await logExecution({
      automationId,
      userEmail: user.email,
      status: isStillProcessing ? 'running' : 'failed',
      startTime,
      endTime,
      durationMs,
      errorMessage,
      metadata: { engine: 'activepieces', activepieces: result.activepieces },
    });

    if (isStillProcessing) {
      return NextResponse.json({
        success: false,
        pending: true,
        message: `ModelGrow accepted the run, but it is still ${runStatus.toLowerCase()}.`,
        activepieces: result.activepieces,
      }, { status: 202 });
    }

    return NextResponse.json({
      error: 'Automation workflow execution failed',
      message: errorMessage,
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
    const { automation_id, config } = body;

    // Browser callers may never select an arbitrary runner by ID. The private
    // runtime accepts user IDs server-to-server, but this public route must bind
    // execution to the authenticated ModelGrow account.
    const user = await resolveAppUser(authUser, null);
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
      .select('id, name, is_active, requires_background, token_cost, author_email, workflow, required_inputs, required_connectors, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
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

    return runImportedN8nAutomation({
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
