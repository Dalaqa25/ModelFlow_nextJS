// Setup handler functions
import { supabase, sendSSE, parseRequiredInputs, parseConnectors, getValidProviderToken, getAutomationStoragePath } from './shared.js';
import { log, logError } from './shared.js';

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
        .select('id, required_inputs, required_connectors, name, description')
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
        .select('id, required_inputs, required_connectors, name, description')
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

    const requiredInputs = parseRequiredInputs(automation.required_inputs);
    const requiredConnectors = parseConnectors(automation.required_connectors);
    
    log('[handleStartSetup] Parsed inputs:', requiredInputs);
    log('[handleStartSetup] Parsed connectors:', requiredConnectors);

    // Send setup_started event for frontend state
    sendSSE(controller, encoder, {
      type: 'setup_started',
      automation_id: automationId,
      automation_name: automation.name,
      required_inputs: requiredInputs,
      collected_fields: {}
    });

    // ======= STEP 1: CHECK CONNECTORS FIRST =======
    if (requiredConnectors.length > 0) {
      for (const rawConnector of requiredConnectors) {
        const connector = rawConnector.toLowerCase();
        const provider = connector.includes('sheets') || connector.includes('drive') 
          ? 'google' 
          : connector.includes('linkedin') ? 'linkedin' : connector;

        log(`[handleStartSetup] Checking ${provider} connection for automation ${automationId}`);
        // User authentication verified

        // FIRST: Check if user has this connector connected for THIS specific automation
        // Use email lookup to handle user_id mismatches
        const { data: automationConnection, error: automationError } = await supabase
          .from('user_automations')
          .select('access_token, refresh_token, user_id')
          .eq('automation_id', automationId)
          .eq('provider', provider)
          .not('access_token', 'is', null)
          .maybeSingle();

        log(`[handleStartSetup] Automation-specific connection check:`, {
          found: !!automationConnection,
          hasToken: !!automationConnection?.access_token,
          storedUserId: automationConnection?.user_id,
          currentUserId: user.id,
          error: automationError,
          automationId: automationId,
          provider: provider
        });

        if (automationConnection && automationConnection.access_token) {
          // Found connection - check if user_id matches
          if (automationConnection.user_id !== user.id) {
            log(`[handleStartSetup] ⚠️ User ID mismatch! Stored: ${automationConnection.user_id}, Current: ${user.id}`);
            log(`[handleStartSetup] Updating user_id to match current session...`);

            // Update the user_id to match current session
            await supabase
              .from('user_automations')
              .update({ user_id: user.id })
              .eq('automation_id', automationId)
              .eq('provider', provider);
          }

          // Already connected for this automation - skip to next connector
          log(`[handleStartSetup] ✓ ${provider} already connected for automation ${automationId}`);
          continue;
        }

        // SECOND: Check if user has this connector connected for ANY automation (can reuse tokens)
        const { data: existingConnection, error: existingError } = await supabase
          .from('user_automations')
          .select('access_token, refresh_token')
          .eq('user_id', user.id)
          .eq('provider', provider)
          .not('access_token', 'is', null)
          .limit(1)
          .maybeSingle();

        log(`[handleStartSetup] Any-automation connection check:`, {
          found: !!existingConnection,
          hasToken: !!existingConnection?.access_token,
          error: existingError
        });

        if (!existingConnection || !existingConnection.access_token) {
          // NOT CONNECTED - Show connect button and STOP
          log(`[handleStartSetup] ✗ ${provider} NOT connected - requesting connection`);

          // Don't repeat "Great choice!" - AI already said it
          const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
          sendSSE(controller, encoder, {
            content: `To get started, I need you to connect your ${providerName} account.`
          });

          sendSSE(controller, encoder, {
            type: 'connect_request',
            provider: provider,
            automation_id: automationId,
            user_id: user.id,
            reason: `Connect your ${provider} account to continue setup`
          });

          return false; // STOP HERE - wait for connection
        } else {
          // Connected elsewhere - copy tokens to this automation
          log(`[handleStartSetup] ✓ Copying ${provider} tokens from another automation to ${automationId}`);
          const { error: upsertError } = await supabase
            .from('user_automations')
            .upsert({
              user_id: user.id,
              automation_id: automationId,
              provider: provider,
              access_token: existingConnection.access_token,
              refresh_token: existingConnection.refresh_token,
              is_active: false,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,automation_id'
            });

          if (upsertError) {
            logError(`[handleStartSetup] Error copying tokens:`, upsertError);
          } else {
            log(`[handleStartSetup] ✓ Successfully copied ${provider} tokens`);
          }
        }
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
        const fieldName = (input.name || input).toUpperCase();
        return !!prefilledConfig[fieldName] || input.required === false;
      });

      if (allFilled) {
        // All required fields already pre-filled — skip asking, go straight to execution
        sendSSE(controller, encoder, {
          type: 'setup_started',
          automation_id: automationId,
          automation_name: automation.name,
          required_inputs: requiredInputs,
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

      // Not all filled — ask for the first missing field using its description from required_inputs.
      // This is fully dynamic: the DB schema drives the questions.
      const firstMissing = requiredInputs.find(input => {
        const fieldName = (input.name || input).toUpperCase();
        return !prefilledConfig[fieldName];
      }) || requiredInputs[0];

      const fieldName = (firstMissing.name || firstMissing).toUpperCase();
      const description = firstMissing.description || fieldName.toLowerCase().replace(/_/g, ' ');

      const introPhrase = requiredConnectors.length > 0 ? "Your account is connected." : "";

      sendSSE(controller, encoder, {
        content: `${introPhrase} Now, I need to know ${description.toLowerCase().endsWith('?') ? description : description + '.'} Could you please provide this?`
      });

      sendSSE(controller, encoder, {
        type: 'awaiting_input',
        automation_id: automationId,
        automation_name: automation.name,
        missing_fields: requiredInputs.filter(f => !prefilledConfig[(f.name || f).toUpperCase()]).map(f => (f.name || f).toUpperCase()),
        collected_config: prefilledConfig
      });

      if (Object.keys(prefilledConfig).length > 0) {
        sendSSE(controller, encoder, {
          type: 'hidden_context',
          context: `existing_config=${JSON.stringify(prefilledConfig)}`
        });
      }
    } else {
      sendSSE(controller, encoder, {
        content: `I have everything I need. Ready to run "${automation.name}"?`
      });
    }

    return false; // Wait for user response
  } catch (e) {
    logError('[handleStartSetup] Error:', e);
    sendSSE(controller, encoder, { content: "Something went wrong. Please try again." });
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
      .select('id, required_inputs, required_connectors, name, system_config')
      .eq('id', args.automation_id)
      .single();

    if (error || !automation) {
      sendSSE(controller, encoder, { content: "I couldn't find that automation. Please try again." });
      return;
    }

    // Check for required connectors
    const requiredConnectors = parseConnectors(automation.required_connectors);

    // For now, only handle the first required connector if it exists
    if (requiredConnectors.length > 0) {
      const primaryProvider = requiredConnectors[0].toLowerCase();

      // Get access token from user_automations
      const { data: integration } = await supabase
        .from('user_automations')
        .select('access_token, refresh_token, token_expiry')
        .eq('user_id', user.id)
        .eq('automation_id', args.automation_id)
        .eq('provider', primaryProvider)
        .maybeSingle();

      if (!integration) {
        const providerName = primaryProvider === 'google' ? 'Google' : primaryProvider.charAt(0).toUpperCase() + primaryProvider.slice(1);
        sendSSE(controller, encoder, { content: `I need to connect to your ${providerName} account first.` });
        sendSSE(controller, encoder, { type: 'connect_request', provider: primaryProvider, automation_id: args.automation_id, user_id: user.id });
        return;
      }

      const accessToken = await getValidProviderToken(primaryProvider, integration, user.id, args.automation_id);
      if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
        const providerName = primaryProvider === 'google' ? 'Google' : primaryProvider.charAt(0).toUpperCase() + primaryProvider.slice(1);
        sendSSE(controller, encoder, {
          content: `\n\n⚠️ Your ${providerName} connection has expired. Please reconnect your account to continue.`
        });
        sendSSE(controller, encoder, { type: 'connect_request', provider: primaryProvider, automation_id: args.automation_id, user_id: user.id, reason: 'Connection expired' });
        return;
      }
    }

    // Note: Do NOT send 'Got it!' here - callers (handleCollectTextInput, etc.) already do

    // Parse required inputs
    const requiredInputs = parseRequiredInputs(automation.required_inputs);

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
      const fieldName = (input.name || input).toUpperCase();

      if (config[fieldName]) {
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
      const fieldName = (input.name || input).toUpperCase();
      return !config[fieldName];
    });

    if (missingFields.length > 0) {
      // Ask for the first missing field specifically
      const firstMissing = missingFields[0];
      const fieldName = (firstMissing.name || firstMissing).toUpperCase();
      const friendlyName = fieldName.toLowerCase().replace(/_/g, ' ');
      const description = firstMissing.description || friendlyName;

      if (missingFields.length === 1) {
        sendSSE(controller, encoder, { content: `I just need one more thing: ${description.toLowerCase()}. Could you provide this?` });
      } else {
        sendSSE(controller, encoder, { content: `I still need a few things. First: ${description.toLowerCase()}. Could you provide this?` });
      }

      // Send automation context AND already-collected config so AI can pass it to collect_text_input
      sendSSE(controller, encoder, {
        type: 'awaiting_input',
        automation_id: args.automation_id,
        automation_name: automation.name,
        missing_fields: missingFields.map(f => (f.name || f).toUpperCase()),
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

    // All fields collected - show summary and ask for confirmation
    sendSSE(controller, encoder, { content: `\n✓ All info gathered! Here's what I have:\n\n` });

    // Build a nice summary
    const summaryItems = [];
    for (const input of requiredInputs) {
      const fieldName = (input.name || input).toUpperCase();
      const value = config[fieldName];
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
    sendSSE(controller, encoder, { content: "Error during setup. Please try again." });
  }
}
