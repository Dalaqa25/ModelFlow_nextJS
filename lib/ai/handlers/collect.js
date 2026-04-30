// Collect input handler functions
import { sendSSE } from './shared.js';
import { log, logError } from './shared.js';
import { handleAutoSetupWithExisting } from './setup.js';

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

    // PRIORITY ORDER for existing config (most reliable source wins):
    // 1. setupContext.collectedConfig — maintained by frontend state (most reliable)
    // 2. args.existing_config — passed by AI (often incomplete/missing)
    // 3. conversation history scan — last resort fallback
    const existingConfig = {
      ...(args.existing_config || {}),          // AI-provided (least reliable, apply first)
      ...(setupContext?.collectedConfig || {}),  // Frontend state (most reliable, overrides AI)
    };
    
    // Fallback: scan conversation history for any field_collected events we might have missed
    if (setupContext && setupContext.conversationHistory) {
      const allMessages = setupContext.conversationHistory.join('\n');
      const fieldCollectedPattern = /"type":\s*"field_collected",\s*"field_name":\s*"([^"]+)",\s*"value":\s*"([^"]+)"/g;
      let match;
      while ((match = fieldCollectedPattern.exec(allMessages)) !== null) {
        const prevField = match[1].toUpperCase();
        const prevValue = match[2];
        if (!existingConfig[prevField]) {
          existingConfig[prevField] = prevValue;
          log(`[collect_text_input] Recovered field from history: ${prevField} = ${prevValue}`);
        }
      }
    }
    
    const mergedConfig = {
      ...existingConfig,
      [args.field_name.toUpperCase()]: args.value
    };
    
    // CRITICAL: Send existing_config to hiddenContext so the AI Remembers!
    sendSSE(controller, encoder, {
      type: 'hidden_context',
      context: `existing_config=${JSON.stringify(mergedConfig)}`
    });
    
    log('[collect_text_input] Merged config for auto-setup:', mergedConfig);
    log('[collect_text_input] args.existing_config was:', args.existing_config);
    log('[collect_text_input] setupContext.collectedConfig was:', setupContext?.collectedConfig);

    // Pass ALL collected fields to auto-setup to continue
    await handleAutoSetupWithExisting(
      { automation_id: automationId, automation_name: automationName, conversation_history: setupContext?.conversationHistory?.join('\n') || '' },
      mergedConfig,
      user,
      controller,
      encoder
    );
  } else {
    sendSSE(controller, encoder, { content: `Got it, saved ${args.field_name.replace(/_/g, ' ').toLowerCase()}: ${args.value}` });
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

// Handle request_file_upload tool - triggers awaiting_input for file upload
export async function handleRequestFileUpload(args, user, controller, encoder) {
  log('[request_file_upload] Called with args:', args);

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
