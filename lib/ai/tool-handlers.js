// Tool handler functions for AI chat
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/ai/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to send SSE data
const sendSSE = (controller, encoder, data) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
};

// Handle search_automations tool
export async function handleSearchAutomations(args, controller, encoder) {
  try {
    const queryEmbedding = await generateEmbedding(args.query);
    const { data: searchResults, error } = await supabase.rpc('search_automations', {
      query_embedding: queryEmbedding,
      match_limit: 5
    });

    const MINIMUM_SIMILARITY = 0.20;
    const filteredResults = searchResults?.filter(r => r.similarity >= MINIMUM_SIMILARITY).slice(0, 3) || [];

    const normalizedResults = filteredResults.map(r => {
      let parsedInputs = r.required_inputs;
      if (Array.isArray(r.required_inputs) && r.required_inputs.length > 0 && typeof r.required_inputs[0] === 'string') {
        try { parsedInputs = r.required_inputs.map(input => JSON.parse(input)); } catch (e) { }
      }
      return { ...r, required_inputs: parsedInputs };
    });

    if (normalizedResults.length > 0) {
      // Send intro text
      sendSSE(controller, encoder, { content: "I have some automations that might help!\n\n" });
      
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
      
      sendSSE(controller, encoder, { content: "\nJust tell me which one you'd like to use!" });
      
      // Send automation context for AI to reference later
      const contextStr = normalizedResults.map(a => `- "${a.name}" (UUID: ${a.id})`).join('\n');
      sendSSE(controller, encoder, { type: 'automation_context', context: contextStr });
    } else {
      sendSSE(controller, encoder, { content: "I couldn't find automations matching that. Could you describe what you want to automate differently?" });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "Sorry, I had trouble searching. Please try again." });
  }
}

// Handle start_setup tool
export async function handleStartSetup(args, user, controller, encoder) {
  console.log('[start_setup] Called with args:', args);
  
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
        console.log('[start_setup] Found by UUID:', automation.name);
      }
    }
    
    // Fallback: search by name if UUID didn't work
    if (!automation && args.automation_name) {
      console.log('[start_setup] UUID lookup failed, trying name search:', args.automation_name);
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
        console.log('[start_setup] Found by name:', automation.name, 'ID:', automationId);
      }
    }
    
    if (!automation) {
      console.log('[start_setup] Automation not found');
      sendSSE(controller, encoder, { content: "I couldn't find that automation. Could you select it from the list above or tell me the exact name?" });
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
        sendSSE(controller, encoder, { 
          content: `Great choice! Before we set up "${automation.name}", I need to connect to your Google account to access your Drive and Sheets.\n\n`
        });
        sendSSE(controller, encoder, { 
          type: 'connect_request', 
          provider: 'google', 
          reason: 'Required for this automation' 
        });
        return true; // Signal to close stream
      }
    }

    // Parse required inputs
    let requiredInputs = parseRequiredInputs(automation.required_inputs);
    
    // Check which fields are already collected (passed from AI)
    const collectedFields = args.collected_fields || {};
    const remainingInputs = requiredInputs.filter(input => {
      const fieldName = input.name || input;
      return !collectedFields[fieldName];
    });

    // Send setup context with remaining fields
    sendSSE(controller, encoder, { 
      type: 'setup_started',
      automation_id: automationId,
      automation_name: automation.name,
      required_inputs: remainingInputs,
      collected_fields: collectedFields
    });

    // Ask for next uncollected field
    if (remainingInputs.length > 0) {
      const question = generateFieldQuestion(remainingInputs[0], automation.name);
      sendSSE(controller, encoder, { content: question });
    } else {
      // All fields collected - ready to run
      sendSSE(controller, encoder, { 
        content: `All set! I have everything needed for "${automation.name}". Would you like me to run it now?`
      });
    }
    
    return false;
  } catch (e) {
    sendSSE(controller, encoder, { content: "Something went wrong starting setup. Please try again." });
    return false;
  }
}

// Handle search_user_files tool
export async function handleSearchUserFiles(args, user, controller, encoder) {
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
    if (!accessToken) {
      sendSSE(controller, encoder, { content: "I had trouble accessing your Google account. Please try reconnecting." });
      return;
    }

    // Build and execute search
    const files = await searchGoogleDrive(accessToken, args.query, args.file_type);

    if (files.length > 0) {
      sendSSE(controller, encoder, { type: 'file_search_results', files, query: args.query });
      const fileList = files.map((f, i) => `${i + 1}. "${f.name}"`).join('\n');
      sendSSE(controller, encoder, { 
        content: `I found these files:\n\n${fileList}\n\nWhich one would you like to use? Just say the number or name.`
      });
    } else {
      sendSSE(controller, encoder, { 
        content: `I couldn't find any files matching "${args.query}". Could you try a different name, or would you like me to show your recent files?`
      });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "Error searching files. Please try again." });
  }
}

// Handle list_user_files tool - shows recent files when user doesn't know names
export async function handleListUserFiles(args, user, controller, encoder) {
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
    if (!accessToken) {
      sendSSE(controller, encoder, { content: "I had trouble accessing your Google account. Please try reconnecting." });
      return;
    }

    const files = await listRecentGoogleDriveFiles(accessToken, args.file_type);

    if (files.length > 0) {
      sendSSE(controller, encoder, { type: 'file_search_results', files });
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
    if (!accessToken) {
      sendSSE(controller, encoder, { content: "I had trouble accessing your Google account. Please try reconnecting." });
      return;
    }

    const result = await createGoogleDriveFile(accessToken, args.name, args.file_type);
    
    if (result) {
      sendSSE(controller, encoder, { 
        type: 'field_collected',
        field_name: args.field_name,
        value: result.id,
        display_value: result.name
      });
      sendSSE(controller, encoder, { 
        content: `I created a new ${args.file_type} called "${result.name}" and saved it for the ${args.field_name.replace(/_/g, ' ').toLowerCase()} field.`
      });
    } else {
      sendSSE(controller, encoder, { content: "I couldn't create the file. Please try again." });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "Error creating file. Please try again." });
  }
}

// Handle confirm_file_selection tool
export function handleConfirmFileSelection(args, controller, encoder) {
  sendSSE(controller, encoder, { 
    type: 'field_collected',
    field_name: args.field_name,
    value: args.file_id,
    display_value: args.file_name
  });
  sendSSE(controller, encoder, { content: `Got it! I'll use "${args.file_name}". ` });
}

// Handle collect_text_input tool
export function handleCollectTextInput(args, controller, encoder) {
  sendSSE(controller, encoder, { 
    type: 'field_collected',
    field_name: args.field_name,
    value: args.value
  });
}

// Handle execute_automation tool
export async function handleExecuteAutomation(args, user, controller, encoder) {
  try {
    const lowercaseConfig = {};
    Object.entries(args.config).forEach(([key, value]) => {
      lowercaseConfig[key.toLowerCase()] = value;
    });

    sendSSE(controller, encoder, { content: "Starting the automation now... ⏳\n\n" });

    const executeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automation_id: args.automation_id,
        config: lowercaseConfig,
        user_id: user.id
      })
    });

    const result = await executeResponse.json();

    if (executeResponse.ok) {
      sendSSE(controller, encoder, { 
        content: "✅ Automation completed successfully!\n\n" + (result.message || '')
      });
      sendSSE(controller, encoder, { type: 'automation_complete', result });
    } else {
      sendSSE(controller, encoder, { 
        content: `❌ Something went wrong: ${result.error || 'Unknown error'}. Would you like to try again?`
      });
    }
  } catch (e) {
    sendSSE(controller, encoder, { content: "Error running automation. Please try again." });
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
  
  if (new Date(integration.expires_at) < new Date()) {
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
      accessToken = tokens.access_token;
      await supabase.from('user_integrations').update({
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      }).eq('user_id', userId).eq('provider', 'google');
    } else {
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

async function createGoogleDriveFile(accessToken, name, fileType) {
  const mimeTypes = {
    spreadsheet: 'application/vnd.google-apps.spreadsheet',
    document: 'application/vnd.google-apps.document',
    folder: 'application/vnd.google-apps.folder'
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      mimeType: mimeTypes[fileType]
    })
  });

  if (response.ok) {
    return await response.json();
  }
  return null;
}
