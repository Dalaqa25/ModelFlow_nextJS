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
  setCurrentAiMessageId
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
    // Handle automation results (legacy cards)
    if (parsed.type === 'automations' && parsed.automations) {
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
    // Handle connection requests
    else if (parsed.type === 'connect_request') {
      flushQueue();
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, connectRequest: { provider: parsed.provider, automation_id: parsed.automation_id, reason: parsed.reason } }
            : msg
        )
      );
    }
    // Handle config requests
    else if (parsed.type === 'config_request') {
      flushQueue();
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: displayedText, configRequest: { automation_id: parsed.automation_id, required_inputs: parsed.required_inputs } }
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
    // Handle setup started
    else if (parsed.type === 'setup_started') {
      setSetupState(prev => ({
        automationId: parsed.automation_id,
        automationName: parsed.automation_name,
        requiredFields: parsed.required_inputs || [],
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
        collectedFields: { ...prev.collectedFields, [parsed.field_name]: parsed.value }
      } : null);
      // Clear file search results after field is collected
      setLastFileSearchResults(null);
    }
    // Handle automation complete
    else if (parsed.type === 'automation_complete') {
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
      setSetupState(prev => ({
        automationId: parsed.automation_id,
        automationName: parsed.automation_name,
        requiredFields: prev?.requiredFields || parsed.missing_fields.map(f => ({ name: f })),
        collectedFields: prev?.collectedFields || {},
        collectedConfig: parsed.collected_config || prev?.collectedConfig || {},  // Store the actual config values!
        missingFields: parsed.missing_fields,
        isAwaitingInput: true
      }));
    }
    // Handle automation instances (user stats)
    else if (parsed.type === 'automation_instances' && parsed.instances) {
      flushQueue();
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
      // Add to message content so it persists in chat history for AI
      // But don't display it to the user
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: msg.content + '\n' + parsed.context }
            : msg
        )
      );
    }
    // Handle regular content
    else if (parsed.content) {
      textQueue += parsed.content;
      startTypewriterAnimation();
    }
  };

  return {
    handleParsedEvent,
    startTypewriterAnimation,
    markStreamEnded: () => { streamEnded = true; },
    getDisplayedText: () => displayedText
  };
}
