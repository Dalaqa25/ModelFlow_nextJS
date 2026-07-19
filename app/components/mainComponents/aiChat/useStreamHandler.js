// Stream response handler - processes SSE events from AI
export function createStreamHandler({
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
  onContentUpdate, // Callback to track full content
  onHiddenContextUpdate, // NEW: Callback to track hidden context
  onUiMetadataUpdate
}) {
  let textQueue = '';
  let displayedText = '';
  let isAnimating = false;
  let streamEnded = false;
  const CHARS_PER_SECOND = 120;

  const flushQueue = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      isAnimating = false;
    }
    if (textQueue) {
      displayedText += textQueue;
      textQueue = '';
      // Notify parent of content update
      if (onContentUpdate) onContentUpdate(displayedText);
    }
  };

  const startTypewriterAnimation = () => {
    if (isAnimating) return;
    isAnimating = true;
    let lastFrameTime = performance.now();

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastFrameTime;
      const charsToAdd = Math.floor((deltaTime / 1000) * CHARS_PER_SECOND);

      if (charsToAdd > 0 && textQueue.length > 0) {
        const newChars = textQueue.slice(0, charsToAdd);
        textQueue = textQueue.slice(charsToAdd);
        displayedText += newChars;

        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: displayedText } : msg
          )
        );
        
        // Notify parent of content update
        if (onContentUpdate) onContentUpdate(displayedText);
        
        lastFrameTime = currentTime;
      }

      if (textQueue.length > 0 || !streamEnded) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        isAnimating = false;
        animationFrameRef.current = null;
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        setCurrentAiMessageId(null);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleParsedEvent = (parsed) => {
    // Thinking is explicit per message so the indicator is not coupled to unrelated
    // page loading state. The server ends it immediately before real content/UI arrives.
    if (parsed.type === 'thinking') {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, isThinking: parsed.status === 'start' }
            : msg
        )
      );
    }
    // Handle automation results (legacy cards)
    else if (parsed.type === 'automations' && parsed.automations) {
      setAutomationContext(null);
      flushQueue();
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, automations: parsed.automations }
            : msg
        )
      );
    }
    // Handle styled automation list
    else if (parsed.type === 'automation_list' && parsed.automations) {
      setAutomationContext(null);
      flushQueue();
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, automationList: parsed.automations }
            : msg
        )
      );
    }
    // Handle insufficient tokens
    else if (parsed.type === 'insufficient_tokens') {
      flushQueue();
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, insufficientTokens: { required: parsed.required, available: parsed.available, shortfall: parsed.shortfall } }
            : msg
        )
      );
    }
    // Handle connection requests
    else if (parsed.type === 'connect_request') {
      flushQueue();
      const connectRequest = { provider: parsed.provider, automation_id: parsed.automation_id, user_id: parsed.user_id, reason: parsed.reason };
      onUiMetadataUpdate?.({ connectRequest });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, connectRequest }
            : msg
        )
      );
    }
    else if (parsed.type === 'activepieces_connect_request') {
      flushQueue();
      const connectRequest = {
        provider: parsed.provider,
        automation_id: parsed.automation_id,
        automation_name: parsed.automation_name,
        reason: parsed.reason,
        engine: 'activepieces',
        activepiecesUrl: parsed.activepieces_url,
        activepiecesProjectId: parsed.activepieces_project_id,
        activepiecesFlowId: parsed.activepieces_flow_id,
        activepiecesConnections: parsed.activepieces_connections || [],
      };
      onUiMetadataUpdate?.({ connectRequest });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: displayedText,
                connectRequest
              }
            : msg
        )
      );
    }
    // Handle config requests
    else if (parsed.type === 'config_request' || parsed.type === 'customization_request') {
      flushQueue();
      const configRequest = {
        automation_id: parsed.automation_id,
        automation_name: parsed.automation_name,
        required_inputs: parsed.required_inputs || [],
        optional_inputs: parsed.optional_inputs || [],
        collected_config: parsed.collected_config || {},
      };
      onUiMetadataUpdate?.({ configRequest });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, configRequest }
            : msg
        )
      );
    }
    // Handle automation context
    else if (parsed.type === 'automation_context' && parsed.context) {
      setAutomationContext(parsed.context);
    }
    // Handle searching indicator
    else if (parsed.type === 'searching') {
      if (parsed.status === 'start') {
        // Add a temporary searching message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, isSearching: true }
              : msg
          )
        );
      } else if (parsed.status === 'end') {
        // Remove searching indicator
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, isSearching: false }
              : msg
          )
        );
      }
    }
    // Handle no results popup trigger
    else if (parsed.type === 'no_results_popup') {
      flushQueue();
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, noResultsPopup: { query: parsed.query } }
            : msg
        )
      );
    }
    // Handle setup started
    else if (parsed.type === 'setup_started') {
      setSetupState(prev => ({
        automationId: parsed.automation_id,
        automationName: parsed.automation_name,
        requiredFields: parsed.required_inputs || [],
        optionalFields: parsed.optional_inputs || [],
        collectedFields: parsed.collected_fields || prev?.collectedFields || {}
      }));
      setSelectedAutomation({
        id: parsed.automation_id,
        name: parsed.automation_name,
        required_inputs: parsed.required_inputs
      });
    }
    // Handle file search results
    else if (parsed.type === 'file_search_results') {
      flushQueue();
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, fileSearchResults: parsed.files }
            : msg
        )
      );
      // Store for context - include field_name and automation context so selection can continue
      setLastFileSearchResults({
        files: parsed.files,
        field_name: parsed.field_name,
        automation_id: parsed.automation_id,
        automation_name: parsed.automation_name
      });
    }
    // Handle field collected
    else if (parsed.type === 'field_collected') {
      setSetupState(prev => prev ? {
        ...prev,
        collectedFields: { ...prev.collectedFields, [parsed.field_name]: parsed.value },
        collectedConfig: { ...prev.collectedConfig, [parsed.field_name]: parsed.value }  // CRITICAL: Update config too!
      } : null);
      // Clear file search results after field is collected
      setLastFileSearchResults(null);
    }
    // Handle automation complete
    else if (parsed.type === 'automation_complete') {
      const automationId = parsed.automation_id || parsed.result?.automation_id || parsed.result?.automationId || null;
      const runtimeStatus = automationId
        ? {
            automation_id: automationId,
            automation_name: parsed.automation_name || parsed.result?.automation_name || parsed.result?.automationName || null,
            result: parsed.result || null,
          }
        : null;

      if (runtimeStatus) {
        flushQueue();
        onUiMetadataUpdate?.({ runtimeStatus });
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: displayedText, runtimeStatus }
              : msg
          )
        );
      }

      setSelectedAutomation(null);
      setSetupState(null);
    }
    // Handle ready to execute - store config for confirmation
    else if (parsed.type === 'ready_to_execute') {
      setSetupState(prev => ({
        ...prev,
        automationId: parsed.automation_id,
        automationName: parsed.automation_name,
        readyConfig: parsed.config,
        isReadyToExecute: true
      }));
    }
    // Handle awaiting input - preserve automation context AND collected config for next AI call
    else if (parsed.type === 'awaiting_input') {
      const configRequest = {
        automation_id: parsed.automation_id,
        automation_name: parsed.automation_name,
        required_inputs: parsed.required_inputs || [],
        optional_inputs: parsed.optional_inputs || [],
        missing_fields: parsed.missing_fields || [],
        collected_config: parsed.collected_config || {}
      };
      onUiMetadataUpdate?.({ configRequest });
      setSetupState(prev => ({
        automationId: parsed.automation_id,
        automationName: parsed.automation_name,
        requiredFields: parsed.required_inputs || prev?.requiredFields || (parsed.missing_fields || []).map(f => ({ name: f })),
        optionalFields: parsed.optional_inputs || prev?.optionalFields || [],
        collectedFields: prev?.collectedFields || {},
        // MERGE: never wipe previously collected fields — incoming config wins for new keys only
        collectedConfig: { ...(prev?.collectedConfig || {}), ...(parsed.collected_config || {}) },
        missingFields: parsed.missing_fields || [],
        isAwaitingInput: true
      }));
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, configRequest }
            : msg
        )
      );
    }
    // Handle automation instances (user stats)
    else if (parsed.type === 'automation_instances' && parsed.instances) {
      flushQueue();
      onUiMetadataUpdate?.({ automationInstances: parsed.instances });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, automationInstances: parsed.instances }
            : msg
        )
      );
    }
    // Handle hidden context (for AI memory, not displayed to user)
    else if (parsed.type === 'hidden_context') {
      // Store in hiddenContext property instead of content
      // This prevents it from being overwritten by typewriter animation
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, hiddenContext: (msg.hiddenContext || '') + '\n' + parsed.context }
            : msg
        )
      );
      // Also notify parent to save it
      if (onHiddenContextUpdate) {
        onHiddenContextUpdate(parsed.context);
      }
    }
    // Handle tool output (save as assistant message for AI memory)
    else if (parsed.type === 'tool_output') {
      console.log('[StreamHandler] Received tool output:', parsed.content.substring(0, 100));
      // Don't flush or update current message - tool output is invisible to user
      // Just add it as a hidden assistant message for AI memory
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: parsed.content,
        timestamp: new Date().toISOString(),
        isToolOutput: true, // Mark as tool output
        isHidden: true // Hide from UI - only for AI memory
      }]);
    }
    // Handle background activation prompt
    else if (parsed.type === 'background_activation_prompt') {
      flushQueue();
      const backgroundActivationPrompt = {
        automation_id: parsed.automation_id,
        automation_name: parsed.automation_name,
        config: parsed.config
      };
      onUiMetadataUpdate?.({ backgroundActivationPrompt });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
              ...msg,
              content: displayedText,
              backgroundActivationPrompt
            }
            : msg
        )
      );
    }
    // Handle video preview
    else if (parsed.type === 'video_preview') {
      flushQueue();
      const videoPreview = {
        file_name: parsed.file_name,
        preview_url: parsed.preview_url,
        expires_in: parsed.expires_in
      };
      onUiMetadataUpdate?.({ videoPreview });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
              ...msg,
              content: displayedText,
              videoPreview
            }
            : msg
        )
      );
    }
    // Handle regular content
    else if (parsed.content) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, isThinking: false } : msg
        )
      );
      textQueue += parsed.content;
      startTypewriterAnimation();
    }
  };

  return {
    handleParsedEvent,
    startTypewriterAnimation,
    markStreamEnded: () => {
      streamEnded = true;
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, isThinking: false } : msg
        )
      );
      // Final content update when stream ends
      if (onContentUpdate) onContentUpdate(displayedText + textQueue);
    },
    getDisplayedText: () => displayedText
  };
}
