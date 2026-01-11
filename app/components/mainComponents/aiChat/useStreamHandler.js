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
            ? { ...msg, content: displayedText, connectRequest: { provider: parsed.provider, reason: parsed.reason } }
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
      // Store for context - include field_name so AI knows what field this is for
      setLastFileSearchResults({ files: parsed.files, field_name: parsed.field_name });
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
