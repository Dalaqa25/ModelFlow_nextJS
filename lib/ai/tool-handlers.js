// Tool handler functions for AI chat
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/ai/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Handle show_user_automations tool - display user's automation instances with stats
export async function handleShowUserAutomations(args, user, controller, encoder) {
  console.log('[show_user_automations] Called with args:', args);

  try {
    const statusFilter = args.status_filter || 'all';

    // Fetch user's automation instances (now consolidated in user_automations)
    let query = supabase
      .from('user_automations')
      .select(`
        id,
        automation_id,
        parameters,
        is_active,
        last_run,
        created_at,
        automations (
          name,
          description,
          price_per_run
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusFilter === 'active') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'paused') {
      query = query.eq('is_active', false);
    }

    const { data: instances, error } = await query;

    if (error) {
      console.error('[show_user_automations] Error:', error);
      sendSSE(controller, encoder, { content: "Sorry, I couldn't fetch your automations. Please try again." });
      return;
    }

    if (!instances || instances.length === 0) {
      sendSSE(controller, encoder, {
        content: statusFilter === 'all'
          ? "You don't have any automations set up yet. Want to create one?"
          : `You don't have any ${statusFilter} automations.`
      });
      return;
    }

    // Fetch execution stats for each automation
    const automationsWithStats = await Promise.all(
      instances.map(async (instance) => {
        // Get execution count and success rate
        const { data: executions } = await supabase
          .from('automation_executions')
          .select('status, credits_used')
          .eq('automation_id', instance.automation_id)
          .eq('executed_by', user.email);

        const totalRuns = executions?.length || 0;
        const successfulRuns = executions?.filter(e => e.status === 'success').length || 0;
        const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
        const totalCredits = executions?.reduce((sum, e) => sum + (e.credits_used || 0), 0) || 0;

        return {
          id: instance.id,
          automation_id: instance.automation_id,
          name: instance.automations?.name || 'Unknown Automation',
          description: instance.automations?.description,
          enabled: instance.is_active,
          last_run: instance.last_run,
          created_at: instance.created_at,
          config: instance.parameters || {},
          total_runs: totalRuns,
          success_rate: successRate,
          total_credits: totalCredits,
          price_per_run: instance.automations?.price_per_run || 0
        };
      })
    );

    // Send the data as a special UI component
    sendSSE(controller, encoder, {
      type: 'automation_instances',
      instances: automationsWithStats
    });

    // Also send a natural language summary
    const activeCount = automationsWithStats.filter(a => a.enabled).length;
    const pausedCount = automationsWithStats.filter(a => !a.enabled).length;

    let summary = `You have ${automationsWithStats.length} automation${automationsWithStats.length !== 1 ? 's' : ''}`;
    if (statusFilter === 'all' && (activeCount > 0 || pausedCount > 0)) {
      summary += ` (${activeCount} active, ${pausedCount} paused)`;
    }
    summary += '. ';

    if (automationsWithStats.length > 0) {
      summary += 'You can enable, disable, or reconfigure any of them.';
    }

    sendSSE(controller, encoder, { content: summary });

  } catch (e) {
    console.error('[show_user_automations] Error:', e);
    sendSSE(controller, encoder, { content: "Error fetching automations. Please try again." });
  }
}

// Helper to send SSE data
const sendSSE = (controller, encoder, data) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
};

// Handle search_automations tool
export async function handleSearchAutomations(args, controller, encoder) {
  // Send searching indicator
  sendSSE(controller, encoder, { type: 'searching', status: 'start' });

  try {
    let searchResults = [];
    const queryLower = args.query.toLowerCase();

    // Extract meaningful keywords (remove common words)
    const stopWords = ['i', 'do', 'want', 'to', 'my', 'the', 'a', 'an', 'is', 'are', 'can', 'you', 'help', 'me', 'with', 'for', 'and', 'or', 'hey', 'hi', 'hello', 'please', 'automate', 'automation'];
    const keywords = queryLower.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

    // Detect platform mentions for strict filtering
    const platforms = ['tiktok', 'linkedin', 'twitter', 'instagram', 'youtube', 'facebook', 'google', 'slack', 'discord'];
    const mentionedPlatform = platforms.find(p => queryLower.includes(p));

    console.log('[SEARCH] Query:', args.query, '| Keywords:', keywords, '| Platform:', mentionedPlatform);

    // STEP 1: Fetch all active automations
    const { data: allActive } = await supabase
      .from('automations')
      .select('id, name, description, required_inputs, required_connectors, price_per_run')
      .eq('is_active', true);

    if (allActive && allActive.length > 0) {
      // STEP 2: Score and filter automations
      const scored = allActive.map(automation => {
        const nameLower = automation.name.toLowerCase();
        const descLower = (automation.description || '').toLowerCase();
        const nameDesc = `${nameLower} ${descLower}`;
        const connectors = parseConnectors(automation.required_connectors).map(c => c.toLowerCase());

        // Check if automation matches platform requirement
        const matchesPlatform = !mentionedPlatform ||
          nameLower.includes(mentionedPlatform) ||
          connectors.some(c => c.includes(mentionedPlatform));

        // Score by keyword matches
        const keywordMatches = keywords.filter(kw => nameDesc.includes(kw)).length;

        // Bonus for name match
        const nameBonus = keywords.some(kw => nameLower.includes(kw)) ? 2 : 0;

        return {
          ...automation,
          matchesPlatform,
          score: keywordMatches + nameBonus
        };
      });

      // STEP 3: Filter by platform (if mentioned) and sort by score
      searchResults = scored
        .filter(a => a.matchesPlatform && a.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      console.log('[SEARCH] Scored results:', searchResults.map(r => ({ name: r.name, score: r.score, matches: r.matchesPlatform })));
    }

    // If no results from scoring, try semantic search (but still filter by platform)
    if (searchResults.length === 0) {
      try {
        const queryEmbedding = await generateEmbedding(args.query);
        const { data, error } = await supabase.rpc('search_automations', {
          query_embedding: queryEmbedding,
          match_limit: 5
        });
        if (!error && data) {
          const MINIMUM_SIMILARITY = 0.45; // Higher threshold
          let semanticResults = data.filter(r => r.similarity >= MINIMUM_SIMILARITY);

          // Filter by platform if mentioned
          if (mentionedPlatform) {
            semanticResults = semanticResults.filter(r => {
              const nameLower = r.name.toLowerCase();
              const connectors = parseConnectors(r.required_connectors).map(c => c.toLowerCase());
              return nameLower.includes(mentionedPlatform) || connectors.some(c => c.includes(mentionedPlatform));
            });
          }

          searchResults = semanticResults.slice(0, 3);
        }
      } catch (embeddingError) {
        // Embedding failed, results stay empty
        console.error('[SEARCH] Embedding error:', embeddingError);
      }
    }

    const filteredResults = searchResults || [];

    const normalizedResults = filteredResults.map(r => {
      let parsedInputs = r.required_inputs;
      if (Array.isArray(r.required_inputs) && r.required_inputs.length > 0 && typeof r.required_inputs[0] === 'string') {
        try { parsedInputs = r.required_inputs.map(input => JSON.parse(input)); } catch (e) { }
      }
      return { ...r, required_inputs: parsedInputs };
    });

    // Clear searching indicator
    sendSSE(controller, encoder, { type: 'searching', status: 'end' });

    if (normalizedResults.length > 0) {
      // Send intro text - different messaging for single vs multiple automations
      const isSingleAutomation = normalizedResults.length === 1;
      const introText = isSingleAutomation
        ? "I found an automation that can help!\n\n"
        : "I have some automations that might help!\n\n";
      sendSSE(controller, encoder, { content: introText });

      // Send structured automation list for styled rendering
      const formattedAutomations = normalizedResults.map((automation, index) => {
        const price = automation.price_per_run === 0 ? 'Free' : `$${(automation.price_per_run / 100).toFixed(2)}`;
        const connectors = parseConnectors(automation.required_connectors);
        return {
          index: index + 1,
          name: automation.name,
          price,
          description: automation.description || 'No description',
          requires: connectors.length > 0 ? connectors : ['None']
        };
      });

      sendSSE(controller, encoder, { type: 'automation_list', automations: formattedAutomations });

      // Different call-to-action for single vs multiple automations
      const ctaText = isSingleAutomation
        ? "\nWould you like me to set this up for you?"
        : "\nJust tell me which one you'd like to use!";
      sendSSE(controller, encoder, { content: ctaText });

      // Send automation context for AI to reference later - INCLUDE DESCRIPTIONS so AI doesn't hallucinate!
      const contextStr = normalizedResults.map(a =>
        `- "${a.name}" (UUID: ${a.id})\n  Description: ${a.description || 'No description available'}\n  Requires: ${parseConnectors(a.required_connectors).join(', ') || 'None'}`
      ).join('\n\n');
      sendSSE(controller, encoder, { type: 'automation_context', context: contextStr });
    } else {
      // NO RESULTS - Send popup trigger for community redirect
      sendSSE(controller, encoder, { type: 'no_results_popup', query: args.query });
      sendSSE(controller, encoder, { content: "I couldn't find an automation for that. But don't worry – you can request it in our community!" });
    }
  } catch (e) {
    // Clear searching indicator on error
    sendSSE(controller, encoder, { type: 'searching', status: 'end' });
    sendSSE(controller, encoder, { content: "Sorry, I had trouble searching. Please try again." });
  }
}

// Handle start_setup tool - immediately offer auto-setup as the default
export async function handleStartSetup(args, user, controller, encoder) {

  try {
    let automation = null;
    let automationId = args.automation_id;

    console.log('[handleStartSetup] Called for automation:', automationId);

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
        const provider = connector.includes('sheets') || connector.includes('drive') ? 'google' : connector;

        console.log(`[handleStartSetup] Checking ${provider} connection for automation ${automationId}`);
        console.log(`[handleStartSetup] Current user:`, { id: user.id, email: user.email });

        // FIRST: Check if user has this connector connected for THIS specific automation
        // Use email lookup to handle user_id mismatches
        const { data: automationConnection, error: automationError } = await supabase
          .from('user_automations')
          .select('access_token, refresh_token, user_id')
          .eq('automation_id', automationId)
          .eq('provider', provider)
          .not('access_token', 'is', null)
          .maybeSingle();

        console.log(`[handleStartSetup] Automation-specific connection check:`, {
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
            console.log(`[handleStartSetup] ⚠️ User ID mismatch! Stored: ${automationConnection.user_id}, Current: ${user.id}`);
            console.log(`[handleStartSetup] Updating user_id to match current session...`);

            // Update the user_id to match current session
            await supabase
              .from('user_automations')
              .update({ user_id: user.id })
              .eq('automation_id', automationId)
              .eq('provider', provider);
          }

          // Already connected for this automation - skip to next connector
          console.log(`[handleStartSetup] ✓ ${provider} already connected for automation ${automationId}`);
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

        console.log(`[handleStartSetup] Any-automation connection check:`, {
          found: !!existingConnection,
          hasToken: !!existingConnection?.access_token,
          error: existingError
        });

        if (!existingConnection || !existingConnection.access_token) {
          // NOT CONNECTED - Show connect button and STOP
          console.log(`[handleStartSetup] ✗ ${provider} NOT connected - requesting connection`);

          // Don't repeat "Great choice!" - AI already said it
          const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
          sendSSE(controller, encoder, {
            content: `To get started, I need you to connect your ${providerName} account.`
          });

          sendSSE(controller, encoder, {
            type: 'connect_request',
            provider: provider,
            automation_id: automationId,
            reason: `Connect your ${provider} account to continue setup`
          });

          return false; // STOP HERE - wait for connection
        } else {
          // Connected elsewhere - copy tokens to this automation
          console.log(`[handleStartSetup] ✓ Copying ${provider} tokens from another automation to ${automationId}`);
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
            console.error(`[handleStartSetup] Error copying tokens:`, upsertError);
          } else {
            console.log(`[handleStartSetup] ✓ Successfully copied ${provider} tokens`);
          }
        }
      }
    }

    // ======= STEP 2: ALL CONNECTORS DONE - Show remaining requirements =======
    const requirements = explainRequirements(requiredInputs);

    // Choose the right intro phrase based on whether we actually checked/connected accounts
    const introPhrase = requiredConnectors.length > 0
      ? "Perfect! Your account is connected."
      : "Perfect!";

    if (requirements.length > 0) {
      const requirementsList = requirements.join('\n');
      sendSSE(controller, encoder, {
        content: `${introPhrase} Now I need:\n\n${requirementsList}\n\nReady to proceed?`
      });
    } else {
      sendSSE(controller, encoder, {
        content: `${introPhrase} I have everything I need. Ready to run "${automation.name}"?`
      });
    }

    return false; // Wait for user response
  } catch (e) {
    console.error('[handleStartSetup] Error:', e);
    sendSSE(controller, encoder, { content: "Something went wrong. Please try again." });
    return false;
  }
}

// Explain requirements in human-friendly terms
function explainRequirements(inputs) {
  const explanations = [];
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

// Handle auto_setup tool - creates everything automatically
// Handle auto_setup tool - creates everything automatically
export async function handleAutoSetup(args, user, controller, encoder, setupContext) {
  // Pass existing_config if provided by the AI
  let existingConfig = args.existing_config || {};

  console.log('[AUTO_SETUP] Called with args:', args);
  console.log('[AUTO_SETUP] Existing config from AI:', existingConfig);
  console.log('[AUTO_SETUP] Setup context available:', !!setupContext);

  // CRITICAL FIX: Check ALL conversation messages for file uploads
  // This ensures we never miss an upload, even in long conversations
  if (setupContext && setupContext.conversationHistory) {
    console.log('[AUTO_SETUP] Conversation history length:', setupContext.conversationHistory.length);
    const allMessages = setupContext.conversationHistory.join('\n');
    console.log('[AUTO_SETUP] Full conversation (first 1000 chars):', allMessages.substring(0, 1000));
    console.log('[AUTO_SETUP] Full conversation (last 1000 chars):', allMessages.substring(allMessages.length - 1000));

    // Look for ALL file upload markers in the entire conversation
    const fileUploadRegex = /\[(?:FILE UPLOAD COMPLETE|USER UPLOADED FILE|CRITICAL - FILE UPLOAD COMPLETE)\][\s\S]*?Field[:\s]+"?([A-Z_]+)"?[\s\S]*?(?:Path|Value)[:\s]+"([^"]+)"/gi;

    let match;
    let foundCount = 0;
    while ((match = fileUploadRegex.exec(allMessages)) !== null) {
      const fieldName = match[1];
      const filePath = match[2];
      foundCount++;
      console.log('[AUTO_SETUP] Found file upload #' + foundCount + ':', fieldName, '=', filePath);
      existingConfig[fieldName] = filePath;
    }

    if (foundCount === 0) {
      console.log('[AUTO_SETUP] WARNING: No file uploads found in conversation!');
      console.log('[AUTO_SETUP] Searching for alternative patterns...');

      // Try simpler pattern
      const simplePattern = /uploaded.*?["']([^"']+\.mp4)["']/gi;
      let simpleMatch;
      while ((simpleMatch = simplePattern.exec(allMessages)) !== null) {
        console.log('[AUTO_SETUP] Found video mention:', simpleMatch[1]);
      }
    }
  } else {
    console.log('[AUTO_SETUP] WARNING: No conversation history provided!');
  }

  console.log('[AUTO_SETUP] Final existingConfig:', existingConfig);

  return handleAutoSetupWithExisting(args, existingConfig, user, controller, encoder);
}

// Auto-setup with some fields already collected - exported for use by other handlers
export async function handleAutoSetupWithExisting(args, existingConfig, user, controller, encoder) {

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
        sendSSE(controller, encoder, { type: 'connect_request', provider: primaryProvider, automation_id: args.automation_id });
        return;
      }

      const accessToken = await getValidProviderToken(primaryProvider, integration, user.id, args.automation_id);
      if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
        const providerName = primaryProvider === 'google' ? 'Google' : primaryProvider.charAt(0).toUpperCase() + primaryProvider.slice(1);
        sendSSE(controller, encoder, {
          content: `\n\n⚠️ Your ${providerName} connection has expired. Please reconnect your account to continue.`
        });
        sendSSE(controller, encoder, { type: 'connect_request', provider: primaryProvider, automation_id: args.automation_id, reason: 'Connection expired' });
        return;
      }
    }

    sendSSE(controller, encoder, { content: `Setting up "${automation.name}"...\n\n` });

    // Parse required inputs
    const requiredInputs = parseRequiredInputs(automation.required_inputs);

    // Normalize existing config keys to uppercase for matching
    const config = {};
    Object.entries(existingConfig).forEach(([key, value]) => {
      config[key.toUpperCase()] = value;
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
          sendSSE(controller, encoder, { content: `✓ Using your email: ${profile.email}\n` });
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
    const missingFields = requiredInputs.filter(input => {
      const fieldName = (input.name || input).toUpperCase();
      return !config[fieldName];
    });

    if (missingFields.length > 0) {
      const missing = missingFields.map(f => (f.name || f).toLowerCase().replace(/_/g, ' ')).join(', ');
      sendSSE(controller, encoder, { content: `\nI still need: ${missing}. Could you provide these?` });

      // Send automation context AND already-collected config so AI can pass it to collect_text_input
      sendSSE(controller, encoder, {
        type: 'awaiting_input',
        automation_id: args.automation_id,
        automation_name: automation.name,
        missing_fields: missingFields.map(f => (f.name || f).toUpperCase()),
        collected_config: config  // Include already-collected fields (folder IDs, etc.)
      });
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

      // For file IDs, show the display name if we have it, otherwise just indicate it's set
      if (fieldName.includes('FOLDER') || fieldName.includes('SPREADSHEET') || fieldName.includes('DOCUMENT')) {
        summaryItems.push(`• ${friendlyName}: ✓ Ready`);
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

// Handle search_user_files tool
export async function handleSearchUserFiles(args, user, controller, encoder, setupContext = null) {

  try {
    // Get Google access token from user_automations (any automation with Google connected)
    const { data: integration } = await supabase
      .from('user_automations')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .not('access_token', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!integration) {
      sendSSE(controller, encoder, { content: "I need to connect to your Google account first to search your files." });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'To search your files' });
      return;
    }

    // Get valid access token (pass null for automation_id since we're using any available token)
    const accessToken = await getValidProviderToken('google', integration, user.id, null);
    if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
      sendSSE(controller, encoder, {
        content: "\n\n⚠️ Your Google connection has expired. Please reconnect your account to continue."
      });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'Connection expired' });
      return;
    }

    // Build and execute search
    const files = await searchGoogleDrive(accessToken, args.query, args.file_type);

    // Get automation context from args or setupContext
    const automationId = args.automation_id || setupContext?.automationId;
    const automationName = args.automation_name || setupContext?.automationName;
    let fieldName = args.field_name || setupContext?.currentField;

    // Normalize field name - if user is searching for a folder, map to FOLDER_ID type field
    if (!fieldName && args.file_type === 'folder') {
      fieldName = 'FOLDER_ID';
    } else if (!fieldName && args.file_type === 'spreadsheet') {
      fieldName = 'SPREADSHEET_ID';
    }

    if (files.length > 0) {
      // AUTO-SELECT: If exactly one match, use it immediately and continue setup
      if (files.length === 1) {
        const file = files[0];

        if (fieldName) {
          sendSSE(controller, encoder, {
            type: 'field_collected',
            field_name: fieldName,
            value: file.id,
            display_value: file.name
          });
        }

        sendSSE(controller, encoder, { content: `Found "${file.name}" - using it. ` });

        // Auto-complete the rest if we have automation context
        if (automationId) {
          const existingConfig = fieldName ? { [fieldName]: file.id } : {};
          await handleAutoSetupWithExisting(
            { automation_id: automationId, automation_name: automationName },
            existingConfig,
            user,
            controller,
            encoder
          );
        }
      } else {
        // Multiple matches - show list
        sendSSE(controller, encoder, {
          type: 'file_search_results',
          files,
          query: args.query,
          field_name: fieldName,
          automation_id: automationId,
          automation_name: automationName
        });

        const fileList = files.map((f, i) => `${i + 1}. "${f.name}"`).join('\n');
        sendSSE(controller, encoder, {
          content: `I found a few files matching "${args.query}":\n\n${fileList}\n\nWhich one? (say the number)`
        });
      }
    } else {
      // No matches - ask for clarification, DO NOT AUTO-CREATE
      if (automationId) {
        sendSSE(controller, encoder, {
          content: `I couldn't find any file or folder named "${args.query}" in your Drive.\n\nCould you double-check the name? Or I can list your recent files if you prefer.\n\n(Or say "create it" if you want me to make a new one)`
        });
      } else {
        sendSSE(controller, encoder, {
          content: `I couldn't find "${args.query}" in your Drive. Could you check the name?`
        });
      }
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "Error searching files. Please try again." });
  }
}

// Handle list_user_files tool - shows recent files when user doesn't know names
export async function handleListUserFiles(args, user, controller, encoder, setupContext = null) {
  try {
    // Get Google access token from user_automations (any automation with Google connected)
    const { data: integration } = await supabase
      .from('user_automations')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .not('access_token', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!integration) {
      sendSSE(controller, encoder, { content: "I need to connect to your Google account first." });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'To list your files' });
      return;
    }

    // Get valid access token (pass null for automation_id since we're using any available token)
    const accessToken = await getValidProviderToken('google', integration, user.id, null);
    if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
      sendSSE(controller, encoder, {
        content: "\n\n⚠️ Your Google connection has expired. Please reconnect your account to continue."
      });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'Connection expired' });
      return;
    }

    const files = await listRecentGoogleDriveFiles(accessToken, args.file_type);

    // Get automation context
    const automationId = args.automation_id || setupContext?.automationId;
    const automationName = args.automation_name || setupContext?.automationName;
    let fieldName = args.field_name || setupContext?.currentField;

    if (!fieldName && args.file_type === 'folder') fieldName = 'FOLDER_ID';
    else if (!fieldName && args.file_type === 'spreadsheet') fieldName = 'SPREADSHEET_ID';

    if (files.length > 0) {
      // Include automation context so selection can continue setup
      sendSSE(controller, encoder, {
        type: 'file_search_results',
        files,
        field_name: fieldName,
        automation_id: automationId,
        automation_name: automationName
      });
      const fileList = files.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
      sendSSE(controller, encoder, {
        content: `Here are your recent ${args.file_type === 'any' ? 'files' : args.file_type + 's'}:\n\n${fileList}\n\nWhich one would you like to use? Or I can create a new one for you.`
      });
    } else {
      sendSSE(controller, encoder, {
        content: `You don't have any ${args.file_type === 'any' ? 'files' : args.file_type + 's'} yet. Would you like me to create one?`
      });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "Error listing files. Please try again." });
  }
}



// Handle confirm_file_selection tool - use the file and auto-create the rest
export async function handleConfirmFileSelection(args, user, controller, encoder) {
  sendSSE(controller, encoder, {
    type: 'field_collected',
    field_name: args.field_name,
    value: args.file_id,
    display_value: args.file_name
  });

  sendSSE(controller, encoder, { content: `Using "${args.file_name}". ` });

  // If we have automation context, auto-complete the remaining fields
  if (args.automation_id) {
    sendSSE(controller, encoder, { content: `Setting up the rest automatically...` });
    // Trigger auto_setup with the collected field as a starting point
    await handleAutoSetupWithExisting(
      { automation_id: args.automation_id, automation_name: args.automation_name },
      { [args.field_name]: args.file_id },
      user,
      controller,
      encoder
    );
  }
}

// Handle collect_text_input tool - and auto-continue if all fields collected
export async function handleCollectTextInput(args, user, controller, encoder, setupContext = null) {
  // Check if this is actually a file field being misused
  const fieldLower = (args.field_name || '').toLowerCase();
  if (fieldLower.includes('folder') || fieldLower.includes('spreadsheet') || fieldLower.includes('sheet') || fieldLower.includes('document')) {
    // AI is trying to use text input for a file - this is wrong
    // The value is probably a file name, not an ID
    sendSSE(controller, encoder, {
      content: `I need to search for "${args.value || args.file_name}" in your Google Drive to get the correct file. Let me do that...`
    });
    // Don't save - AI should call search_user_files instead
    return;
  }

  sendSSE(controller, encoder, {
    type: 'field_collected',
    field_name: args.field_name,
    value: args.value
  });

  // Get automation context
  const automationId = args.automation_id || setupContext?.automationId;
  const automationName = args.automation_name || setupContext?.automationName;

  // If we have automation context, continue with auto-setup
  if (automationId && user) {
    sendSSE(controller, encoder, { content: `Got it! ` });

    // Merge existing config with the new field - this preserves already-created files!
    const existingConfig = args.existing_config || {};
    const mergedConfig = {
      ...existingConfig,
      [args.field_name.toUpperCase()]: args.value
    };

    // Pass ALL collected fields to auto-setup to continue
    await handleAutoSetupWithExisting(
      { automation_id: automationId, automation_name: automationName },
      mergedConfig,
      user,
      controller,
      encoder
    );
  } else {
    sendSSE(controller, encoder, { content: `Got it, saved ${args.field_name.replace(/_/g, ' ').toLowerCase()}: ${args.value}` });
  }
}

// Handle request_file_upload tool - triggers awaiting_input for file upload
export async function handleRequestFileUpload(args, user, controller, encoder) {
  console.log('[request_file_upload] Called with args:', args);

  const { file_type, field_name, automation_id, automation_name } = args;

  // Emit awaiting_input with the file field so frontend enables upload UI
  sendSSE(controller, encoder, {
    type: 'awaiting_input',
    automation_id: automation_id,
    automation_name: automation_name,
    missing_fields: [field_name], // e.g., ["VIDEO_FILES"]
    collected_config: {} // Will be populated as files are uploaded
  });

  // Also send a natural response
  let fileTypeLabel = file_type === 'video' ? 'video files' : file_type === 'image' ? 'images' : 'files';
  sendSSE(controller, encoder, {
    content: `📤 I'm ready to receive your ${fileTypeLabel}. You can drag & drop or click the upload button that just appeared!`
  });
}

// Handle execute_automation tool - WITH VALIDATION
export async function handleExecuteAutomation(args, user, controller, encoder) {

  try {
    // VALIDATION STEP 1: Check if config was provided
    if (!args.config || Object.keys(args.config).length === 0) {
      sendSSE(controller, encoder, {
        content: "⚠️ I can't run the automation yet - I don't have the configuration. Let's set it up first."
      });
      return;
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
        const provider = connector.includes('sheets') || connector.includes('drive') ? 'google' : connector;

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
          sendSSE(controller, encoder, { type: 'connect_request', provider: provider, automation_id: args.automation_id });
          return;
        }
      }
    }

    // ALL VALIDATIONS PASSED - Execute!

    sendSSE(controller, encoder, { content: "✓ All checks passed! Running the automation...\n\n" });

    const executeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automation_id: args.automation_id,
        config: normalizedConfig,
        user_id: user.id
      })
    });

    const result = await executeResponse.json();

    if (executeResponse.ok) {
      sendSSE(controller, encoder, {
        content: "✅ Success! Your automation ran successfully.\n\n" + (result.message || '')
      });
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
      sendSSE(controller, encoder, {
        content: `❌ Something went wrong: ${result.error || 'Unknown error'}. Would you like to try again?`
      });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "❌ Error running automation. Please try again." });
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
      console.error('[save_background_config] Error:', error);
      sendSSE(controller, encoder, { content: "❌ Failed to save background configuration. Please try again." });
      return;
    }

    sendSSE(controller, encoder, {
      content: "✓ Great! I've enabled background execution for this automation. It will now run automatically when changes are detected."
    });

  } catch (e) {
    console.error('[save_background_config] Exception:', e);
    sendSSE(controller, encoder, { content: "❌ Something went wrong saving background compliance." });
  }
}

// Helper functions
function parseConnectors(connectors) {
  if (!connectors) return [];
  if (typeof connectors === 'string') {
    try { return JSON.parse(connectors); }
    catch (e) { return connectors.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return Array.isArray(connectors) ? connectors : [];
}

function parseRequiredInputs(inputs) {
  if (!inputs) return [];
  if (Array.isArray(inputs) && inputs.length > 0 && typeof inputs[0] === 'string') {
    try { return inputs.map(input => JSON.parse(input)); } catch (e) { }
  }
  return inputs;
}

function generateFieldQuestion(field, automationName) {
  const fieldName = field.name || field;
  const friendlyName = fieldName.replace(/_/g, ' ').toLowerCase();

  let question = `Let's set up "${automationName}"! `;

  if (fieldName.toLowerCase().includes('spreadsheet') || fieldName.toLowerCase().includes('sheet')) {
    question += `Which Google Spreadsheet should I use? Just tell me the name and I'll find it for you.`;
  } else if (fieldName.toLowerCase().includes('folder')) {
    question += `Which Google Drive folder should I use? Tell me the name.`;
  } else if (fieldName.toLowerCase().includes('email')) {
    question += `What email address should I send notifications to?`;
  } else {
    question += `What's the ${friendlyName}?`;
  }

  return question;
}

async function getValidProviderToken(provider, integration, userId, automationId) {
  if (provider === 'tiktok') {
    try {
      const { getValidTikTokAccessToken } = await import('@/lib/auth/tiktok-oauth');
      return await getValidTikTokAccessToken(userId);
    } catch (error) {
      console.error('TikTok token error:', error);
      return null;
    }
  }

  // Default to Google logic
  const { access_token: accessToken, refresh_token: refreshToken, token_expiry: tokenExpiry } = integration;
  // Consider token expired if it's within 5 minutes of actual expiry to allow for refresh time
  const isExpired = !tokenExpiry || new Date(tokenExpiry) <= new Date(Date.now() + 5 * 60 * 1000);

  if (isExpired && refreshToken) {
    console.log('[TOKEN DEBUG] Token expired, refreshing via Google...');
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (refreshResponse.ok) {
      const tokens = await refreshResponse.json();
      console.log('[TOKEN DEBUG] Refresh successful');

      const { createClient } = await import('@/lib/db/supabase-server');
      const supabase = createClient();

      if (automationId) {
        await supabase.from('user_automations').update({
          access_token: tokens.access_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }).eq('user_id', userId).eq('automation_id', automationId).eq('provider', 'google');
      } else {
        // Update all Google automations for this user
        await supabase.from('user_automations').update({
          access_token: tokens.access_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }).eq('user_id', userId).eq('provider', 'google');
      }
      return tokens.access_token;
    } else {
      const errorData = await refreshResponse.text();
      console.log('[TOKEN DEBUG] Refresh FAILED:', {
        status: refreshResponse.status,
        error: errorData
      });

      if (errorData.includes('invalid_grant')) {
        const { createClient } = await import('@/lib/db/supabase-server');
        const supabase = createClient();
        if (automationId) {
          await supabase.from('user_automations')
            .update({ access_token: null, refresh_token: null, token_expiry: null })
            .eq('user_id', userId).eq('automation_id', automationId).eq('provider', 'google');
        } else {
          await supabase.from('user_automations')
            .update({ access_token: null, refresh_token: null, token_expiry: null })
            .eq('user_id', userId).eq('provider', 'google');
        }
        return 'NEEDS_RECONNECT';
      }
      return null;
    }
  }
  return accessToken;
}

async function searchGoogleDrive(accessToken, query, fileType) {
  let driveQuery = `name contains '${query}' and trashed = false`;
  if (fileType === 'spreadsheet') driveQuery += ` and mimeType = 'application/vnd.google-apps.spreadsheet'`;
  else if (fileType === 'document') driveQuery += ` and mimeType = 'application/vnd.google-apps.document'`;
  else if (fileType === 'folder') driveQuery += ` and mimeType = 'application/vnd.google-apps.folder'`;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&fields=files(id,name,mimeType,modifiedTime)&pageSize=5`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (response.ok) {
    const data = await response.json();
    return data.files || [];
  }
  return [];
}

async function listRecentGoogleDriveFiles(accessToken, fileType) {
  let driveQuery = 'trashed = false';
  if (fileType === 'spreadsheet') driveQuery += ` and mimeType = 'application/vnd.google-apps.spreadsheet'`;
  else if (fileType === 'document') driveQuery += ` and mimeType = 'application/vnd.google-apps.document'`;
  else if (fileType === 'folder') driveQuery += ` and mimeType = 'application/vnd.google-apps.folder'`;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc&pageSize=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (response.ok) {
    const data = await response.json();
    return data.files || [];
  }
  return [];
}

function getAutomationStoragePath(userId, automationId) {
  // Single folder: user_id_automation_id/
  return `${userId}_${automationId}/`;
}

// Handle schedule_automation tool
export async function handleScheduleAutomation(data, context, user, controller, encoder) {
  const { parseTimeExpression } = await import('./schedule-parser.js');

  console.log('[handleScheduleAutomation] Called with:', {
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
      console.log('[handleScheduleAutomation] Parsed schedule:', {
        type: schedule.type,
        humanReadable: schedule.humanReadable,
        nextRun: schedule.nextRun,
        cron: schedule.cron,
        delay: schedule.delay
      });
    } catch (parseError) {
      console.error('[handleScheduleAutomation] Parse error:', parseError);
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
        console.error('[handleScheduleAutomation] Failed to parse workflow:', e);
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
            automation_id: context.automationId
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
            reason: 'Connection expired'
          });
          return { type: 'error', message: 'Token expired' };
        }

        tokens[provider] = accessToken;
        tokenMapping[provider] = { access_token: accessToken };
      }
    }

    // Step 5: Build payload
    const payload = {
      workflow: workflow,  // The workflow template
      initialData: context.collectedFields || {},  // Config as initialData
      tokens: tokens,
      tokenMapping: tokenMapping
    };

    console.log('[handleScheduleAutomation] Built payload:', {
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

      console.log('[handleScheduleAutomation] Recurring schedule:', {
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

      console.log('[handleScheduleAutomation] One-time schedule:', {
        endpoint,
        delay: payload.delay,
        delayInMinutes: (payload.delay / 60000).toFixed(2),
        humanReadable: schedule.humanReadable
      });

      sendSSE(controller, encoder, {
        content: `Scheduling "${automation.name}" to run ${schedule.humanReadable.toLowerCase()}...`
      });
    }

    console.log('[handleScheduleAutomation] Full payload being sent:', JSON.stringify({
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

    console.log('[handleScheduleAutomation] Response from automation-runner:', {
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
    console.error('[handleScheduleAutomation] Error:', error);
    sendSSE(controller, encoder, {
      content: `Sorry, something went wrong while scheduling: ${error.message}`
    });
    return { type: 'error', message: error.message };
  }
}
