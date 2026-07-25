// Execute handler functions
import { supabase, sendSSE, parseRequiredInputs, parseConnectors } from './shared.js';
import { log, logError } from './shared.js';
import {
  creditAutomationCreator,
  recordSuccessfulTokenSpend,
  runActivepiecesAutomation,
} from '@/lib/activepieces/provisioning';
import { listAutomationConnectionStatus } from '@/lib/activepieces/connections';
import { detectImportedWorkflowCredentialRequirements } from '@/lib/credentials/workflow-requirements';
import {
  activateNativeAutomation,
  queueNativeAutomation,
  runNativeAutomation,
  scheduleNativeAutomation,
} from '@/lib/automation-runtime/client';

// Handle execute_automation tool - WITH VALIDATION
export async function handleExecuteAutomation(args, user, controller, encoder) {

  try {
    // VALIDATION STEP 1: Check if config was provided — if not, try to recover from DB
    if (!args.config || Object.keys(args.config).length === 0) {
      log('[handleExecuteAutomation] Empty config from AI, attempting DB recovery...');
      
      // Try to recover config from user_automations.parameters (saved during setup)
      if (args.automation_id && user?.id) {
        const { data: userAutomation } = await supabase
          .from('user_automations')
          .select('parameters')
          .eq('user_id', user.id)
          .eq('automation_id', args.automation_id)
          .maybeSingle();

        if (userAutomation?.parameters && Object.keys(userAutomation.parameters).length > 0) {
          log('[handleExecuteAutomation] Recovered config from DB:', Object.keys(userAutomation.parameters));
          args.config = userAutomation.parameters;
        } else {
          sendSSE(controller, encoder, {
            content: "⚠️ I can't run the automation yet - I don't have the configuration. Let's set it up first."
          });
          return;
        }
      } else {
        sendSSE(controller, encoder, {
          content: "⚠️ I can't run the automation yet - I don't have the configuration. Let's set it up first."
        });
        return;
      }
    }

    // VALIDATION STEP 2: Get automation details to check required fields
    const { data: automation, error } = await supabase
      .from('automations')
      .select('id, is_active, required_inputs, required_connectors, developer_keys, name, workflow, token_cost, author_email, requires_background, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
      .eq('id', args.automation_id)
      .single();

    if (error || !automation) {
      sendSSE(controller, encoder, { content: "⚠️ I couldn't find that automation. Please try again." });
      return;
    }

    if (!automation.is_active) {
      sendSSE(controller, encoder, { content: "⚠️ That automation is no longer available. It may have been removed by the developer." });
      return;
    }

    // VALIDATION STEP 3: Check all required fields are present
    const requiredInputs = parseRequiredInputs(automation.required_inputs);
    const requiredConnectors = parseConnectors(automation.required_connectors);
    const usesActivepieces = Boolean(automation.activepieces_source_flow_id);
    const importedCredentialRequirements = usesActivepieces
      ? []
      : detectImportedWorkflowCredentialRequirements(automation.workflow, {
          developerKeyNames: Object.keys(automation.developer_keys || {}),
        });
    const usesCredentialBridge = usesActivepieces || importedCredentialRequirements.length > 0;
    const normalizedConfig = {};

    // Normalize config keys to lowercase for comparison
    Object.entries(args.config).forEach(([key, value]) => {
      normalizedConfig[key.toLowerCase()] = value;
    });

    const missingFields = [];
    const invalidFields = [];

    for (const input of requiredInputs) {
      const fieldName = (input.name || input).toLowerCase();
      const value = normalizedConfig[fieldName];

      // Check if field exists
      if (!value || value === '' || value === 'undefined' || value === 'null') {
        missingFields.push(fieldName.replace(/_/g, ' '));
        continue;
      }

      // VALIDATION STEP 4: Validate field values
      if (fieldName.includes('email')) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          invalidFields.push({ field: fieldName.replace(/_/g, ' '), reason: 'invalid email format' });
        }
      }

      if (fieldName.includes('folder') || fieldName.includes('spreadsheet') || fieldName.includes('document')) {
        // Validate Google Drive IDs (should be alphanumeric, typically 20+ chars)
        if (value.length < 10 || /\s/.test(value)) {
          invalidFields.push({ field: fieldName.replace(/_/g, ' '), reason: 'invalid file ID' });
        }
      }
    }

    // VALIDATION STEP 5: Report any issues
    if (missingFields.length > 0) {
      sendSSE(controller, encoder, {
        content: `⚠️ Hold on! I'm missing some required info:\n\n${missingFields.map(f => `• ${f}`).join('\n')}\n\nPlease provide these before I can run the automation.`
      });
      return;
    }

    if (invalidFields.length > 0) {
      const issues = invalidFields.map(f => `• ${f.field}: ${f.reason}`).join('\n');
      sendSSE(controller, encoder, {
        content: `⚠️ Some values don't look right:\n\n${issues}\n\nPlease correct these and try again.`
      });
      return;
    }

    // VALIDATION STEP 6: Check required connections
    const hasCredentialRequirements = usesActivepieces
      ? requiredConnectors.length > 0
      : importedCredentialRequirements.length > 0;

    if (usesCredentialBridge && hasCredentialRequirements) {
      const connectionStatus = await listAutomationConnectionStatus({ supabase, user, automation });
      const missingConnections = connectionStatus.requirements.filter((requirement) => !requirement.connected);
      if (missingConnections.length > 0) {
        const nextConnection = missingConnections[0];
        sendSSE(controller, encoder, {
          content: `⚠️ Connect ${nextConnection.displayName || 'the required app'} before running this automation.`
        });
        sendSSE(controller, encoder, {
          type: 'activepieces_connect_request',
          provider: nextConnection.displayName,
          automation_id: args.automation_id,
          automation_name: automation.name,
          activepieces_project_id: connectionStatus.projectId,
          activepieces_flow_id: connectionStatus.runtimeFlow?.activepieces_flow_id || null,
          activepieces_connections: connectionStatus.requirements,
          reason: `Connect ${nextConnection.displayName}`,
        });
        return;
      }
    }

    // ALL VALIDATIONS PASSED - Execute!

    sendSSE(controller, encoder, { content: "✓ All checks passed! Running the automation...\n\n" });

    if (usesActivepieces) {
      const tokenCost = automation.token_cost || 0;

      if (tokenCost > 0) {
        const { data: runner } = await supabase
          .from('users')
          .select('id, email, token_balance')
          .eq('id', user.id)
          .single();

        if (!runner) {
          sendSSE(controller, encoder, { content: '⚠️ Could not verify your token balance. Please try again.' });
          return;
        }

        if (runner.token_balance < tokenCost) {
          sendSSE(controller, encoder, {
            content: `⚠️ **Not enough tokens!**\n\nThis automation costs **${tokenCost} tokens** but you only have **${runner.token_balance} tokens**. You need ${tokenCost - runner.token_balance} more tokens to run this.\n\nHead to the **Pricing** page to top up your balance.`
          });
          sendSSE(controller, encoder, {
            type: 'insufficient_tokens',
            required: tokenCost,
            available: runner.token_balance,
            shortfall: tokenCost - runner.token_balance
          });
          return;
        }
      }

      const startedAt = Date.now();
      const activepiecesResult = await runActivepiecesAutomation({
        supabase,
        user,
        automation,
        config: normalizedConfig,
      });
      const completedAt = Date.now();

      if (!activepiecesResult.success) {
        const runStatus = String(activepiecesResult.activepieces.runStatus || '').toUpperCase();
        const isStillProcessing = activepiecesResult.pending || ['QUEUED', 'RUNNING'].includes(runStatus);
        const errorMessage = activepiecesResult.errorMessage || `Automation run status: ${activepiecesResult.activepieces.runStatus}`;

        await supabase.from('automation_executions').insert({
          automation_id: args.automation_id,
          executed_by: user.email,
          status: isStillProcessing ? 'running' : 'failed',
          credits_used: 0,
          started_at: new Date(startedAt).toISOString(),
          completed_at: new Date(completedAt).toISOString(),
          duration_ms: completedAt - startedAt,
          error_message: errorMessage,
          metadata: { engine: 'activepieces', activepieces: activepiecesResult.activepieces },
        });

        sendSSE(controller, encoder, {
          content: isStillProcessing
            ? `⏳ ModelGrow accepted the run, but it is still ${runStatus.toLowerCase()}. If it stays queued, the automation worker may not be processing jobs.`
            : `❌ ${errorMessage}`
        });
        return;
      }

      const spend = await recordSuccessfulTokenSpend({ supabase, user, automation, tokenCost });
      await creditAutomationCreator({ supabase, runnerUser: user, automation, tokenCost });

      await supabase.from('automation_executions').insert({
        automation_id: args.automation_id,
        executed_by: user.email,
        status: 'success',
        credits_used: tokenCost,
        started_at: new Date(startedAt).toISOString(),
        completed_at: new Date(completedAt).toISOString(),
        duration_ms: completedAt - startedAt,
        error_message: null,
        metadata: { engine: 'activepieces', activepieces: activepiecesResult.activepieces },
      });

      await supabase.rpc('increment_total_runs', { automation_uuid: args.automation_id });

      sendSSE(controller, encoder, {
        content: `✅ Your automation ran successfully.\n\nRun status: ${activepiecesResult.activepieces.runStatus}`
      });
      sendSSE(controller, encoder, {
        type: 'automation_complete',
        result: {
          success: true,
          engine: 'activepieces',
          activepieces: activepiecesResult.activepieces,
          tokens_spent: tokenCost,
          tokens_remaining: spend.tokensRemaining,
        }
      });
      return;
    }

    // ============================================
    // TOKEN ECONOMY: Check balance before the run. Charge only after n8n
    // reports success so failed workflows never consume user credits.
    // ============================================

    // Fetch full automation details for token cost and author
    const { data: fullAutomationData } = await supabase
      .from('automations')
      .select('token_cost, author_email')
      .eq('id', args.automation_id)
      .single();

    const tokenCost = fullAutomationData?.token_cost || 0;

    if (tokenCost > 0 && user?.id) {
      log('[TOKEN] Automation costs', tokenCost, 'tokens');

      // Get runner's current token balance (query by email since user.id is auth.users.id)
      const { data: runner } = await supabase
        .from('users')
        .select('id, email, token_balance')
        .eq('email', user.email)
        .single();

      if (!runner) {
        sendSSE(controller, encoder, { content: '⚠️ Could not verify your token balance. Please try again.' });
        return;
      }

      if (runner.token_balance < tokenCost) {
        log('[TOKEN] Insufficient balance:', runner.token_balance, '<', tokenCost);
        sendSSE(controller, encoder, {
          content: `⚠️ **Not enough tokens!**\n\nThis automation costs **${tokenCost} tokens** but you only have **${runner.token_balance} tokens**. You need ${tokenCost - runner.token_balance} more tokens to run this.\n\nHead to the **Pricing** page to top up your balance.`
        });
        sendSSE(controller, encoder, {
          type: 'insufficient_tokens',
          required: tokenCost,
          available: runner.token_balance,
          shortfall: tokenCost - runner.token_balance
        });
        return;
      }

      log('[TOKEN] Balance verified. Charging only after successful n8n completion.');
    } else {
      log('[TOKEN] Free automation (token_cost = 0)');
    }

    // ============================================
    // RUN THE AUTOMATION
    // ============================================
    const result = await runNativeAutomation({
      automationId: args.automation_id,
      userId: user.id,
      config: normalizedConfig,
    });
    const isActuallySuccessful = result.success !== false;

    if (isActuallySuccessful) {
      const runnerResult = result.result || result;
      const outputs = runnerResult?.outputs || {};
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

      // Generic result display — automations self-describe their output via result_display
      // Find the last node output that contains result_display
      let resultDisplay = null;
      for (const nodeOutput of Object.values(outputs)) {
        if (Array.isArray(nodeOutput) && nodeOutput[0]?.json?.result_display) {
          resultDisplay = nodeOutput[0].json.result_display;
          break;
        }
      }

      if (resultDisplay && Array.isArray(resultDisplay.items) && resultDisplay.items.length > 0) {
        let message = resultDisplay.intro
          ? resultDisplay.intro + '\n\n'
          : `Found ${resultDisplay.items.length} results:\n\n`;

        resultDisplay.items.forEach((item, i) => {
          message += `**${i + 1}. ${item.title}**\n`;
          if (item.subtitle) message += `${item.subtitle}\n`;
          if (item.description) message += `${item.description}\n`;
          if (item.link && item.link_label) message += `[${item.link_label}](${item.link})\n`;
          message += '\n';
        });

        sendSSE(controller, encoder, { content: message });
      } else {
        sendSSE(controller, encoder, {
          content: "✅ Your automation ran successfully.\n\n" + (result.message || '')
        });
      }

      sendSSE(controller, encoder, {
        type: 'automation_complete',
        result: {
          ...result,
          tokens_spent: tokenCost,
          tokens_remaining: spend.tokensRemaining,
        },
      });

      // Log successful execution to automation_executions
      try {
        await supabase.from('automation_executions').insert({
          automation_id: args.automation_id,
          executed_by: user.email,
          status: 'success',
          credits_used: tokenCost,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 0,
          error_message: null,
          metadata: {
            engine: 'n8n-native',
            executionId: result.executionId || runnerResult?.executionId || null,
          },
        });
      } catch (e) {
        logError('[TOKEN] Failed to log execution:', e);
      }

      // CHECK FOR BACKGROUND EXECUTION REQUIREMENT
      if (automation.requires_background) {
        sendSSE(controller, encoder, {
          content: "\n\n⚠️ **Important:** This automation requires background execution to continuously monitor and track changes. Without background mode, it will only run when you manually trigger it.\n\nWould you like to enable background execution so this automation can run automatically?"
        });

        // Send a special UI component for background activation prompt
        sendSSE(controller, encoder, {
          type: 'background_activation_prompt',
          automation_id: args.automation_id,
          automation_name: automation.name,
          config: normalizedConfig
        });

        // Pass the config as context so the AI can use it when user says "Yes"
        sendSSE(controller, encoder, {
          type: 'hidden_context',
          context: `[BACKGROUND_PROMPT automation_id="${args.automation_id}" config=${JSON.stringify(normalizedConfig)}]`
        });
      }

    } else {
      // Extract the most useful error message
      const errorDetails = result.errors && result.errors.length > 0
        ? result.errors.map(e => typeof e === 'string' ? e : e.error || JSON.stringify(e)).join('; ')
        : (result.error || 'Unknown error');
      sendSSE(controller, encoder, {
        content: `❌ Something went wrong: ${errorDetails}. Would you like to try again?`
      });
    }
  } catch (e) {
    logError('[handleExecuteAutomation] Error:', e);
    logError('[handleExecuteAutomation] Stack:', e.stack);

    if (e.code === 'OAUTH_SCOPE_INSUFFICIENT') {
      try {
        const connectorId = e.data?.details?.connector_id || null;
        const { data: automation } = await supabase
          .from('automations')
          .select('id, name, workflow, required_connectors, developer_keys, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
          .eq('id', args.automation_id)
          .single();
        const connectionStatus = automation
          ? await listAutomationConnectionStatus({ supabase, user, automation })
          : null;
        const reconnectConnections = (connectionStatus?.requirements || []).map((requirement) => (
          !connectorId || requirement.connectorId === connectorId
            ? { ...requirement, connected: false, needsReconnect: true }
            : requirement
        ));
        const reconnectTarget = reconnectConnections.find((requirement) => requirement.needsReconnect);

        sendSSE(controller, encoder, {
          content: `⚠️ ${e.message}\n\nReconnect ${reconnectTarget?.displayName || connectorId || 'the app'} once so Google can add the missing permission. ModelGrow did not run the workflow or charge tokens.`,
        });
        if (reconnectTarget) {
          sendSSE(controller, encoder, {
            type: 'activepieces_connect_request',
            provider: reconnectTarget.displayName,
            automation_id: args.automation_id,
            automation_name: automation?.name,
            activepieces_project_id: connectionStatus?.projectId,
            activepieces_connections: reconnectConnections,
            reason: `Reconnect ${reconnectTarget.displayName} with the required permission`,
          });
        }
        return;
      } catch (recoveryError) {
        logError('[handleExecuteAutomation] Failed to prepare OAuth reconnect:', recoveryError);
      }
    }

    sendSSE(controller, encoder, { content: `❌ Error running automation: ${e.message}. Please try again.` });
  }
}

// Handle save_background_config tool
export async function handleSaveBackgroundConfig(args, user, controller, encoder) {
  try {
    sendSSE(controller, encoder, { content: "Setting up background execution..." });

    const activation = await activateNativeAutomation({
      automationId: args.automation_id,
      userId: user.id,
      config: args.config || {},
    });

    sendSSE(controller, encoder, {
      content: "✓ Great! Native n8n activated this automation. It will now run automatically when its trigger receives a matching event."
    });
    sendSSE(controller, encoder, {
      type: 'background_activated',
      automation_id: args.automation_id,
      engine: activation.engine,
      native_workflow_id: activation.native_workflow_id,
    });

  } catch (e) {
    logError('[save_background_config] Exception:', e);
    sendSSE(controller, encoder, { content: "❌ Something went wrong saving background compliance." });
  }
}

// Handle schedule_automation tool
export async function handleScheduleAutomation(data, context, user, controller, encoder) {
  const { parseTimeExpression } = await import('../schedule-parser.js');

  log('[handleScheduleAutomation] Called with:', {
    time_expression: data.time_expression,
    hasContext: !!context,
    contextKeys: context ? Object.keys(context) : [],
    automationId: context?.automationId,
    collectedFields: context?.collectedFields
  });

  try {
    // Step 1: Validate automation is selected
    if (!context?.automationId) {
      sendSSE(controller, encoder, {
        content: "I need to know which automation to schedule. Please select an automation first, or tell me which one you'd like to schedule."
      });
      return { type: 'error', message: 'No automation selected' };
    }

    // Step 2: Parse time expression
    let schedule;
    try {
      schedule = parseTimeExpression(data.time_expression);
      log('[handleScheduleAutomation] Parsed schedule:', {
        type: schedule.type,
        humanReadable: schedule.humanReadable,
        nextRun: schedule.nextRun,
        cron: schedule.cron,
        delay: schedule.delay
      });
    } catch (parseError) {
      logError('[handleScheduleAutomation] Parse error:', parseError);
      sendSSE(controller, encoder, {
        content: `I couldn't understand "${data.time_expression}". ${parseError.message}`
      });
      return { type: 'error', message: parseError.message };
    }

    // Step 3: Get automation details
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, activepieces_source_flow_id')
      .eq('id', context.automationId)
      .single();

    if (automationError || !automation) {
      sendSSE(controller, encoder, {
        content: "I couldn't find that automation. Please try again."
      });
      return { type: 'error', message: 'Automation not found' };
    }

    if (automation.activepieces_source_flow_id) {
      sendSSE(controller, encoder, {
        content: 'This automation already uses its published ModelGrow Builder trigger. A separate native n8n schedule is not applicable.'
      });
      return { type: 'error', message: 'Activepieces automation uses its own trigger' };
    }

    // Step 4: Queue/schedule by stable IDs only. The runtime resolves the
    // workflow and Activepieces-backed credentials when each job executes.
    let result;

    if (schedule.type === 'recurring') {
      // Recurring schedule - use /schedule endpoint
      log('[handleScheduleAutomation] Recurring schedule:', {
        cronExpression: schedule.cron,
        humanReadable: schedule.humanReadable,
        automation_id: context.automationId,
        maxRuns: 100
      });

      sendSSE(controller, encoder, {
        content: `Scheduling "${automation.name}" to run ${schedule.humanReadable.toLowerCase()}...`
      });
    } else {
      // One-time schedule - use /queue endpoint with delay
      log('[handleScheduleAutomation] One-time schedule:', {
        delay: schedule.delay,
        delayInMinutes: (schedule.delay / 60000).toFixed(2),
        humanReadable: schedule.humanReadable
      });

      sendSSE(controller, encoder, {
        content: `Scheduling "${automation.name}" to run ${schedule.humanReadable.toLowerCase()}...`
      });
    }

    result = schedule.type === 'recurring'
      ? await scheduleNativeAutomation({
          automationId: context.automationId,
          userId: user.id,
          config: context.collectedFields || {},
          cronExpression: schedule.cron,
          maxRuns: 100,
        })
      : await queueNativeAutomation({
          automationId: context.automationId,
          userId: user.id,
          config: context.collectedFields || {},
          delay: schedule.delay,
        });

    // Step 9: Send confirmation
    const nextRunFormatted = schedule.nextRun.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    let confirmationMessage = `✓ Scheduled successfully!\n\n`;
    confirmationMessage += `• Automation: ${automation.name}\n`;
    confirmationMessage += `• Schedule: ${schedule.humanReadable}\n`;
    confirmationMessage += `• Next run: ${nextRunFormatted}\n`;

    if (schedule.type === 'recurring' && result.schedule?.jobKey) {
      confirmationMessage += `• Job ID: ${result.schedule.jobKey}`;
    } else if (result.jobId) {
      confirmationMessage += `• Job ID: ${result.jobId}`;
    }

    sendSSE(controller, encoder, { content: confirmationMessage });

    // Send structured event for UI updates
    sendSSE(controller, encoder, {
      type: 'schedule_confirmed',
      schedule: {
        type: schedule.type,
        humanReadable: schedule.humanReadable,
        nextRun: schedule.nextRun,
        jobKey: result.schedule?.jobKey,
        jobId: result.jobId,
        automation_name: automation.name
      }
    });

    return {
      type: 'schedule_created',
      schedule: schedule,
      automation: automation
    };

  } catch (error) {
    logError('[handleScheduleAutomation] Error:', error);
    sendSSE(controller, encoder, {
      content: `Sorry, something went wrong while scheduling: ${error.message}`
    });
    return { type: 'error', message: error.message };
  }
}
