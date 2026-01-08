'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import Image from 'next/image';
import AutomationCard from './AutomationCard';
import ConnectButton from './ConnectButton';
import ConfigForm from './ConfigForm';

const AiChat = forwardRef((props, ref) => {
    const [messages, setMessages] = useState([]);
    const [conversationSummary, setConversationSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentAiMessageId, setCurrentAiMessageId] = useState(null);
    const [selectedAutomation, setSelectedAutomation] = useState(null); // Track selected automation
    const [automationContext, setAutomationContext] = useState(null); // Track automation UUIDs for AI reference
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const readerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const { isDarkMode } = useThemeAdaptive();
    const { onLoadingChange } = props;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim()) return;
        if (isLoading) {
            return;
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: messageText,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        if (onLoadingChange) onLoadingChange(true);

        // Create placeholder for AI response
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

        // Create AbortController for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Declare streamEnded outside try block so it's accessible in catch
        let streamEnded = false;

        try {
            // Build conversation history (exclude the empty AI message we just added)
            let conversationHistory = messages
                .filter(msg => msg.content && msg.content.trim() !== '')
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            // Add current user message with automation context if available
            const userMessageContent = automationContext
                ? `${messageText}\n\n[Context: Previously shown automations:\n${automationContext}]`
                : messageText;
            conversationHistory.push({
                role: 'user',
                content: userMessageContent
            });

            // Check if we need to summarize (every 10 messages)
            if (conversationHistory.length >= 10 && conversationHistory.length % 10 === 0) {
                try {
                    // Summarize the conversation
                    const summaryResponse = await fetch('/api/ai/stream', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            messages: [
                                {
                                    role: 'system',
                                    content: 'Summarize this conversation in 2-3 sentences, focusing on what the user is looking for and key points discussed.'
                                },
                                ...conversationHistory.slice(0, -5) // Summarize older messages
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
                            const lines = chunk.split('\n');

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const data = line.slice(6);
                                    if (data !== '[DONE]') {
                                        try {
                                            const parsed = JSON.parse(data);
                                            if (parsed.content) summary += parsed.content;
                                        } catch (e) { }
                                    }
                                }
                            }
                        }

                        setConversationSummary(summary);
                    }
                } catch (e) {
                    // Error handled silently
                }
            }

            // Keep only last 15 messages + summary if exists
            if (conversationHistory.length > 15) {
                conversationHistory = conversationSummary
                    ? [
                        { role: 'system', content: `Previous conversation summary: ${conversationSummary}` },
                        ...conversationHistory.slice(-15)
                    ]
                    : conversationHistory.slice(-15);
            }

            const response = await fetch('/api/ai/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                signal: abortController.signal,
                body: JSON.stringify({
                    messages: conversationHistory,
                    temperature: 0.7,
                    maxTokens: 2000,
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please sign in to use the AI chat feature.');
                }
                throw new Error('Failed to get response from AI.');
            }

            const reader = response.body.getReader();
            readerRef.current = reader;
            const decoder = new TextDecoder();

            // Queue-based smooth rendering with consistent character-by-character display
            let textQueue = ''; // Queue of text waiting to be displayed
            let displayedText = ''; // Text that's already shown
            let isAnimating = false;
            const CHARS_PER_SECOND = 120; // Consistent display speed - much faster!

            const startTypewriterAnimation = () => {
                if (isAnimating) return;
                isAnimating = true;

                let lastFrameTime = performance.now();

                const animate = (currentTime) => {
                    const deltaTime = currentTime - lastFrameTime;

                    // Calculate how many characters to display based on time elapsed
                    const charsToAdd = Math.floor((deltaTime / 1000) * CHARS_PER_SECOND);

                    if (charsToAdd > 0 && textQueue.length > 0) {
                        // Move characters from queue to displayed text
                        const newChars = textQueue.slice(0, charsToAdd);
                        textQueue = textQueue.slice(charsToAdd);
                        displayedText += newChars;

                        // Update UI
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === aiMessageId
                                    ? { ...msg, content: displayedText }
                                    : msg
                            )
                        );

                        lastFrameTime = currentTime;
                    }

                    // Continue animating if there's more text or stream is still active
                    if (textQueue.length > 0 || !streamEnded) {
                        animationFrameRef.current = requestAnimationFrame(animate);
                    } else {
                        // Animation complete - now we can turn off loading
                        isAnimating = false;
                        animationFrameRef.current = null;
                        setIsLoading(false);
                        if (onLoadingChange) onLoadingChange(false);
                        setCurrentAiMessageId(null);
                    }
                };

                animationFrameRef.current = requestAnimationFrame(animate);
            };

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Mark stream as ended - animation will continue until queue is empty
                    streamEnded = true;
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            // Mark stream as ended - animation will continue until queue is empty
                            // Loading state will be turned off when animation completes
                            streamEnded = true;
                            // Make sure animation is running to finish displaying remaining text
                            startTypewriterAnimation();
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            // Handle automation results
                            if (parsed.type === 'automations' && parsed.automations) {
                                // Clear old automation context - new search means fresh context
                                setAutomationContext(null);

                                // Stop animation and flush queue immediately before showing automations
                                if (animationFrameRef.current) {
                                    cancelAnimationFrame(animationFrameRef.current);
                                    animationFrameRef.current = null;
                                    isAnimating = false;
                                }
                                if (textQueue) {
                                    displayedText += textQueue;
                                    textQueue = '';
                                }
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === aiMessageId
                                            ? { ...msg, content: displayedText, automations: parsed.automations }
                                            : msg
                                    )
                                );
                            }
                            // Handle connection requests
                            else if (parsed.type === 'connect_request') {
                                if (animationFrameRef.current) {
                                    cancelAnimationFrame(animationFrameRef.current);
                                    animationFrameRef.current = null;
                                    isAnimating = false;
                                }
                                if (textQueue) {
                                    displayedText += textQueue;
                                    textQueue = '';
                                }
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === aiMessageId
                                            ? { ...msg, content: displayedText, connectRequest: { provider: parsed.provider, reason: parsed.reason } }
                                            : msg
                                    )
                                );
                            }
                            // Handle configuration requests
                            else if (parsed.type === 'config_request') {
                                if (animationFrameRef.current) {
                                    cancelAnimationFrame(animationFrameRef.current);
                                    animationFrameRef.current = null;
                                    isAnimating = false;
                                }
                                if (textQueue) {
                                    displayedText += textQueue;
                                    textQueue = '';
                                }
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === aiMessageId
                                            ? { ...msg, content: displayedText, configRequest: { automation_id: parsed.automation_id, required_inputs: parsed.required_inputs } }
                                            : msg
                                    )
                                );
                            }
                            // Handle automation context (store for AI reference, don't display)
                            else if (parsed.type === 'automation_context' && parsed.context) {
                                setAutomationContext(parsed.context);
                            }
                            // Handle regular content - add to queue for smooth typewriter display
                            else if (parsed.content) {
                                textQueue += parsed.content;
                                startTypewriterAnimation();
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            // Mark stream as ended
            streamEnded = true;

            // Don't show error if it was aborted by user
            if (error.name === 'AbortError') {
                // Stop animation and turn off loading immediately
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                setIsLoading(false);
                if (onLoadingChange) onLoadingChange(false);
                setCurrentAiMessageId(null);
            } else {
                // Stop animation and show error
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, content: `❌ ${errorMessage}` }
                            : msg
                    )
                );
                setIsLoading(false);
                if (onLoadingChange) onLoadingChange(false);
                setCurrentAiMessageId(null);
            }
        } finally {
            // Don't turn off loading here - animation might still be running
            // Loading will be turned off when animation completes or in error cases
            abortControllerRef.current = null;
            readerRef.current = null;
        }
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (readerRef.current) {
            readerRef.current.cancel();
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        setCurrentAiMessageId(null);
    };

    const handleAutomationSelect = (automation) => {
        // Save selected automation for later use (e.g., after OAuth)
        setSelectedAutomation(automation);

        // Show clean message to user, but include ID in a hidden way for the AI
        const selectionMessage = `I want to use "${automation.name}"`;

        // Send both - the visible message and context
        handleSendMessageWithContext(selectionMessage, automation.id);
    };

    const handleSendMessageWithContext = async (messageText, automationId) => {
        if (!messageText.trim()) return;
        if (isLoading) return;

        // Add user message (visible)
        const userMessage = {
            role: 'user',
            content: messageText,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        if (onLoadingChange) onLoadingChange(true);

        // Create placeholder for AI response
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
            // Build conversation with hidden context for AI
            let conversationHistory = messages
                .filter(msg => msg.content && msg.content.trim() !== '')
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            // Add the visible user message + hidden UUID context for AI
            conversationHistory.push({
                role: 'user',
                content: `${messageText}\n\n[Selected automation UUID: ${automationId}]`
            });

            const response = await fetch('/api/ai/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: abortController.signal,
                body: JSON.stringify({
                    messages: conversationHistory,
                    temperature: 0.7,
                    maxTokens: 2000,
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please sign in to use the AI chat feature.');
                }
                throw new Error('Failed to get response from AI.');
            }

            const reader = response.body.getReader();
            readerRef.current = reader;
            const decoder = new TextDecoder();

            let textQueue = '';
            let displayedText = '';
            let isAnimating = false;
            let streamEnded = false;
            const CHARS_PER_SECOND = 120;

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
                                msg.id === aiMessageId
                                    ? { ...msg, content: displayedText }
                                    : msg
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

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    streamEnded = true;
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            streamEnded = true;
                            startTypewriterAnimation();
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            if (parsed.type === 'automations' && parsed.automations) {
                                if (animationFrameRef.current) {
                                    cancelAnimationFrame(animationFrameRef.current);
                                    animationFrameRef.current = null;
                                    isAnimating = false;
                                }
                                if (textQueue) {
                                    displayedText += textQueue;
                                    textQueue = '';
                                }
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === aiMessageId
                                            ? { ...msg, content: displayedText, automations: parsed.automations }
                                            : msg
                                    )
                                );
                            }
                            else if (parsed.type === 'connect_request') {
                                if (animationFrameRef.current) {
                                    cancelAnimationFrame(animationFrameRef.current);
                                    animationFrameRef.current = null;
                                    isAnimating = false;
                                }
                                if (textQueue) {
                                    displayedText += textQueue;
                                    textQueue = '';
                                }
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === aiMessageId
                                            ? { ...msg, content: displayedText, connectRequest: { provider: parsed.provider, reason: parsed.reason } }
                                            : msg
                                    )
                                );
                            }
                            else if (parsed.type === 'config_request') {
                                if (animationFrameRef.current) {
                                    cancelAnimationFrame(animationFrameRef.current);
                                    animationFrameRef.current = null;
                                    isAnimating = false;
                                }
                                if (textQueue) {
                                    displayedText += textQueue;
                                    textQueue = '';
                                }
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === aiMessageId
                                            ? { ...msg, content: displayedText, configRequest: { automation_id: parsed.automation_id, required_inputs: parsed.required_inputs } }
                                            : msg
                                    )
                                );
                            }
                            // Handle automation context (store for AI reference, don't display)
                            else if (parsed.type === 'automation_context' && parsed.context) {
                                setAutomationContext(parsed.context);
                            }
                            else if (parsed.content) {
                                textQueue += parsed.content;
                                startTypewriterAnimation();
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (error) {
            streamEnded = true;

            if (error.name === 'AbortError') {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                setIsLoading(false);
                if (onLoadingChange) onLoadingChange(false);
                setCurrentAiMessageId(null);
            } else {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, content: `❌ ${errorMessage}` }
                            : msg
                    )
                );
                setIsLoading(false);
                if (onLoadingChange) onLoadingChange(false);
                setCurrentAiMessageId(null);
            }
        } finally {
            abortControllerRef.current = null;
            readerRef.current = null;
        }
    };

    const handleConnectionComplete = (provider) => {
        // Include automation context if we have a selected automation
        if (selectedAutomation) {
            const connectionMessage = `I've connected my ${provider} account for "${selectedAutomation.name}". What's next?`;
            handleSendMessageWithContext(connectionMessage, selectedAutomation.id);
        } else {
            const connectionMessage = `I've connected my ${provider} account. What's next?`;
            handleSendMessage(connectionMessage);
        }
    };

    const handleConfigSubmit = async (configData, automationId) => {
        try {
            // Send to automation runner to execute
            const response = await fetch('/api/automations/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    automation_id: automationId,
                    config: configData
                })
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = `Failed to start automation: ${result.error || 'Unknown error'}`;
                handleSendMessage(errorMessage);
                return;
            }

            // Success - format and display results
            let successMessage = `Automation executed successfully!\n\n`;

            // If there are actual results from the runner, include them
            if (result.result) {
                successMessage += `Results:\n${JSON.stringify(result.result, null, 2)}`;
            }

            handleSendMessage(successMessage);
        } catch (error) {
            const errorMessage = `Failed to start automation: ${error.message}`;
            handleSendMessage(errorMessage);
        }
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        handleNewMessage: (messageText) => {
            handleSendMessage(messageText);
        },
        stopGeneration: () => {
            handleStopGeneration();
        },
        isLoading: isLoading,
    }));

    return (
        <div className="w-full h-full flex flex-col">
            {/* Chat messages container */}
            <div
                className="flex-1 overflow-y-auto px-6 py-4 space-y-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{
                    maxHeight: 'calc(100vh - 12rem)',
                    paddingBottom: '2rem'
                }}
            >
                {messages.map((message, index) => {
                    // Don't render empty assistant messages except the one currently streaming
                    const isCurrentStreamingAssistant =
                        message.role === 'assistant' &&
                        isLoading &&
                        message.id === currentAiMessageId;

                    if (
                        message.role === 'assistant' &&
                        !isCurrentStreamingAssistant &&
                        (!message.content || message.content.trim() === '')
                    ) {
                        return null;
                    }

                    return (
                        <div
                            key={`${message.timestamp}-${index}`}
                            className="w-full"
                            style={{
                                animation: message.role === 'user'
                                    ? 'messageSlideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                                    : 'messageSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                opacity: 0
                            }}
                        >
                            <div
                                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                <div
                                    className={`${message.role === 'user' ? 'max-w-[85%]' : 'max-w-full'} ${message.role === 'user'
                                        ? `rounded-4xl px-3 py-2 ${isDarkMode
                                            ? 'bg-slate-800/60 text-white'
                                            : 'bg-slate-700/60 text-white'
                                        }`
                                        : isDarkMode
                                            ? 'text-gray-100'
                                            : 'text-gray-900'
                                        }`}
                                >
                                    <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                                        {message.content}
                                        {message.role === 'assistant' &&
                                            isCurrentStreamingAssistant &&
                                            message.content === '' && (
                                                <span className="inline-flex items-center justify-center mt-1">
                                                    <Image
                                                        src="/logo.png"
                                                        alt="AI thinking"
                                                        width={28}
                                                        height={28}
                                                        className="animate-spin"
                                                    />
                                                </span>
                                            )}
                                    </p>
                                </div>
                            </div>

                            {/* Render automation cards if present */}
                            {message.automations && message.automations.length > 0 && (
                                <div className="mt-4 space-y-3 max-w-[85%]">
                                    {message.automations.map((automation) => (
                                        <AutomationCard
                                            key={automation.id}
                                            automation={automation}
                                            onSelect={handleAutomationSelect}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Render connect button if present */}
                            {message.connectRequest && (
                                <div className="mt-4">
                                    <ConnectButton
                                        provider={message.connectRequest.provider}
                                        onConnect={handleConnectionComplete}
                                    />
                                </div>
                            )}

                            {/* Render config form if present */}
                            {message.configRequest && (
                                <div className="mt-4">
                                    <ConfigForm
                                        requiredInputs={message.configRequest.required_inputs}
                                        automationId={message.configRequest.automation_id}
                                        onSubmit={handleConfigSubmit}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
});

AiChat.displayName = 'AiChat';

export default AiChat;


