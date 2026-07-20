// Setup handler functions
import { supabase, sendSSE, parseRequiredInputs, parseConnectors, getAutomationStoragePath } from './shared.js';
import { log, logError } from './shared.js';
import { configureActivepiecesAutomation, ensureRuntimeFlowForAutomation } from '@/lib/activepieces/provisioning';
import { listAutomationConnectionStatus } from '@/lib/activepieces/connections';
import { getCustomerTunablesFromWorkflow, normalizeSetupInputs } from '@/lib/activepieces/setup-schema';
import { detectImportedWorkflowCredentialRequirements } from '@/lib/credentials/workflow-requirements';
import {
  buildAutomationLifecycle,
  describePostSetupLifecycle,
  shouldConfigureActivepiecesAutomation,
} from '@/lib/activepieces/lifecycle';

function hasSetupValue(value) {
  return value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');
}

function normalizeSetupLookupKey(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function getSetupInputCandidates(input) {
  if (typeof input === 'string') return [input];

  const candidates = [
    input?.name,
    input?.fieldKey,
    input?.propName,
    input?.label,
  ];

  for (const candidate of [...candidates]) {
    if (!candidate) continue;
    const parts = String(candidate).split('.');
    if (parts.length > 1) candidates.push(parts.at(-1));
  }

  return candidates.filter(Boolean);
}

function getSetupConfigValue(config, input) {
  if (!config || typeof config !== 'object') return undefined;

  const exactConfig = {};
  const normalizedConfig = {};
  for (const [key, value] of Object.entries(config)) {
    exactConfig[String(key).toUpperCase()] = value;
    normalizedConfig[normalizeSetupLookupKey(key)] = value;
  }

  for (const candidate of getSetupInputCandidates(input)) {
    const exactKey = String(candidate).toUpperCase();
    if (Object.prototype.hasOwnProperty.call(exactConfig, exactKey)) {
      return exactConfig[exactKey];
    }

    const normalizedKey = normalizeSetupLookupKey(candidate);
    if (Object.prototype.hasOwnProperty.call(normalizedConfig, normalizedKey)) {
      return normalizedConfig[normalizedKey];
    }
  }

  return undefined;
}

function getSetupInputKey(input) {
  return String(
    typeof input === 'string'
      ? input
      : input?.fieldKey || input?.name || input?.propName || ''
  ).toUpperCase();
}

function getSetupErrorMessage(error, fallback) {
  if (error?.code === 'ACTIVEPIECES_RUNTIME_PROJECT_REQUIRED') {
    return 'ModelGrow could not create or use a hidden runtime workspace, so I stopped instead of putting internal runtime copies inside your editable builder project. Configure ACTIVEPIECES_PLATFORM_RUNTIME_PROJECT_ID, or clear old builder workspace clutter / raise the builder project limit, then try again.';
  }
  return fallback;
}

// Explain requirements in human-friendly terms
function explainRequirements(inputs) {
  const explanations = [];
  
  // Safety check: ensure inputs is iterable
  if (!inputs || !Array.isArray(inputs)) {
    log('[explainRequirements] inputs is not an array:', inputs);
    return [];
  }
  
  for (const input of inputs) {
    const name = (input.name || input).toUpperCase();
    const description = input.description;

    if (description) {
      explanations.push(`- ${description}`);
    } else if (input.type === 'file') {
      explanations.push(`- A file for: ${name.replace(/_/g, ' ').toLowerCase()}`);
    } else if (name.includes('EMAIL')) {
      explanations.push('- Your email address for notifications');
    } else {
      explanations.push(`- ${name.replace(/_/g, ' ').toLowerCase()}`);
    }
  }
  return explanations;
}

export { explainRequirements };

// Handle start_setup tool - immediately offer auto-setup as the default
export async function handleStartSetup(args, user, controller, encoder) {
  if (!user) {
    sendSSE(controller, encoder, { content: "To set up this automation, you'll need to sign into your account first." });
    sendSSE(controller, encoder, { type: 'connect_request', reason: 'Sign in to use automations' });
    return false;
  }

  try {
    let automation = null;
    let automationId = args.automation_id;

    log('[handleStartSetup] Called for automation:', automationId);

    // First try by UUID
    if (args.automation_id && args.automation_id.length > 10) {
      const { data, error } = await supabase
        .from('automations')
        .select('id, is_active, required_inputs, required_connectors, developer_keys, name, description, workflow, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
        .eq('id', args.automation_id)
        .single();

      if (!error && data) {
        automation = data;
      }
    }

    // Fallback: search by name if UUID didn't work
    if (!automation && args.automation_name) {
      const { data, error } = await supabase
        .from('automations')
        .select('id, is_active, required_inputs, required_connectors, developer_keys, name, description, workflow, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
        .ilike('name', `%${args.automation_name}%`)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!error && data) {
        automation = data;
        automationId = data.id;
      }
    }

    if (!automation) {
      sendSSE(controller, encoder, { content: "I couldn't find that automation. Could you tell me which one you'd like to use?" });
      return false;
    }

    if (!automation.is_active) {
      sendSSE(controller, encoder, { content: "That automation is no longer available. It may have been removed by the developer." });
      return false;
    }

    const requiredInputs = normalizeSetupInputs(parseRequiredInputs(automation.required_inputs));
    const optionalInputs = getCustomerTunablesFromWorkflow(automation.workflow);
    const requiredConnectors = parseConnectors(automation.required_connectors);
    const usesActivepieces = Boolean(automation.activepieces_source_flow_id);
    const importedCredentialRequirements = usesActivepieces
      ? []
      : detectImportedWorkflowCredentialRequirements(automation.workflow, {
          developerKeyNames: Object.keys(automation.developer_keys || {}),
        });
    const usesCredentialBridge = usesActivepieces || importedCredentialRequirements.length > 0;
    
    log('[handleStartSetup] Parsed inputs:', requiredInputs);
    log('[handleStartSetup] Parsed connectors:', requiredConnectors);

    // Send setup_started event for frontend state
    sendSSE(controller, encoder, {
      type: 'setup_started',
      automation_id: automationId,
      automation_name: automation.name,
      required_inputs: requiredInputs,
      optional_inputs: optionalInputs,
      collected_fields: {}
    });

    const hasCredentialRequirements = usesActivepieces
      ? requiredConnectors.length > 0
      : importedCredentialRequirements.length > 0;

    if (usesCredentialBridge && hasCredentialRequirements) {
      const runtimeFlow = usesActivepieces
        ? (await ensureRuntimeFlowForAutomation({ supabase, user, automation })).runtimeFlow
        : null;
      const connectionStatus = await listAutomationConnectionStatus({ supabase, user, automation });
      const missingConnections = connectionStatus.requirements.filter((requirement) => !requirement.connected);

      if (missingConnections.length > 0) {
        const displayLabels = missingConnections.map((connection) => connection.displayName).filter(Boolean);
        const connectorLabel = displayLabels.length === 1
          ? displayLabels[0]
          : displayLabels.join(', ');
        const nextConnectionLabel = missingConnections[0]?.displayName || requiredConnectors[0] || 'the required app';

        sendSSE(controller, encoder, {
          content: `To continue, connect the required account${missingConnections.length === 1 ? '' : 's'}: ${connectorLabel || nextConnectionLabel}.\n\nI'll keep you inside ModelGrow and use the connected app only for the secure OAuth connection.`
        });

        sendSSE(controller, encoder, {
          type: 'activepieces_connect_request',
          provider: nextConnectionLabel,
          automation_id: automationId,
          automation_name: automation.name,
          activepieces_project_id: runtimeFlow?.activepieces_project_id || connectionStatus.projectId,
          activepieces_flow_id: runtimeFlow?.activepieces_flow_id || null,
          activepieces_connections: connectionStatus.requirements,
          reason: `Connect ${nextConnectionLabel}`
        });

        return false;
      }
    }

    // ======= STEP 2: ALL CONNECTORS DONE - Collect required inputs =======
    if (requiredInputs.length > 0) {

      // Only use explicitly pre-filled values (from PREFILLED hint or already-collected fields).
      // Do NOT try to extract values from conversation text — that causes wrong matches
      // (e.g., "damaged vehicle parts" → VEHICLE = "parts").
      const prefilledConfig = {};
      const conversationText = args.conversation_history || args.hint || '';

      // Only honor explicit PREFILLED hint from orchestrator (rare, intentional overrides)
      const prefilledMatch = conversationText.match(/PREFILLED:\s*(.+)/i);
      if (prefilledMatch) {
        const pairs = prefilledMatch[1].matchAll(/([A-Z_]+)=([^=\n]+?)(?=\s+[A-Z_]+=|$)/g);
        for (const pair of pairs) {
          prefilledConfig[pair[1].trim()] = pair[2].trim();
        }
        log('[handleStartSetup] Parsed PREFILLED from hint:', prefilledConfig);
      }

      log('[handleStartSetup] prefilledConfig:', prefilledConfig);

      const allFilled = Object.keys(prefilledConfig).length > 0 && requiredInputs.every(input => {
        return hasSetupValue(getSetupConfigValue(prefilledConfig, input)) || input.required === false;
      });

      if (allFilled) {
        // All required fields already pre-filled — skip asking, go straight to execution
        sendSSE(controller, encoder, {
          type: 'setup_started',
          automation_id: automationId,
          automation_name: automation.name,
          required_inputs: requiredInputs,
          optional_inputs: optionalInputs,
          collected_fields: prefilledConfig
        });
        sendSSE(controller, encoder, {
          type: 'hidden_context',
          context: `existing_config=${JSON.stringify(prefilledConfig)}`
        });
        return handleAutoSetupWithExisting(
          { automation_id: automationId, automation_name: automation.name },
          prefilledConfig,
          user,
          controller,
          encoder
        );
      }

      const missingFieldKeys = requiredInputs
        .filter(input => !hasSetupValue(getSetupConfigValue(prefilledConfig, input)))
        .map(getSetupInputKey);

      sendSSE(controller, encoder, {
        content: `${requiredConnectors.length > 0 ? 'Your account is connected.' : 'Setup is ready.'} Fill the remaining fields below so ModelGrow can prepare your private runtime copy.`
      });

      sendSSE(controller, encoder, {
        type: 'awaiting_input',
        automation_id: automationId,
        automation_name: automation.name,
        required_inputs: requiredInputs,
        optional_inputs: optionalInputs,
        missing_fields: missingFieldKeys,
        collected_config: prefilledConfig
      });

      if (Object.keys(prefilledConfig).length > 0) {
        sendSSE(controller, encoder, {
          type: 'hidden_context',
          context: `existing_config=${JSON.stringify(prefilledConfig)}`
        });
      }
    } else if (optionalInputs.length > 0) {
      sendSSE(controller, encoder, {
        content: `Required setup is complete. Keep the developer defaults or customize a few safe settings before running "${automation.name}".`
      });
      sendSSE(controller, encoder, {
        type: 'customization_request',
        automation_id: automationId,
        automation_name: automation.name,
        required_inputs: [],
        optional_inputs: optionalInputs,
        collected_config: {},
      });
    } else {
      sendSSE(controller, encoder, {
        content: `I have everything I need. Ready to run "${automation.name}"?`
      });
    }

    return false; // Wait for user response
  } catch (e) {
    logError('[handleStartSetup] Error:', e);
    sendSSE(controller, encoder, { content: getSetupErrorMessage(e, "Something went wrong. Please try again.") });
    return false;
  }
}

// Handle auto_setup tool - creates everything automatically
export async function handleAutoSetup(args, user, controller, encoder, setupContext) {
  // Pass existing_config if provided by the AI
  let existingConfig = args.existing_config || {};

  log('[AUTO_SETUP] Called with args:', args);
  log('[AUTO_SETUP] Existing config from AI:', existingConfig);
  log('[AUTO_SETUP] Setup context available:', !!setupContext);
  
  // PRIORITY 1: Check if setupContext has existing files from list_automation_files
  if (setupContext && setupContext.existingFiles) {
    log('[AUTO_SETUP] Found existing files in setupContext:', setupContext.existingFiles);
    Object.assign(existingConfig, setupContext.existingFiles);
  }

  // CRITICAL FIX: Check ALL conversation messages for file uploads
  // This ensures we never miss an upload, even in long conversations
  if (setupContext && setupContext.conversationHistory) {
    log('[AUTO_SETUP] Conversation history length:', setupContext.conversationHistory.length);
    const allMessages = setupContext.conversationHistory.join('\n');
    log('[AUTO_SETUP] Full conversation (first 1000 chars):', allMessages.substring(0, 1000));
    log('[AUTO_SETUP] Full conversation (last 1000 chars):', allMessages.substring(allMessages.length - 1000));

    // Look for ALL file upload markers in the entire conversation
    // Pattern 1: [CRITICAL - FILE UPLOAD COMPLETE] Field "VIDEO_FILES" ... Path: "path"
    const criticalPattern = /\[CRITICAL - FILE UPLOAD COMPLETE\][\s\S]*?Field\s+"?([A-Z_]+)"?[\s\S]*?Path:\s+"([^"]+)"/gi;
    
    let match;
    let foundCount = 0;
    
    while ((match = criticalPattern.exec(allMessages)) !== null) {
      const fieldName = match[1];
      const filePath = match[2];
      foundCount++;
      log('[AUTO_SETUP] Found file upload #' + foundCount + ':', fieldName, '=', filePath);
      existingConfig[fieldName] = filePath;
    }

    // Pattern 2: [EXISTING_FILES] from list_automation_files
    if (foundCount === 0) {
      log('[AUTO_SETUP] Trying EXISTING_FILES pattern...');
      const existingFilesPattern = /\[EXISTING_FILES[^\]]*VIDEO_FILES="([^"]+)"/gi;
      
      while ((match = existingFilesPattern.exec(allMessages)) !== null) {
        const filePath = match[1];
        const fieldName = 'VIDEO_FILES';
        foundCount++;
        log('[AUTO_SETUP] Found existing file #' + foundCount + ':', fieldName, '=', filePath);
        existingConfig[fieldName] = filePath;
      }
      
      if (foundCount === 0) {
        log('[AUTO_SETUP] No EXISTING_FILES markers found');
        log('[AUTO_SETUP] Searching for pattern in:', allMessages.substring(allMessages.length - 500));
      }
    }

    // Pattern 3: Fallback - look for "Path: " after file upload markers
    if (foundCount === 0) {
      log('[AUTO_SETUP] Trying fallback pattern...');
      const fallbackPattern = /\[(?:USER UPLOADED FILE|FILE UPLOAD COMPLETE)\][\s\S]{0,500}?Path:\s+"([^"]+)"/gi;
      
      while ((match = fallbackPattern.exec(allMessages)) !== null) {
        const filePath = match[1];
        // Assume VIDEO_FILES if we can't determine the field name
        const fieldName = 'VIDEO_FILES';
        foundCount++;
        log('[AUTO_SETUP] Found file upload (fallback) #' + foundCount + ':', fieldName, '=', filePath);
        existingConfig[fieldName] = filePath;
      }
    }

    if (foundCount === 0) {
      log('[AUTO_SETUP] WARNING: No file uploads found in conversation!');
    }
  } else {
    log('[AUTO_SETUP] WARNING: No conversation history provided!');
  }

  log('[AUTO_SETUP] Final existingConfig:', existingConfig);

  // Pass conversation history into args so handleAutoSetupWithExisting can scan it
  if (setupContext && setupContext.conversationHistory) {
    args.conversation_history = setupContext.conversationHistory.join('\n');
  }

  return handleAutoSetupWithExisting(args, existingConfig, user, controller, encoder);
}

// Auto-setup with some fields already collected - exported for use by other handlers
export async function handleAutoSetupWithExisting(args, existingConfig, user, controller, encoder) {
  if (!user) {
    sendSSE(controller, encoder, { content: "To run this automation, you'll need to sign into your account first." });
    sendSSE(controller, encoder, { type: 'connect_request', reason: 'Sign in to use automations' });
    return;
  }

  try {
    // Get automation details - include system_config for internal storage settings
    const { data: automation, error } = await supabase
      .from('automations')
      .select('id, required_inputs, required_connectors, developer_keys, name, workflow, system_config, activepieces_source_flow_id, activepieces_source_project_id, activepieces_trigger_type')
      .eq('id', args.automation_id)
      .single();

    if (error || !automation) {
      sendSSE(controller, encoder, { content: "I couldn't find that automation. Please try again." });
      return;
    }

    // Check for required connectors
    const requiredConnectors = parseConnectors(automation.required_connectors);
    const importedRequirements = automation.activepieces_source_flow_id
      ? []
      : detectImportedWorkflowCredentialRequirements(automation.workflow, {
          developerKeyNames: Object.keys(automation.developer_keys || {}),
        });
    if (requiredConnectors.length > 0 || importedRequirements.length > 0) {
      const connectionStatus = await listAutomationConnectionStatus({ supabase, user, automation });
      const missingConnections = connectionStatus.requirements.filter((requirement) => !requirement.connected);
      if (missingConnections.length > 0) {
        const nextConnection = missingConnections[0];
        sendSSE(controller, encoder, {
          content: `I need you to connect ${nextConnection.displayName || 'the required app'} first.`
        });
        sendSSE(controller, encoder, {
          type: 'activepieces_connect_request',
          provider: nextConnection.displayName,
          automation_id: args.automation_id,
          activepieces_project_id: connectionStatus.projectId,
          activepieces_connections: connectionStatus.requirements,
          reason: 'Connection required',
        });
        return;
      }
    }

    // Note: Do NOT send 'Got it!' here - callers (handleCollectTextInput, etc.) already do

    // Parse required inputs
    const requiredInputs = normalizeSetupInputs(parseRequiredInputs(automation.required_inputs));
    const optionalInputs = getCustomerTunablesFromWorkflow(automation.workflow);

    // Helper function to clean config values from leaked system prompts
    const cleanConfigValue = (value) => {
      if (typeof value === 'string') {
        // Remove any [ACTIVE SETUP: ...] blocks and other system prompts
        return value.replace(/\s*\[ACTIVE SETUP:[\s\S]*?\]\s*/g, '').trim();
      }
      return value;
    };

    // Normalize existing config keys to uppercase for matching and clean values
    const config = {};
    Object.entries(existingConfig).forEach(([key, value]) => {
      config[key.toUpperCase()] = cleanConfigValue(value);
    });

    // Process required inputs - only handle email fields automatically
    for (const input of requiredInputs) {
      const fieldName = getSetupInputKey(input);

      if (hasSetupValue(getSetupConfigValue(config, input))) {
        continue; // Skip if already have this field
      }

      if (fieldName.includes('EMAIL')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (profile?.email) {
          config[fieldName] = profile.email;
          sendSSE(controller, encoder, { content: `✓ Using your registered email\n` });
          sendSSE(controller, encoder, { type: 'field_collected', field_name: fieldName, value: profile.email });
        }
      }
    }

    // Handle Supabase Storage path provisioning from system_config (internal, not shown to user)
    const systemConfig = automation.system_config || [];
    for (const sysConf of systemConfig) {
      const fieldName = (sysConf.name || '').toUpperCase();
      if ((fieldName.includes('STORAGE_PATH') || fieldName.includes('STORAGE_FOLDER')) && sysConf.bucket) {
        const storagePath = getAutomationStoragePath(user.id, automation.id);
        config[fieldName] = storagePath;
        // No user-facing message - this is internal config
        sendSSE(controller, encoder, { type: 'field_collected', field_name: fieldName, value: storagePath });
      }
    }

    // Check if we have all required fields
    // Only use explicitly collected values — no conversation text scanning.
    // Values come from field_collected events (collect_text_input handler).
    const missingFields = requiredInputs.filter(input => {
      return !hasSetupValue(getSetupConfigValue(config, input));
    });

    if (missingFields.length > 0) {
      sendSSE(controller, encoder, {
        content: `I still need ${missingFields.length === 1 ? 'one setup field' : `${missingFields.length} setup fields`}. Fill them below and then continue.`
      });

      // Send automation context AND already-collected config so AI can pass it to collect_text_input
      sendSSE(controller, encoder, {
        type: 'awaiting_input',
        automation_id: args.automation_id,
        automation_name: automation.name,
        required_inputs: requiredInputs,
        optional_inputs: optionalInputs,
        missing_fields: missingFields.map(getSetupInputKey),
        collected_config: config  // Include already-collected fields (folder IDs, etc.)
      });

      // CRITICAL: Send existing_config to hiddenContext so the AI Remembers!
      if (Object.keys(config).length > 0) {
        sendSSE(controller, encoder, {
          type: 'hidden_context',
          context: `existing_config=${JSON.stringify(config)}`
        });
      }

      return;
    }

    // Trigger-driven Activepieces workflows should be configured and published
    // directly when setup is complete. The lifecycle classifier is generic:
    // Gmail, Slack, HubSpot, schedules, etc. all reduce to a small set of
    // runtime states, so the language model never gets to invent the next step.
    const lifecycle = buildAutomationLifecycle({ automation, config });
    log('[AUTO_SETUP] Lifecycle decision:', {
      automationId: automation.id,
      kind: lifecycle.trigger.kind,
      postSetupAction: lifecycle.postSetupAction,
      allowedActions: lifecycle.allowedActions,
      forbiddenActions: lifecycle.forbiddenActions,
    });

    if (shouldConfigureActivepiecesAutomation({ automation, lifecycle })) {
      await configureActivepiecesAutomation({
        supabase,
        user,
        automation,
        config,
      });

      sendSSE(controller, encoder, {
        content: `✅ "${automation.name}" is enabled. ${describePostSetupLifecycle(lifecycle)}`
      });
      sendSSE(controller, encoder, {
        type: 'automation_complete',
        automation_id: automation.id,
        automation_name: automation.name,
        result: {
          success: true,
          automation_id: automation.id,
          automation_name: automation.name,
          engine: 'activepieces',
          mode: lifecycle.trigger.kind,
          active: true,
          lifecycle,
        }
      });
      return;
    }

    // All fields collected - show summary and ask for confirmation
    sendSSE(controller, encoder, { content: `\n✓ All info gathered! Here's what I have:\n\n` });

    // Build a nice summary
    const summaryItems = [];
    for (const input of requiredInputs) {
      const fieldName = getSetupInputKey(input);
      const value = getSetupConfigValue(config, input);
      const friendlyName = fieldName.toLowerCase().replace(/_/g, ' ').replace(/id$/, '').trim();

      if (fieldName.includes('FOLDER') || fieldName.includes('SPREADSHEET') || fieldName.includes('DOCUMENT')) {
        summaryItems.push(`• ${friendlyName}: ✓ Ready`);
      } else if (fieldName.includes('INTERVAL_HOURS') && !isNaN(value)) {
        const hours = parseFloat(value);
        let displayTime = `${hours} hours`;
        if (hours < 1) {
          displayTime = `${Math.round(hours * 60)} minutes`;
        } else if (hours === 1) {
          displayTime = "1 hour";
        }
        summaryItems.push(`• ${friendlyName}: ${displayTime}`);
      } else {
        summaryItems.push(`• ${friendlyName}: ${value}`);
      }
    }

    sendSSE(controller, encoder, { content: summaryItems.join('\n') });
    sendSSE(controller, encoder, { content: `\n\nLook good? Say "run it" to start, or tell me what to change.` });

    // Send the ready-to-execute state so next "run it" triggers execution
    sendSSE(controller, encoder, {
      type: 'ready_to_execute',
      automation_id: args.automation_id,
      automation_name: automation.name,
      config: config
    });

    // CRITICAL: Send config as parseable context so AI remembers it when user says "run it"
    // This gets included in the chat history and extractSetupContext can find it
    // Use a special event type that doesn't display to user
    sendSSE(controller, encoder, {
      type: 'hidden_context',
      context: `[READY_TO_RUN automation_id="${args.automation_id}" config=${JSON.stringify(config)}]`
    });

    return; // Don't auto-execute, wait for confirmation
  } catch (e) {
    logError('[handleAutoSetupWithExisting] Error:', e);
    sendSSE(controller, encoder, { content: getSetupErrorMessage(e, "Error during setup. Please try again.") });
  }
}
