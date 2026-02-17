'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { createStreamHandler } from './useStreamHandler';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';

export function useAiChat({ onLoadingChange }) {
  const [messages, setMessages] = useState([]);
  const [conversationSummary, setConversationSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAiMessageId, setCurrentAiMessageId] = useState(null);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [automationContext, setAutomationContext] = useState(null);
  const [setupState, setSetupState] = useState(null);
  const [lastFileSearchResults, setLastFileSearchResults] = useState(null);

  const abortControllerRef = useRef(null);
  const readerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const buildContextInfo = useCallback(() => {
    let contextInfo = '';
    if (automationContext) {
      contextInfo += `\n\n[AVAILABLE AUTOMATIONS - Use these REAL descriptions when answering questions about them:\n${automationContext}]`;
    }
    if (setupState && setupState.automationId) {
      const requiredFields = setupState.requiredFields || [];
      const collectedFields = setupState.collectedFields || {};
      const remaining = requiredFields.filter(f => !collectedFields[f.name || f]);
      const collectedEntries = Object.entries(collectedFields);
      const collectedStr = collectedEntries.length > 0
        ? collectedEntries.map(([k, v]) => `${k}="${v}"`).join(', ')
        : 'none yet';
      const remainingStr = remaining.length > 0
        ? remaining.map(f => f.name || f).join(', ')
        : (setupState.missingFields?.length > 0 ? setupState.missingFields.join(', ') : 'NONE - all fields collected, ready to execute');

      // Include collected config as JSON for AI to pass to collect_text_input
      const collectedConfig = setupState.collectedConfig || {};
      const configJson = Object.keys(collectedConfig).length > 0
        ? JSON.stringify(collectedConfig)
        : '{}';

      contextInfo += `\n\n[ACTIVE SETUP: "${setupState.automationName}" (automation_id: ${setupState.automationId})
Collected: ${collectedStr}
Remaining: ${remainingStr}
existing_config: ${configJson}
IMPORTANT: When calling collect_text_input, you MUST include:
- automation_id="${setupState.automationId}"
- automation_name="${setupState.automationName}"
- existing_config=${configJson} (pass this EXACTLY to preserve already-created files!)]`;

      // If ready to execute, include that info
      if (setupState.isReadyToExecute && setupState.readyConfig) {
        // Use base64 encoding to avoid regex issues with JSON
        const configStr = Buffer.from(JSON.stringify(setupState.readyConfig)).toString('base64');
        contextInfo += `\n\n[READY_TO_EXECUTE automation_id="${setupState.automationId}" config_b64="${configStr}"]`;
      }
    }
    // Include last file search results so AI knows what files were found
    // CRITICAL: Include file IDs so AI can call confirm_file_selection
    if (lastFileSearchResults && lastFileSearchResults.files?.length > 0) {
      const fileList = lastFileSearchResults.files.map((f, i) =>
        `${i + 1}. "${f.name}" (file_id: ${f.id})`
      ).join(', ');
      const fieldInfo = lastFileSearchResults.field_name ? ` for field "${lastFileSearchResults.field_name}"` : '';
      const automationInfo = lastFileSearchResults.automation_id ? ` (automation_id: ${lastFileSearchResults.automation_id}, automation_name: "${lastFileSearchResults.automation_name}")` : '';
      contextInfo += `\n\n[IMPORTANT - Last file search results${fieldInfo}${automationInfo}: ${fileList}. If user says a number like "1" or "first one", call confirm_file_selection with the corresponding file_id, file_name, field_name, automation_id, and automation_name.]`;
    }
    return contextInfo;
  }, [automationContext, setupState, lastFileSearchResults]);

  const processStream = async (response, aiMessageId) => {
    const reader = response.body.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();

    const handler = createStreamHandler({
      aiMessageId,
      setMessages,
      setAutomationContext,
      setSetupState,
      setSelectedAutomation,
      setLastFileSearchResults,
      animationFrameRef,
      onLoadingChange,
      setIsLoading,
      setCurrentAiMessageId
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        handler.markStreamEnded();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            handler.markStreamEnded();
            handler.startTypewriterAnimation();
            break;
          }
          try {
            const parsed = JSON.parse(data);
            handler.handleParsedEvent(parsed);
          } catch (e) { }
        }
      }
    }
  };

  const sendMessage = useCallback(async (messageText, extraContext = '') => {
    if (!messageText.trim() || isLoading) return;

    // CRITICAL FIX: Save extraContext as hiddenContext so it persists in conversation history
    const userMessage = {
      role: 'user',
      content: messageText,
      hiddenContext: extraContext, // Save hidden context for future messages
      timestamp: new Date().toISOString(),
    };
    
    // Update state with new message
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    const aiMessageId = Date.now();
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      automations: null,
      connectRequest: null,
      configRequest: null,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiMessage]);
    setCurrentAiMessageId(aiMessageId);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // CRITICAL: Build conversation history from CURRENT messages + new message
      // This ensures the file upload context is included
      let conversationHistory = [...messages, userMessage]
        .filter(msg => msg.content?.trim())
        .map(msg => ({
          role: msg.role,
          // Append hidden context (like file uploads, READY_TO_RUN configs) if present
          content: msg.content + (msg.hiddenContext || '')
        }));

      const contextInfo = buildContextInfo();
      // The last message already has extraContext in hiddenContext, so don't add it again
      // Just add the buildContextInfo
      if (contextInfo) {
        conversationHistory[conversationHistory.length - 1].content += contextInfo;
      }

      // Summarize if needed
      if (conversationHistory.length >= 10 && conversationHistory.length % 10 === 0) {
        try {
          const summaryResponse = await fetch('/api/ai/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              messages: [
                { role: 'system', content: 'Summarize this conversation in 2-3 sentences.' },
                ...conversationHistory.slice(0, -5)
              ],
              temperature: 0.3,
            }),
          });
          if (summaryResponse.ok) {
            const reader = summaryResponse.body.getReader();
            const decoder = new TextDecoder();
            let summary = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.content) summary += parsed.content;
                  } catch (e) { }
                }
              }
            }
            setConversationSummary(summary);
          }
        } catch (e) { }
      }

      // Trim history
      if (conversationHistory.length > 15) {
        conversationHistory = conversationSummary
          ? [{ role: 'system', content: `Previous conversation summary: ${conversationSummary}` }, ...conversationHistory.slice(-15)]
          : conversationHistory.slice(-15);
      }

      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: abortController.signal,
        body: JSON.stringify({ messages: conversationHistory, temperature: 0.7, maxTokens: 2000 }),
      });

      if (!response.ok) {
        // Handle rate limit errors specially
        if (response.status === 429) {
          const errorData = await response.json();
          const retryMinutes = errorData.retryAfter ? Math.ceil(errorData.retryAfter / 60) : 'a few';
          throw new Error(`⏱️ Rate limit reached. Please wait ${retryMinutes} minutes and try again.`);
        }
        throw new Error(response.status === 401 ? 'Please sign in to use the AI chat feature.' : 'Failed to get response from AI.');
      }

      await processStream(response, aiMessageId);
    } catch (error) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (error.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(msg => msg.id === aiMessageId ? { ...msg, content: `❌ ${error.message}` } : msg)
        );
      }
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
      setCurrentAiMessageId(null);
    } finally {
      abortControllerRef.current = null;
      readerRef.current = null;
    }
  }, [messages, isLoading, onLoadingChange, buildContextInfo, conversationSummary]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    readerRef.current?.cancel();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsLoading(false);
    if (onLoadingChange) onLoadingChange(false);
    setCurrentAiMessageId(null);
  }, [onLoadingChange]);

  const handleAutomationSelect = useCallback((automation) => {
    setSelectedAutomation(automation);
    sendMessage(`I want to use "${automation.name}"`, `\n\n[Selected automation UUID: ${automation.id}]`);
  }, [sendMessage]);

  const handleConnectionComplete = useCallback((provider) => {
    // Build context with collected fields to preserve state after OAuth
    let contextStr = '';

    if (setupState) {
      const collectedConfig = setupState.collectedConfig || {};
      if (Object.keys(collectedConfig).length > 0) {
        contextStr += `\n\n[COLLECTED FIELDS (preserved after OAuth): ${JSON.stringify(collectedConfig)}]`;
        contextStr += `\n[IMPORTANT: These fields were already collected BEFORE OAuth. Do NOT ask for them again!]`;
      }
      if (setupState.automationId) {
        contextStr += `\n[automation_id: ${setupState.automationId}, automation_name: "${setupState.automationName}"]`;
      }
    } else if (selectedAutomation) {
      contextStr += `\n\n[Selected automation UUID: ${selectedAutomation.id}]`;
    }

    const message = setupState
      ? `I've connected my ${provider} account for "${setupState.automationName}". What's next?`
      : selectedAutomation
        ? `I've connected my ${provider} account for "${selectedAutomation.name}". What's next?`
        : `I've connected my ${provider} account. What's next?`;

    sendMessage(message, contextStr);
  }, [selectedAutomation, setupState, sendMessage]);

  const handleConfigSubmit = useCallback(async (configData, automationId) => {
    try {
      const response = await fetch('/api/automations/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automation_id: automationId, config: configData })
      });
      const result = await response.json();
      if (!response.ok) {
        sendMessage(`Failed to start automation: ${result.error || 'Unknown error'}`);
        return;
      }
      let successMessage = `Automation executed successfully!\n\n`;
      if (result.result) successMessage += `Results:\n${JSON.stringify(result.result, null, 2)}`;
      sendMessage(successMessage);
    } catch (error) {
      sendMessage(`Failed to start automation: ${error.message}`);
    }
  }, [sendMessage]);

  const handleBackgroundActivate = useCallback(async (automationId, config) => {
    // If automationId is null, user declined
    if (!automationId) {
      sendMessage("No problem! The automation will run manually when you trigger it.");
      return;
    }

    try {
      // Get auth session from Supabase
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        sendMessage("Please sign in to enable background mode.");
        return;
      }

      const response = await fetch(`/api/automations/${automationId}/activate-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({ config })
      });

      const result = await response.json();

      if (!response.ok) {
        sendMessage(`Failed to enable background mode: ${result.error || 'Unknown error'}`);
        return;
      }

      sendMessage(`✅ Background execution enabled! Your automation will now run automatically.`);
    } catch (error) {
      sendMessage(`Failed to enable background mode: ${error.message}`);
    }
  }, [sendMessage]);

  /* ------------------------------------------------------------------
   * File Upload Logic (Video Compression + Upload)
   * ------------------------------------------------------------------ */
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    status: '', // 'uploading', 'done', 'error'
    statusText: '', // Human-readable status
    fileName: ''
  });

  // Determine if we are waiting for a file upload
  const isAwaitingFileUpload = useMemo(() => {
    if (!setupState?.missingFields) return false;

    // Check if any missing field is a file type
    return setupState.missingFields.some(fieldName => {
      const fieldDef = setupState.requiredFields?.find(f => f.name === fieldName);
      // Check type 'file' or implicit file naming
      return fieldDef?.type === 'file' || fieldName.includes('FILE') || fieldName.includes('PATH') || fieldName.includes('IMAGE') || fieldName.includes('VIDEO');
    });
  }, [setupState]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    if (!isAwaitingFileUpload) {
      toast.error("I'm not ready for files yet. Waiting for AI to ask for a file.");
      return;
    }

    // 1. Get current automation context
    // We need an automation ID to know which bucket to use
    // Prioritize setupState (active setup) -> selectedAutomation (context)
    const automationId = setupState?.automationId || selectedAutomation?.id;

    if (!automationId) {
      sendMessage("Please select or start an automation first so I know where to upload this file.");
      return;
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      status: 'uploading',
      statusText: 'Preparing upload...',
      fileName: file.name
    });

    console.log('[UPLOAD DEBUG] Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      fileType: file.type
    });

    try {
      // 2. Upload to server (server will compress if needed)
      let fileToUpload = file;

      console.log('[UPLOAD DEBUG] Starting upload:', {
        size: fileToUpload.size,
        sizeMB: (fileToUpload.size / (1024 * 1024)).toFixed(2) + 'MB',
        type: fileToUpload.type || file.type
      });

      // Show initial upload progress
      setUploadState(prev => ({ 
        ...prev, 
        progress: 10, 
        status: 'uploading',
        statusText: 'Uploading file...'
      }));

      // 3. Upload to API
      const formData = new FormData();
      formData.append('file', fileToUpload, file.name);
      formData.append('automationId', automationId);

      console.log('[UPLOAD DEBUG] Sending request to /api/automations/upload...');

      // Simulate progress while waiting for server
      const progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (prev.progress < 95) {
            // Fast progress up to 90%, then slow down
            const increment = prev.progress < 90 ? 5 : 1;
            const newProgress = Math.min(prev.progress + increment, 95);
            let statusText = 'Uploading file...';
            
            if (newProgress > 30 && newProgress < 60) {
              statusText = 'Processing on server...';
            } else if (newProgress >= 60 && newProgress < 90) {
              statusText = 'Compressing video...';
            } else if (newProgress >= 90) {
              statusText = 'Finalizing...';
            }
            
            return { 
              ...prev, 
              progress: newProgress,
              statusText
            };
          }
          return prev;
        });
      }, 1000); // Update every second

      const uploadRes = await fetch('/api/automations/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      console.log('[UPLOAD DEBUG] Upload response:', {
        status: uploadRes.status,
        ok: uploadRes.ok
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        console.error('[UPLOAD DEBUG] Upload failed:', err);
        
        // If file is too large (413 status), notify AI to tell user
        if (uploadRes.status === 413) {
          const message = err.error || 'File is too large to upload';
          sendMessage(`The file upload failed: ${message}`);
          setUploadState({ isUploading: false, progress: 0, status: '', fileName: '' });
          return;
        }
        
        throw new Error(err.error || 'Upload failed');
      }

      const result = await uploadRes.json();
      console.log('[UPLOAD DEBUG] Upload successful:', result);

      setUploadState(prev => ({ 
        ...prev, 
        progress: 100, 
        status: 'done',
        statusText: 'Upload complete!'
      }));

      // 4. CRITICAL: Save file path to setupState so auto_setup knows it's ready
      // Determine which field this file is for (VIDEO_FILES, IMAGE_FILE, etc.)
      const fileFieldName = setupState?.missingFields?.find(fieldName => {
        const upper = fieldName.toUpperCase();
        return upper.includes('FILE') || upper.includes('PATH') || upper.includes('VIDEO') || upper.includes('IMAGE');
      }) || 'VIDEO_FILES';

      // Update setupState with the collected file
      setSetupState(prev => {
        if (!prev) return prev;
        const newCollectedConfig = {
          ...(prev.collectedConfig || {}),
          [fileFieldName]: result.file.path
        };
        const newCollectedFields = {
          ...(prev.collectedFields || {}),
          [fileFieldName]: result.file.path
        };
        // Remove from missingFields
        const newMissingFields = (prev.missingFields || []).filter(f => f !== fileFieldName);

        return {
          ...prev,
          collectedConfig: newCollectedConfig,
          collectedFields: newCollectedFields,
          missingFields: newMissingFields
        };
      });

      // 5. Notify AI about the file with the path saved
      const fileContext = `\n\n[USER UPLOADED FILE]
File: "${result.file.name}"
Path: "${result.file.path}" (stored in bucket "${result.file.bucket}")
Size: ${result.file.size} bytes

[CRITICAL - FILE UPLOAD COMPLETE]
Field "${fileFieldName}" has been collected and saved.
Path: "${result.file.path}"

IMPORTANT: This file field is NOW COLLECTED. Do NOT ask for it again.
Check what OTHER fields are still needed (like interval, schedule time, etc.).
If all fields are collected, proceed with auto_setup tool.`;

      sendMessage(`I've uploaded the video "${file.name}"!`, fileContext);

      // Reset state after delay
      setTimeout(() => {
        setUploadState({ isUploading: false, progress: 0, status: '', fileName: '' });
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState(prev => ({ ...prev, status: 'error' }));
      sendMessage(`Failed to upload file: ${error.message}`);

      setTimeout(() => {
        setUploadState({ isUploading: false, progress: 0, status: '', fileName: '' });
      }, 3000);
    }
  }, [setupState, selectedAutomation, sendMessage]);

  return {
    messages,
    isLoading,
    currentAiMessageId,
    sendMessage,
    stopGeneration,
    handleAutomationSelect,
    handleConnectionComplete,
    handleConfigSubmit,
    handleBackgroundActivate,
    handleFileUpload,
    handleFileUpload,
    uploadState,
    isAwaitingFileUpload
  };
}
