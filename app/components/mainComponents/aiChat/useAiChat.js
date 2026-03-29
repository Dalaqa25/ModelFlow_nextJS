'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createStreamHandler } from './useStreamHandler';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import { compressFile } from '@/lib/utils/file-compressor';

export function useAiChat({ onLoadingChange, initialConversationId, onRequireAuth }) {
  const [messages, setMessages] = useState([]);
  const [conversationSummary, setConversationSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAiMessageId, setCurrentAiMessageId] = useState(null);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [automationContext, setAutomationContext] = useState(null);
  const [setupState, setSetupState] = useState(null);
  const [lastFileSearchResults, setLastFileSearchResults] = useState(null);

  // Conversation tracking
  const [currentConversationId, setCurrentConversationId] = useState(initialConversationId || null);
  const [userId, setUserId] = useState(null);
  const hasLoadedInitial = useRef(false);

  // Load existing conversation messages
  useEffect(() => {
    async function loadConversation() {
      if (!initialConversationId) return;
      if (hasLoadedInitial.current && currentConversationId === initialConversationId) return;

      // FIX: Set userId when loading existing conversations so AI responses get saved to DB
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      setCurrentConversationId(initialConversationId);
      hasLoadedInitial.current = true;
      setIsLoading(true);
      if (onLoadingChange) onLoadingChange(true);

      try {
        const res = await fetch(`/api/conversations/${initialConversationId}/messages`, {
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
            hiddenContext: msg.metadata?.hiddenContext || '' // Restore hidden context
          }));
          setMessages(formattedMessages);

          // Reset setup state since we are loading an old conversation
          setSetupState(null);
          setAutomationContext(null);
        }
      } catch (err) {
        console.error('Failed to load conversation messages:', err);
      } finally {
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    }

    loadConversation();
  }, [initialConversationId]);

  // Sync conversation title when an automation is selected/started
  useEffect(() => {
    if (currentConversationId && setupState?.automationName) {
      // Fire-and-forget update to the database
      fetch(`/api/conversations/${currentConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: setupState.automationName,
          relatedAutomationId: setupState.automationId || null
        })
      }).catch(err => console.error('Failed to sync conversation title:', err));
    }
  }, [currentConversationId, setupState?.automationName, setupState?.automationId]);


  const abortControllerRef = useRef(null);
  const readerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentAiMessageContentRef = useRef(''); // Track AI response content
  const currentAiMessageHiddenContextRef = useRef(''); // Track hidden context


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

    // Reset content tracker for new AI message
    currentAiMessageContentRef.current = '';
    currentAiMessageHiddenContextRef.current = '';

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
      setCurrentAiMessageId,
      // Pass callback to track AI content
      onContentUpdate: (content) => {
        currentAiMessageContentRef.current = content;
      },
      // Track hidden context
      onHiddenContextUpdate: (context) => {
        currentAiMessageHiddenContextRef.current += '\n' + context;
      }
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        handler.markStreamEnded();

        // Save AI response to DB when stream completes
        if (currentConversationId && userId && currentAiMessageContentRef.current) {
          try {
            await fetch('/api/conversations/' + currentConversationId + '/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                role: 'assistant',
                content: currentAiMessageContentRef.current,
                metadata: {
                  hiddenContext: currentAiMessageHiddenContextRef.current || undefined
                }
              })
            });
          } catch (error) {
            console.error('Failed to save AI message:', error);
          }
        }

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

    // Get or create conversation
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Only block if we need to persist (create conversation) — for unauthed users
    // we allow AI responses but skip DB persistence
    const isAuthed = !!user;

    // FIX: Always set userId when authenticated, not just when creating new conversations
    // Without this, AI responses in resumed conversations are never persisted to DB
    if (isAuthed) {
      setUserId(user.id);
    }

    // Create conversation if this is the first message (and user is signed in)
    let conversationId = currentConversationId;
    if (isAuthed && !conversationId) {
      try {
        const automationId = setupState?.automationId || selectedAutomation?.id || null;
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ relatedAutomationId: automationId })
        });

        if (response.ok) {
          const conversation = await response.json();
          conversationId = conversation.id;
          setCurrentConversationId(conversationId);
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
      }
    }

    // CRITICAL FIX: Save extraContext as hiddenContext so it persists in conversation history
    const userMessage = {
      role: 'user',
      content: messageText,
      hiddenContext: extraContext,
      timestamp: new Date().toISOString(),
    };

    // Update state with new message
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    // Save user message to DB only when authenticated
    if (isAuthed && conversationId) {
      try {
        await fetch('/api/conversations/' + conversationId + '/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            role: 'user',
            content: messageText,
            metadata: {
              hiddenContext: extraContext || undefined // Save hidden context in metadata
            }
          })
        });
      } catch (error) {
        console.error('Failed to save user message:', error);
      }
    }

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
      // FIX: Filter out hidden tool output messages before building history
      // These were polluting the message count and causing real messages to be truncated
      let conversationHistory = [...messages, userMessage]
        .filter(msg => msg.content?.trim() && !msg.isToolOutput && !msg.isHidden)
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
      // FIX: Increased from 15 to 30 — the old limit was far too aggressive
      // and caused the AI to lose context mid-conversation
      if (conversationHistory.length > 30) {
        conversationHistory = conversationSummary
          ? [{ role: 'system', content: `Previous conversation summary: ${conversationSummary}` }, ...conversationHistory.slice(-25)]
          : conversationHistory.slice(-25);
      }

      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: abortController.signal,
        body: JSON.stringify({ 
          messages: conversationHistory, 
          temperature: 0.7, 
          maxTokens: 2000,
          frontendSetupState: setupState
        }),
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

      // SAFETY NET: Detect when AI acknowledged a field value but forgot to call collect_text_input
      // This prevents the infinite "ask the same question" loop
      if (setupState?.missingFields?.length > 0 && messageText.trim()) {
        const userInput = messageText.trim();
        const missingFields = setupState.missingFields.map(f => (typeof f === 'string' ? f : f.name || f).toUpperCase());
        
        // Check if any missing field was NOT collected during this turn
        // by comparing current setupState with what we had before
        const stillMissing = missingFields.filter(fieldName => {
          // Check if this field is still not in collectedFields after the AI responded
          const currentCollected = setupState.collectedFields || {};
          return !currentCollected[fieldName];
        });

        if (stillMissing.length > 0) {
          // Heuristic: try to match user input to the first missing field
          const firstMissing = stillMissing[0];
          let shouldAutoCollect = false;

          // URL fields: user sends something starting with http
          if (firstMissing.includes('URL') && /^https?:\/\//i.test(userInput)) {
            shouldAutoCollect = true;
          }
          // Tone/option fields: user sends a short text that matches known options
          else if (firstMissing.includes('TONE') && userInput.length < 50) {
            shouldAutoCollect = true;
          }
          // Email fields
          else if (firstMissing.includes('EMAIL') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput)) {
            shouldAutoCollect = true;
          }
          // Interval/schedule fields
          else if ((firstMissing.includes('INTERVAL') || firstMissing.includes('SCHEDULE')) && userInput.length < 100) {
            shouldAutoCollect = true;
          }
          // Generic: if user sends a short, non-question answer (no '?' at end)
          else if (userInput.length < 200 && !userInput.endsWith('?') && !userInput.toLowerCase().startsWith('what') && !userInput.toLowerCase().startsWith('how') && !userInput.toLowerCase().startsWith('why')) {
            shouldAutoCollect = true;
          }

          if (shouldAutoCollect) {
            console.log(`[Safety Net] AI forgot to collect field ${firstMissing}. Auto-saving value: ${userInput.substring(0, 50)}`);
            setSetupState(prev => prev ? {
              ...prev,
              collectedFields: { ...prev.collectedFields, [firstMissing]: userInput },
              collectedConfig: { ...prev.collectedConfig, [firstMissing]: userInput }
            } : null);
          }
        }
      }
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

  const handleAutomationSelect = useCallback(async (automation) => {
    // Require auth before running any automation
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    setSelectedAutomation(automation);
    sendMessage(`I want to use "${automation.name}"`, `\n\n[Selected automation UUID: ${automation.id}]`);
  }, [sendMessage, onRequireAuth]);

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
    // Require auth before executing
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
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
  }, [sendMessage, onRequireAuth]);

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

    console.log('[UPLOAD] Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      fileType: file.type
    });

    try {
      // ── Step 1: Get signed upload URL from our API ──────────────
      setUploadState(prev => ({
        ...prev,
        progress: 5,
        statusText: 'Preparing upload...'
      }));

      console.log('[UPLOAD] Requesting signed upload URL...');

      const signRes = await fetch('/api/automations/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          automationId
        })
      });

      if (!signRes.ok) {
        const err = await signRes.json();
        throw new Error(err.error || 'Failed to prepare upload');
      }

      const { signedUrl, token, path: filePath, bucket: bucketName, publicUrl, contentType } = await signRes.json();

      console.log('[UPLOAD] Got signed URL, preparing file...');

      // ── Step 2: Compress file if needed ───────────────────────────
      let fileToUpload = file;

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 1) {
        console.log('[UPLOAD] File over 1MB, attempting compression...');
        setUploadState(prev => ({
          ...prev,
          progress: 10,
          statusText: 'Compressing file...'
        }));

        const result = await compressFile(file, {
          targetSizeMB: 15,
          minSizeToCompress: 1,
          maxImageDimension: 1920,
          imageQuality: 0.8,
          onProgress: (pct) => {
            const mappedPct = Math.round(10 + (pct / 100) * 30);
            setUploadState(prev => ({
              ...prev,
              progress: mappedPct,
              statusText: `Compressing file... ${pct}%`
            }));
          }
        });

        fileToUpload = result.file;

        if (result.compressed) {
          const origMB = (result.originalSize / (1024 * 1024)).toFixed(1);
          const compMB = (result.compressedSize / (1024 * 1024)).toFixed(1);
          console.log(`[UPLOAD] Compressed: ${origMB}MB → ${compMB}MB`);
        }
      }

      // ── Step 3: Upload file directly to Supabase via signed URL ──
      setUploadState(prev => ({
        ...prev,
        progress: 40,
        statusText: 'Uploading file...'
      }));

      const uploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track real upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // Map upload progress to 40-95% range
            const pct = Math.round(40 + (e.loaded / e.total) * 55);
            let statusText = 'Uploading file...';
            if (pct > 60 && pct < 80) statusText = 'Uploading...';
            else if (pct >= 80) statusText = 'Finalizing...';

            setUploadState(prev => ({
              ...prev,
              progress: pct,
              statusText
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed - network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));

        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', contentType || fileToUpload.type || 'video/mp4');
        xhr.send(fileToUpload);
      });

      console.log('[UPLOAD] Direct upload to Supabase succeeded');

      setUploadState(prev => ({
        ...prev,
        progress: 100,
        status: 'done',
        statusText: 'Upload complete!'
      }));

      // ── Step 3: Update setup state & notify AI ──────────────────
      const fileFieldName = setupState?.missingFields?.find(fieldName => {
        const upper = fieldName.toUpperCase();
        return upper.includes('FILE') || upper.includes('PATH') || upper.includes('VIDEO') || upper.includes('IMAGE');
      }) || 'VIDEO_FILES';

      setSetupState(prev => {
        if (!prev) return prev;
        const newCollectedConfig = {
          ...(prev.collectedConfig || {}),
          [fileFieldName]: filePath
        };
        const newCollectedFields = {
          ...(prev.collectedFields || {}),
          [fileFieldName]: filePath
        };
        const newMissingFields = (prev.missingFields || []).filter(f => f !== fileFieldName);

        return {
          ...prev,
          collectedConfig: newCollectedConfig,
          collectedFields: newCollectedFields,
          missingFields: newMissingFields
        };
      });

      const fileContext = `\n\n[USER UPLOADED FILE]
File: "${file.name}"
Path: "${filePath}" (stored in bucket "${bucketName}")
Size: ${file.size} bytes

[CRITICAL - FILE UPLOAD COMPLETE]
Field "${fileFieldName}" has been collected and saved.
Path: "${filePath}"

IMPORTANT: This file field is NOW COLLECTED. Do NOT ask for it again.
Check what OTHER fields are still needed (like interval, schedule time, etc.).
If all fields are collected, proceed with auto_setup tool.`;

      sendMessage(`I've uploaded the video "${file.name}"!`, fileContext);

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
