// File handler functions
import { supabase, sendSSE, getValidProviderToken } from './shared.js';
import { log, logError } from './shared.js';
import { handleAutoSetupWithExisting } from './setup.js';

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
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', user_id: user.id, reason: 'To search your files' });
      return;
    }

    // Get valid access token (pass null for automation_id since we're using any available token)
    const accessToken = await getValidProviderToken('google', integration, user.id, null);
    if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
      sendSSE(controller, encoder, {
        content: "\n\n⚠️ Your Google connection has expired. Please reconnect your account to continue."
      });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', user_id: user.id, reason: 'Connection expired' });
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
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', user_id: user.id, reason: 'To list your files' });
      return;
    }

    // Get valid access token (pass null for automation_id since we're using any available token)
    const accessToken = await getValidProviderToken('google', integration, user.id, null);
    if (!accessToken || accessToken === 'NEEDS_RECONNECT') {
      sendSSE(controller, encoder, {
        content: "\n\n⚠️ Your Google connection has expired. Please reconnect your account to continue."
      });
      sendSSE(controller, encoder, { type: 'connect_request', provider: 'google', user_id: user.id, reason: 'Connection expired' });
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

// Handle list_automation_files tool - List user's uploaded files
export async function handleListAutomationFiles(args, user, controller, encoder, setupContext) {
  log('[list_automation_files] Called with args:', args);
  log('[list_automation_files] setupContext received:', setupContext ? 'YES' : 'NO');

  const { automation_id } = args;

  try {
    // Get automation to find bucket from system_config
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, system_config')
      .eq('id', automation_id)
      .single();

    if (automationError || !automation) {
      sendSSE(controller, encoder, {
        content: "❌ Couldn't find that automation."
      });
      return;
    }

    // Find bucket from system_config
    const systemConfig = automation.system_config || [];
    let bucketName = null;

    for (const config of systemConfig) {
      const fieldName = (config.name || '').toUpperCase();
      if ((fieldName.includes('STORAGE_PATH') || fieldName.includes('STORAGE_FOLDER')) && config.bucket) {
        bucketName = config.bucket;
        break;
      }
    }

    if (!bucketName) {
      sendSSE(controller, encoder, {
        content: "This automation doesn't have file storage configured."
      });
      return;
    }

    // Build user's folder path
    const folderPath = `${user.id}_${automation_id}/`;

    log('[list_automation_files] Listing files:', {
      user_id: user.id,
      automation_id,
      bucket: bucketName,
      folder: folderPath
    });

    // List files from Supabase Storage
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      logError('[list_automation_files] Error:', listError);
      sendSSE(controller, encoder, {
        content: `❌ Couldn't list files: ${listError.message}`
      });
      return;
    }

    if (!files || files.length === 0) {
      sendSSE(controller, encoder, {
        content: "You don't have any files uploaded for this automation yet."
      });
      return;
    }

    // Calculate total size
    let totalSize = 0;
    const formattedFiles = files.map(file => {
      const size = file.metadata?.size || 0;
      totalSize += size;
      return {
        name: file.name,
        size: size,
        created_at: file.created_at
      };
    });

    // Format file list
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'today';
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    };

    let message = `You have ${formattedFiles.length} file${formattedFiles.length > 1 ? 's' : ''} uploaded (${formatBytes(totalSize)} total):\n\n`;
    
    formattedFiles.forEach((file, index) => {
      message += `${index + 1}. ${file.name} (${formatBytes(file.size)}) - uploaded ${formatDate(file.created_at)}\n`;
    });

    message += `\nWould you like to preview any of these, delete some, or upload more?`;

    sendSSE(controller, encoder, { content: message });

    // CRITICAL: Send file paths as hidden context so AI can use them in auto_setup
    // Build the full storage path for each file
    const filePaths = formattedFiles.map(f => `${folderPath}${f.name}`);
    
    sendSSE(controller, encoder, {
      type: 'hidden_context',
      context: `[EXISTING_FILES automation_id="${automation_id}" VIDEO_FILES="${filePaths[0]}"]`
    });
    
    // ALSO: Update setup context so auto_setup can access files immediately in the same turn
    if (setupContext) {
      setupContext.existingFiles = {
        VIDEO_FILES: filePaths[0],
        STORAGE_PATH: folderPath
      };
      log('[list_automation_files] Updated setupContext with existing files:', setupContext.existingFiles);
    }

  } catch (error) {
    logError('[list_automation_files] Error:', error);
    sendSSE(controller, encoder, {
      content: `❌ Failed to list files: ${error.message}`
    });
  }
}

// Handle delete_automation_file tool - Delete a specific file
export async function handleDeleteAutomationFile(args, user, controller, encoder) {
  log('[delete_automation_file] Called with args:', args);

  const { automation_id, file_name } = args;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/${automation_id}/files/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${user.access_token}; sb-refresh-token=${user.refresh_token}`
      },
      body: JSON.stringify({ file_name })
    });

    const result = await response.json();

    if (!response.ok) {
      sendSSE(controller, encoder, {
        content: `❌ Couldn't delete file: ${result.error || 'Unknown error'}`
      });
      return;
    }

    sendSSE(controller, encoder, {
      content: `✅ Deleted ${file_name} successfully!`
    });

  } catch (error) {
    logError('[delete_automation_file] Error:', error);
    sendSSE(controller, encoder, {
      content: `❌ Failed to delete file: ${error.message}`
    });
  }
}

// Handle preview_automation_file tool - Get preview URL
export async function handlePreviewAutomationFile(args, user, controller, encoder) {
  log('[preview_automation_file] Called with args:', args);

  const { automation_id, file_name } = args;

  try {
    // Get automation to find bucket
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, system_config')
      .eq('id', automation_id)
      .single();

    if (automationError || !automation) {
      sendSSE(controller, encoder, {
        content: "❌ Couldn't find that automation."
      });
      return;
    }

    // Find bucket from system_config
    const systemConfig = automation.system_config || [];
    let bucketName = null;

    for (const config of systemConfig) {
      const fieldName = (config.name || '').toUpperCase();
      if ((fieldName.includes('STORAGE_PATH') || fieldName.includes('STORAGE_FOLDER')) && config.bucket) {
        bucketName = config.bucket;
        break;
      }
    }

    if (!bucketName) {
      sendSSE(controller, encoder, {
        content: "This automation doesn't have file storage configured."
      });
      return;
    }

    // Build file path
    const filePath = `${user.id}_${automation_id}/${file_name}`;

    log('[preview_automation_file] Generating signed URL:', {
      user_id: user.id,
      automation_id,
      bucket: bucketName,
      file_path: filePath
    });

    // Generate signed URL (expires in 1 hour)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 3600 seconds = 1 hour

    if (signError) {
      logError('[preview_automation_file] Error:', signError);
      sendSSE(controller, encoder, {
        content: `❌ Couldn't generate preview: ${signError.message}`
      });
      return;
    }

    // Send video preview as a special UI component instead of ugly URL
    sendSSE(controller, encoder, {
      type: 'video_preview',
      file_name: file_name,
      preview_url: signedUrl.signedUrl,
      expires_in: 3600 // 1 hour
    });

    sendSSE(controller, encoder, {
      content: `🎬 Here's your video preview!`
    });

  } catch (error) {
    logError('[preview_automation_file] Error:', error);
    sendSSE(controller, encoder, {
      content: `❌ Failed to generate preview: ${error.message}`
    });
  }
}
