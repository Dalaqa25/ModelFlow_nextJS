'use client';

import { useState, useRef, useCallback } from 'react';
import { createStreamHandler } from './useStreamHandler';

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

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
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
      let conversationHistory = messages
        .filter(msg => msg.content?.trim())
        .map(msg => ({ role: msg.role, content: msg.content }));

      const contextInfo = buildContextInfo() + extraContext;
      conversationHistory.push({ role: 'user', content: messageText + contextInfo });

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
    if (selectedAutomation) {
      sendMessage(`I've connected my ${provider} account for "${selectedAutomation.name}". What's next?`, `\n\n[Selected automation UUID: ${selectedAutomation.id}]`);
    } else {
      sendMessage(`I've connected my ${provider} account. What's next?`);
    }
  }, [selectedAutomation, sendMessage]);

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

  return {
    messages,
    isLoading,
    currentAiMessageId,
    sendMessage,
    stopGeneration,
    handleAutomationSelect,
    handleConnectionComplete,
    handleConfigSubmit
  };
}
