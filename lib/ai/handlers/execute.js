// Execute handler functions
import { supabase, sendSSE, parseRequiredInputs, parseConnectors, getValidProviderToken } from './shared.js';
import { log, logError } from './shared.js';

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
      .select('id, required_inputs, required_connectors, name')
      .eq('id', args.automation_id)
      .single();

    if (error || !automation) {
      sendSSE(controller, encoder, { content: "⚠️ I couldn't find that automation. Please try again." });
      return;
    }

    // VALIDATION STEP 3: Check all required fields are present
    const requiredInputs = parseRequiredInputs(automation.required_inputs);
    const requiredConnectors = parseConnectors(automation.required_connectors);
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
    if (requiredConnectors.length > 0) {
      for (const rawConnector of requiredConnectors) {
        const connector = rawConnector.toLowerCase();
        const provider = connector.includes('sheets') || connector.includes('drive') 
          ? 'google' 
          : connector.includes('linkedin') ? 'linkedin' : connector;

        const { data: integration } = await supabase
          .from('user_automations')
          .select('id, access_token')
          .eq('user_id', user.id)
          .eq('automation_id', args.automation_id)
          .eq('provider', provider)
          .maybeSingle();

        if (!integration || !integration.access_token) {
          const providerName = provider === 'google' ? 'Google' : provider.charAt(0).toUpperCase() + provider.slice(1);
          sendSSE(controller, encoder, {
            content: `⚠️ I need to connect to your ${providerName} account first before running this automation.`
          });
          sendSSE(controller, encoder, { type: 'connect_request', provider: provider, automation_id: args.automation_id, user_id: user.id });
          return;
        }
      }
    }

    // ALL VALIDATIONS PASSED - Execute!

    sendSSE(controller, encoder, { content: "✓ All checks passed! Running the automation...\n\n" });

    const RUNNER_URL = process.env.AUTOMATION_RUNNER_URL || 'http://localhost:3001';
    const executeResponse = await fetch(`${RUNNER_URL}/api/automations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automation_id: args.automation_id,
        config: normalizedConfig,
        user_id: user.id
      }),
      signal: AbortSignal.timeout(60000)
    });

    // Check if response is JSON before parsing
    const contentType = executeResponse.headers.get('content-type');
    log('[handleExecuteAutomation] Response status:', executeResponse.status);
    log('[handleExecuteAutomation] Response content-type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await executeResponse.text();
      logError('[handleExecuteAutomation] Non-JSON response:', text.substring(0, 500));
      throw new Error(`API returned non-JSON response (${executeResponse.status}). Check if automation runner is running.`);
    }

    const result = await executeResponse.json();

    // Check BOTH HTTP status AND the success field in the JSON body.
    // The orchestration may return HTTP 200 with { success: false } when
    // workflow execution fails (e.g. a node throws an error).
    const isActuallySuccessful = executeResponse.ok && result.success !== false;

    if (isActuallySuccessful) {
      const runnerResult = result.result || result;
      const outputs = runnerResult?.outputs || {};

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

      sendSSE(controller, encoder, { type: 'automation_complete', result });

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
    sendSSE(controller, encoder, { content: `❌ Error running automation: ${e.message}. Please try again.` });
  }
}

// Handle save_background_config tool
export async function handleSaveBackgroundConfig(args, user, controller, encoder) {
  try {
    sendSSE(controller, encoder, { content: "Setting up background execution..." });

    // Update user_automations table: is_active = true, parameters = config
    const { error } = await supabase
      .from('user_automations')
      .update({
        is_active: true,
        parameters: args.config,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('automation_id', args.automation_id);

    if (error) {
      logError('[save_background_config] Error:', error);
      sendSSE(controller, encoder, { content: "❌ Failed to save background configuration. Please try again." });
      return;
    }

    sendSSE(controller, encoder, {
      content: "✓ Great! I've enabled background execution for this automation. It will now run automatically when changes are detected."
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
      .select('id, name, required_connectors, workflow')
      .eq('id', context.automationId)
      .single();

    if (automationError || !automation) {
      sendSSE(controller, encoder, {
        content: "I couldn't find that automation. Please try again."
      });
      return { type: 'error', message: 'Automation not found' };
    }

    // Parse workflow if it's a string
    let workflow = automation.workflow;
    if (typeof workflow === 'string') {
      try {
        workflow = JSON.parse(workflow);
      } catch (e) {
        logError('[handleScheduleAutomation] Failed to parse workflow:', e);
        sendSSE(controller, encoder, {
          content: "Error: Invalid workflow configuration."
        });
        return { type: 'error', message: 'Invalid workflow' };
      }
    }

    // Step 4: Check for required connections and get tokens
    const requiredConnectors = parseConnectors(automation.required_connectors);
    let tokens = {};
    let tokenMapping = {};

    if (requiredConnectors.length > 0) {
      for (const rawConnector of requiredConnectors) {
        const connector = rawConnector.toLowerCase();
        const provider = connector.includes('sheets') || connector.includes('drive') ? 'google' : connector;

        const { data: integration } = await supabase
          .from('user_automations')
          .select('access_token, refresh_token, token_expiry')
          .eq('user_id', user.id)
          .eq('automation_id', context.automationId)
          .eq('provider', provider)
          .maybeSingle();

        if (!integration || !integration.access_token) {
          const providerName = provider === 'google' ? 'Google' : provider.charAt(0).toUpperCase() + provider.slice(1);
          sendSSE(controller, encoder, {
            content: `I need to connect to your ${providerName} account before scheduling this automation.`
          });
          sendSSE(controller, encoder, {
            type: 'connect_request',
            provider: provider,
            automation_id: context.automationId,
            user_id: user.id
          });
          return { type: 'error', message: 'Connection required' };
        }

        // Get valid token
        const accessToken = await getValidProviderToken(provider, integration, user.id, context.automationId);
        if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
          const providerName = provider === 'google' ? 'Google' : provider.charAt(0).toUpperCase() + provider.slice(1);
          sendSSE(controller, encoder, {
            content: `Your ${providerName} connection has expired. Please reconnect to schedule this automation.`
          });
          sendSSE(controller, encoder, {
            type: 'connect_request',
            provider: provider,
            automation_id: context.automationId,
            user_id: user.id,
            reason: 'Connection expired'
          });
          return { type: 'error', message: 'Token expired' };
        }

        tokens[provider] = accessToken;
        tokenMapping[provider] = { access_token: accessToken };
      }
    }

    // Add Supabase credentials for storage operations
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      tokens.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      log('[handleScheduleAutomation] Added Supabase service key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING');
    } else {
      log('[handleScheduleAutomation] WARNING: SUPABASE_SERVICE_ROLE_KEY not found in environment');
    }
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      tokens.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }

    // Step 5: Build payload
    const payload = {
      workflow: workflow,  // The workflow template
      initialData: {
        ...(context.collectedFields || {}),  // Config as initialData
        user_id: user.id,  // Add user_id to initialData
        automation_id: context.automationId  // Add automation_id to initialData
      },
      tokens: tokens,
      tokenMapping: tokenMapping
    };

    log('[handleScheduleAutomation] Built payload:', {
      hasWorkflow: !!payload.workflow,
      workflowNodes: payload.workflow?.nodes?.length || 0,
      initialData: payload.initialData,
      hasTokens: Object.keys(tokens).length > 0,
      tokenProviders: Object.keys(tokens)
    });

    // Step 6: Route based on schedule type
    const AUTOMATION_RUNNER_URL = process.env.AUTOMATION_RUNNER_URL || 'http://localhost:4000';
    let response;
    let endpoint;

    if (schedule.type === 'recurring') {
      // Recurring schedule - use /schedule endpoint
      payload.cronExpression = schedule.cron;
      payload.automation_id = context.automationId;
      payload.user_id = user.id;
      payload.config = context.collectedFields || {};
      // Auto-cleanup: limit recurring jobs to 100 runs to prevent Redis bloat
      payload.maxRuns = 100;
      endpoint = `${AUTOMATION_RUNNER_URL}/schedule`;

      log('[handleScheduleAutomation] Recurring schedule:', {
        endpoint,
        cronExpression: payload.cronExpression,
        humanReadable: schedule.humanReadable,
        automation_id: payload.automation_id,
        maxRuns: payload.maxRuns
      });

      sendSSE(controller, encoder, {
        content: `Scheduling "${automation.name}" to run ${schedule.humanReadable.toLowerCase()}...`
      });
    } else {
      // One-time schedule - use /queue endpoint with delay
      payload.delay = schedule.delay;
      endpoint = `${AUTOMATION_RUNNER_URL}/queue`;

      log('[handleScheduleAutomation] One-time schedule:', {
        endpoint,
        delay: payload.delay,
        delayInMinutes: (payload.delay / 60000).toFixed(2),
        humanReadable: schedule.humanReadable
      });

      sendSSE(controller, encoder, {
        content: `Scheduling "${automation.name}" to run ${schedule.humanReadable.toLowerCase()}...`
      });
    }

    log('[handleScheduleAutomation] Full payload being sent:', JSON.stringify({
      ...payload,
      workflow: payload.workflow ? `<workflow with ${payload.workflow.nodes?.length} nodes>` : null,
      tokens: Object.keys(payload.tokens || {})
    }, null, 2));

    // Step 7: Call backend endpoint
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    log('[handleScheduleAutomation] Response from automation-runner:', {
      status: response.status,
      ok: response.ok,
      result
    });

    // Step 8: Handle response
    if (!response.ok || !result.success) {
      sendSSE(controller, encoder, {
        content: `Failed to schedule: ${result.error || 'Unknown error'}. Please try again.`
      });
      return { type: 'error', message: result.error };
    }

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
