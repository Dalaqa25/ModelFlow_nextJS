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

// Handle start_setup tool - returns requirements info for AI to explain naturally
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
      // Let AI handle this naturally
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
          type: 'connect_request', 
          provider: 'google', 
          reason: 'Required for this automation' 
        });
        return true;
      }
    }

    // Parse required inputs
    let requiredInputs = parseRequiredInputs(automation.required_inputs);
    const requirements = explainRequirements(requiredInputs);
    
    // Send setup context
    sendSSE(controller, encoder, { 
      type: 'setup_started',
      automation_id: automationId,
      automation_name: automation.name,
      required_inputs: requiredInputs,
      collected_fields: {}
    });

    // Send a minimal prompt - AI will elaborate naturally
    const reqList = requirements.join(', ');
    sendSSE(controller, encoder, { 
      content: `This automation needs: ${reqList}. I can create everything automatically for you, or you can use your existing files. What would you prefer?`
    });

    return false;
  } catch (e) {
    console.error('[start_setup] Error:', e);
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
  console.log('[auto_setup] Called with args:', args);
  
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
    if (!accessToken) {
      sendSSE(controller, encoder, { content: "I had trouble accessing your Google account. Please try reconnecting." });
      return;
    }

    sendSSE(controller, encoder, { content: `Setting up "${automation.name}" for you...\n\n` });

    // Parse required inputs
    const requiredInputs = parseRequiredInputs(automation.required_inputs);
    const config = {};
    let folderId = null;
    const automationFolderName = args.automation_name || automation.name;

    // First pass: create folder if needed
    for (const input of requiredInputs) {
      const fieldName = (input.name || input).toUpperCase();
      if (fieldName.includes('FOLDER')) {
        const folder = await createGoogleDriveFile(accessToken, automationFolderName, 'folder');
        if (folder) {
          config[fieldName] = folder.id;
          folderId = folder.id;
          sendSSE(controller, encoder, { content: `Created folder "${automationFolderName}"\n` });
          sendSSE(controller, encoder, { type: 'field_collected', field_name: fieldName, value: folder.id, display_value: folder.name });
        }
      }
    }

    // Second pass: create other files inside the folder
    for (const input of requiredInputs) {
      const fieldName = (input.name || input).toUpperCase();
      
      if (fieldName.includes('SPREADSHEET') || fieldName.includes('SHEET')) {
        const sheetName = `${automationFolderName} Data`;
        const sheet = await createGoogleDriveFile(accessToken, sheetName, 'spreadsheet', folderId);
        if (sheet) {
          config[fieldName] = sheet.id;
          sendSSE(controller, encoder, { content: `Created spreadsheet "${sheetName}"\n` });
          sendSSE(controller, encoder, { type: 'field_collected', field_name: fieldName, value: sheet.id, display_value: sheet.name });
        }
      } else if (fieldName.includes('DOCUMENT') || fieldName.includes('DOC')) {
        const docName = `${automationFolderName} Document`;
        const doc = await createGoogleDriveFile(accessToken, docName, 'document', folderId);
        if (doc) {
          config[fieldName] = doc.id;
          sendSSE(controller, encoder, { content: `Created document "${docName}"\n` });
          sendSSE(controller, encoder, { type: 'field_collected', field_name: fieldName, value: doc.id, display_value: doc.name });
        }
      } else if (fieldName.includes('EMAIL')) {
        // Use user's email from their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();
        
        if (profile?.email) {
          config[fieldName] = profile.email;
          sendSSE(controller, encoder, { content: `Using your email: ${profile.email}\n` });
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
      const missing = missingFields.map(f => f.name || f).join(', ');
      sendSSE(controller, encoder, { content: `\nI still need: ${missing}. Could you provide these?` });
      return;
    }

    // All set - execute the automation
    sendSSE(controller, encoder, { content: `\nAll set! Running the automation now...\n\n` });

    const lowercaseConfig = {};
    Object.entries(config).forEach(([key, value]) => {
      lowercaseConfig[key.toLowerCase()] = value;
    });

    console.log('[auto_setup] Executing with config:', lowercaseConfig);

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
      sendSSE(controller, encoder, { content: "Done! Everything is set up and ready to go." });
      sendSSE(controller, encoder, { type: 'automation_complete', result });
    } else {
      sendSSE(controller, encoder, { content: `Something went wrong: ${result.error || 'Unknown error'}` });
    }
  } catch (e) {
    console.error('[auto_setup] Error:', e);
    sendSSE(controller, encoder, { content: "Error during setup. Please try again." });
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
      // If exactly one match and we have field_name, auto-select it
      if (files.length === 1 && args.field_name) {
        const file = files[0];
        sendSSE(controller, encoder, { 
          type: 'field_collected',
          field_name: args.field_name,
          value: file.id,
          display_value: file.name
        });
        sendSSE(controller, encoder, { content: `Found "${file.name}" and saved it.` });
      } else {
        sendSSE(controller, encoder, { type: 'file_search_results', files, query: args.query, field_name: args.field_name });
        const fileList = files.map((f, i) => `${i + 1}. "${f.name}"`).join('\n');
        sendSSE(controller, encoder, { 
          content: `I found these files:\n\n${fileList}\n\nWhich one would you like to use?`
        });
      }
    } else {
      sendSSE(controller, encoder, { 
        content: `I couldn't find "${args.query}". Would you like me to create it for you?`
      });
    }
  } catch (e) {
    console.error('[search_user_files] Error:', e);
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

// Handle confirm_file_selection tool
export function handleConfirmFileSelection(args, controller, encoder) {
  sendSSE(controller, encoder, { 
    type: 'field_collected',
    field_name: args.field_name,
    value: args.file_id,
    display_value: args.file_name
  });
  sendSSE(controller, encoder, { content: `Got it! I'll use "${args.file_name}". What's next on the list?` });
}

// Handle collect_text_input tool
export function handleCollectTextInput(args, controller, encoder) {
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
  sendSSE(controller, encoder, { content: `Got it, saved ${args.field_name.replace(/_/g, ' ').toLowerCase()}: ${args.value}` });
}

// Handle execute_automation tool
export async function handleExecuteAutomation(args, user, controller, encoder) {
  console.log('[execute_automation] Called with args:', JSON.stringify(args, null, 2));
  
  try {
    // Check if config was provided
    if (!args.config || Object.keys(args.config).length === 0) {
      console.log('[execute_automation] No config provided, asking AI to retry');
      sendSSE(controller, encoder, { 
        content: "I need to gather the configuration values first. Let me check what we've collected so far. Could you confirm you want to run the automation?" 
      });
      return;
    }

    const lowercaseConfig = {};
    Object.entries(args.config).forEach(([key, value]) => {
      lowercaseConfig[key.toLowerCase()] = value;
    });

    console.log('[execute_automation] Sending config:', JSON.stringify(lowercaseConfig, null, 2));

    sendSSE(controller, encoder, { content: "Starting the automation now...\n\n" });

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
        content: "Done! Automation completed successfully.\n\n" + (result.message || '')
      });
      sendSSE(controller, encoder, { type: 'automation_complete', result });
    } else {
      sendSSE(controller, encoder, { 
        content: `Something went wrong: ${result.error || 'Unknown error'}. Would you like to try again?`
      });
    }
  } catch (e) {
    console.error('[execute_automation] Error:', e);
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

async function createGoogleDriveFile(accessToken, name, fileType, parentFolderId = null) {
  const mimeTypes = {
    spreadsheet: 'application/vnd.google-apps.spreadsheet',
    document: 'application/vnd.google-apps.document',
    folder: 'application/vnd.google-apps.folder'
  };

  console.log('[createGoogleDriveFile] Creating:', { name, fileType, parentFolderId });

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
    const result = await response.json();
    console.log('[createGoogleDriveFile] Created successfully:', result);
    return result;
  }
  
  const error = await response.text();
  console.error('[createGoogleDriveFile] Failed:', response.status, error);
  return null;
}
