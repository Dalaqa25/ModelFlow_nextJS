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
    
    // Fetch user's automation instances
    let query = supabase
      .from('automation_instances')
      .select(`
        id,
        automation_id,
        config,
        enabled,
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
      query = query.eq('enabled', true);
    } else if (statusFilter === 'paused') {
      query = query.eq('enabled', false);
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
          enabled: instance.enabled,
          last_run: instance.last_run,
          created_at: instance.created_at,
          config: instance.config || {},
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
  try {
    let searchResults = [];

    // Try semantic search first, fall back to keyword search if embeddings fail
    try {
      const queryEmbedding = await generateEmbedding(args.query);
      const { data, error } = await supabase.rpc('search_automations', {
        query_embedding: queryEmbedding,
        match_limit: 5
      });
      if (!error && data) {
        const MINIMUM_SIMILARITY = 0.20;
        searchResults = data.filter(r => r.similarity >= MINIMUM_SIMILARITY).slice(0, 3);
      }
    } catch (embeddingError) {
      // Fallback: Keyword search - split query into words and search for each
      const keywords = args.query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      // Build OR conditions for each keyword
      const orConditions = keywords.map(kw =>
        `name.ilike.%${kw}%,description.ilike.%${kw}%`
      ).join(',');

      const { data, error } = await supabase
        .from('automations')
        .select('id, name, description, required_inputs, required_connectors, price_per_run')
        .eq('is_active', true)
        .or(orConditions)
        .limit(5);

      if (!error && data) {
        searchResults = data;
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
      sendSSE(controller, encoder, { content: "I couldn't find automations matching that. Could you describe what you want to automate differently?" });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "Sorry, I had trouble searching. Please try again." });
  }
}

// Handle start_setup tool - immediately offer auto-setup as the default
export async function handleStartSetup(args, user, controller, encoder) {

  try {
    let automation = null;
    let automationId = args.automation_id;

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

    // Check if Google connection needed
    let requiredConnectors = parseConnectors(automation.required_connectors);
    const needsGoogle = requiredConnectors.some(c =>
      c.toLowerCase().includes('google') || c.toLowerCase().includes('sheets')
    );

    if (needsGoogle) {
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();

      if (!integration) {
        sendSSE(controller, encoder, { content: `To set up "${automation.name}", I need to connect to your Google account first.` });
        sendSSE(controller, encoder, {
          type: 'connect_request',
          provider: 'google',
          reason: 'Required for this automation'
        });
        return true;
      }
    }

    // Send setup context
    const requiredInputs = parseRequiredInputs(automation.required_inputs);
    sendSSE(controller, encoder, {
      type: 'setup_started',
      automation_id: automationId,
      automation_name: automation.name,
      required_inputs: requiredInputs,
      collected_fields: {}
    });

    // NEW APPROACH: Offer to do everything automatically
    sendSSE(controller, encoder, {
      content: `I'll set up "${automation.name}" for you. I can create all the necessary files automatically in your Google Drive. Should I go ahead?`
    });

    return false;
  } catch (e) {
    sendSSE(controller, encoder, { content: "Something went wrong. Please try again." });
    return false;
  }
}

// Explain requirements in human-friendly terms
function explainRequirements(inputs) {
  const explanations = [];
  for (const input of inputs) {
    const name = (input.name || input).toUpperCase();
    if (name.includes('FOLDER')) {
      explanations.push('- A folder to store your files');
    } else if (name.includes('SPREADSHEET') || name.includes('SHEET')) {
      explanations.push('- A spreadsheet to track the data');
    } else if (name.includes('DOCUMENT') || name.includes('DOC')) {
      explanations.push('- A document for output');
    } else if (name.includes('EMAIL')) {
      explanations.push('- Your email address for notifications');
    } else {
      explanations.push(`- ${name.replace(/_/g, ' ').toLowerCase()}`);
    }
  }
  return explanations;
}

// Handle auto_setup tool - creates everything automatically
export async function handleAutoSetup(args, user, controller, encoder) {
  return handleAutoSetupWithExisting(args, {}, user, controller, encoder);
}

// Auto-setup with some fields already collected - exported for use by other handlers
export async function handleAutoSetupWithExisting(args, existingConfig, user, controller, encoder) {

  try {
    // Get automation details
    const { data: automation, error } = await supabase
      .from('automations')
      .select('id, required_inputs, required_connectors, name')
      .eq('id', args.automation_id)
      .single();

    if (error || !automation) {
      sendSSE(controller, encoder, { content: "I couldn't find that automation. Please try again." });
      return;
    }

    // Get Google access token
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!integration) {
      sendSSE(controller, encoder, { content: "I need to connect to your Google account first." });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google' });
      return;
    }

    const accessToken = await getValidAccessToken(integration, user.id);
    if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
      sendSSE(controller, encoder, {
        content: "\n\n⚠️ Your Google connection has expired. Please reconnect your account to continue."
      });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'Connection expired' });
      return;
    }

    sendSSE(controller, encoder, { content: `Setting up "${automation.name}"...\n\n` });

    // Parse required inputs
    const requiredInputs = parseRequiredInputs(automation.required_inputs);

    // Normalize existing config keys to uppercase for matching
    const config = {};
    Object.entries(existingConfig).forEach(([key, value]) => {
      config[key.toUpperCase()] = value;
    });

    let folderId = null;
    const automationFolderName = args.automation_name || automation.name;

    // Check if we already have a folder in config
    for (const input of requiredInputs) {
      const fieldName = (input.name || input).toUpperCase();
      if (fieldName.includes('FOLDER') && config[fieldName]) {
        folderId = config[fieldName];
        sendSSE(controller, encoder, { content: `✓ Using your existing folder\n` });
        break;
      }
    }

    // First pass: create folder if needed (and not already provided)
    for (const input of requiredInputs) {
      const fieldName = (input.name || input).toUpperCase();
      if (fieldName.includes('FOLDER') && !config[fieldName]) {
        const folder = await createGoogleDriveFile(accessToken, automationFolderName, 'folder');
        if (folder) {
          config[fieldName] = folder.id;
          folderId = folder.id;
          sendSSE(controller, encoder, { content: `✓ Created folder "${automationFolderName}"\n` });
          sendSSE(controller, encoder, { type: 'field_collected', field_name: fieldName, value: folder.id, display_value: folder.name });
        }
      }
    }

    // Second pass: create other files inside the folder (if not already provided)
    for (const input of requiredInputs) {
      const fieldName = (input.name || input).toUpperCase();

      if (config[fieldName]) {
        continue; // Skip if already have this field
      }

      if (fieldName.includes('SPREADSHEET') || fieldName.includes('SHEET')) {
        const sheetName = `${automationFolderName} Data`;
        const sheet = await createGoogleDriveFile(accessToken, sheetName, 'spreadsheet', folderId);
        if (sheet) {
          config[fieldName] = sheet.id;
          sendSSE(controller, encoder, { content: `✓ Created spreadsheet "${sheetName}"\n` });
          sendSSE(controller, encoder, { type: 'field_collected', field_name: fieldName, value: sheet.id, display_value: sheet.name });
        }
      } else if (fieldName.includes('DOCUMENT') || fieldName.includes('DOC')) {
        const docName = `${automationFolderName} Document`;
        const doc = await createGoogleDriveFile(accessToken, docName, 'document', folderId);
        if (doc) {
          config[fieldName] = doc.id;
          sendSSE(controller, encoder, { content: `✓ Created document "${docName}"\n` });
          sendSSE(controller, encoder, { type: 'field_collected', field_name: fieldName, value: doc.id, display_value: doc.name });
        }
      } else if (fieldName.includes('EMAIL')) {
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
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!integration) {
      sendSSE(controller, encoder, { content: "I need to connect to your Google account first to search your files." });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'To search your files' });
      return;
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(integration, user.id);
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
      // No matches - offer to create and continue
      if (automationId) {
        sendSSE(controller, encoder, {
          content: `I couldn't find "${args.query}" in your Drive. I'll create everything fresh for you instead.`
        });
        // Just auto-setup from scratch
        await handleAutoSetupWithExisting(
          { automation_id: automationId, automation_name: automationName },
          {},
          user,
          controller,
          encoder
        );
      } else {
        sendSSE(controller, encoder, {
          content: `I couldn't find "${args.query}" in your Drive. Want me to create it?`
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
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!integration) {
      sendSSE(controller, encoder, { content: "I need to connect to your Google account first." });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'To list your files' });
      return;
    }

    const accessToken = await getValidAccessToken(integration, user.id);
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

// Handle create_google_file tool - creates new files/folders in Google Drive
export async function handleCreateGoogleFile(args, user, controller, encoder) {
  try {
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!integration) {
      sendSSE(controller, encoder, { content: "I need to connect to your Google account first." });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'To create files' });
      return;
    }

    const accessToken = await getValidAccessToken(integration, user.id);
    if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
      sendSSE(controller, encoder, {
        content: "\n\n⚠️ Your Google connection has expired. Please reconnect your account to continue."
      });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', reason: 'Connection expired' });
      return;
    }

    const result = await createGoogleDriveFile(accessToken, args.name, args.file_type, args.parent_folder_id);

    if (result) {
      sendSSE(controller, encoder, {
        type: 'field_collected',
        field_name: args.field_name,
        value: result.id,
        display_value: result.name
      });
      const locationMsg = args.parent_folder_id ? ' inside your selected folder' : '';
      sendSSE(controller, encoder, {
        content: `I created a new ${args.file_type} called "${result.name}"${locationMsg} and saved it for the ${args.field_name.replace(/_/g, ' ').toLowerCase()} field.`
      });
    } else {
      sendSSE(controller, encoder, { content: "I couldn't create the file. Please try again." });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "Error creating file. Please try again." });
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

    // VALIDATION STEP 6: Check Google connection if needed
    const requiredConnectors = parseConnectors(automation.required_connectors);
    const needsGoogle = requiredConnectors.some(c =>
      c.toLowerCase().includes('google') || c.toLowerCase().includes('sheets')
    );

    if (needsGoogle) {
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('id, access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();

      if (!integration || !integration.access_token) {
        sendSSE(controller, encoder, {
          content: "⚠️ I need to connect to your Google account first before running this automation."
        });
        sendSSE(controller, encoder, { type: 'connect_request', provider: 'google' });
        return;
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
        content: "Done! Your automation is set up and ready to go. 🎉\n\n" + (result.message || '')
      });
      sendSSE(controller, encoder, { type: 'automation_complete', result });
    } else {
      sendSSE(controller, encoder, {
        content: `❌ Something went wrong: ${result.error || 'Unknown error'}. Would you like to try again?`
      });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "❌ Error running automation. Please try again." });
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

async function getValidAccessToken(integration, userId) {
  let accessToken = integration.access_token;

  console.log('[TOKEN DEBUG] Checking token expiry:', {
    expires_at: integration.expires_at,
    now: new Date().toISOString(),
    isExpired: new Date(integration.expires_at) < new Date()
  });

  if (new Date(integration.expires_at) < new Date()) {
    console.log('[TOKEN DEBUG] Token expired, attempting refresh...');

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (refreshResponse.ok) {
      const tokens = await refreshResponse.json();
      console.log('[TOKEN DEBUG] Refresh successful, got new access token');
      accessToken = tokens.access_token;
      await supabase.from('user_integrations').update({
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      }).eq('user_id', userId).eq('provider', 'google');
    } else {
      const errorData = await refreshResponse.text();
      console.log('[TOKEN DEBUG] Refresh FAILED:', {
        status: refreshResponse.status,
        error: errorData
      });

      // Check if it's an invalid_grant error (token revoked/expired)
      if (errorData.includes('invalid_grant')) {
        console.log('[TOKEN DEBUG] Token revoked/expired - deleting old integration so user can reconnect');
        // Delete the dead integration so user can reconnect cleanly
        await supabase.from('user_integrations')
          .delete()
          .eq('user_id', userId)
          .eq('provider', 'google');

        // Return special value to indicate reconnection needed
        return 'NEEDS_RECONNECT';
      }

      return null;
    }
  } else {
    console.log('[TOKEN DEBUG] Token still valid, using existing');
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

async function createGoogleDriveFile(accessToken, name, fileType, parentFolderId = null) {
  const mimeTypes = {
    spreadsheet: 'application/vnd.google-apps.spreadsheet',
    document: 'application/vnd.google-apps.document',
    folder: 'application/vnd.google-apps.folder'
  };

  const fileMetadata = {
    name: name,
    mimeType: mimeTypes[fileType]
  };

  // If parent folder specified, create inside it
  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fileMetadata)
  });

  if (response.ok) {
    return await response.json();
  }

  return null;
}
