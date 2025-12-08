'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import Image from 'next/image';
import AutomationCard from './AutomationCard';
import ConnectButton from './ConnectButton';

const AiChat = forwardRef((props, ref) => {
    const [messages, setMessages] = useState([]);
    const [conversationSummary, setConversationSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentAiMessageId, setCurrentAiMessageId] = useState(null);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const readerRef = useRef(null);
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
            console.log('Already processing a message, please wait...');
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
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setCurrentAiMessageId(aiMessageId);

        // Create AbortController for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            // Build conversation history (exclude the empty AI message we just added)
            let conversationHistory = messages
                .filter(msg => msg.content && msg.content.trim() !== '')
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
            
            // Add current user message
            conversationHistory.push({
                role: 'user',
                content: messageText
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
                                        } catch (e) {}
                                    }
                                }
                            }
                        }
                        
                        setConversationSummary(summary);
                    }
                } catch (e) {
                    console.error('Summarization error:', e);
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

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            setIsLoading(false);
                            if (onLoadingChange) onLoadingChange(false);
                            setCurrentAiMessageId(null);
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            
                            // Handle automation results
                            if (parsed.type === 'automations' && parsed.automations) {
                                setMessages(prev => 
                                    prev.map(msg => 
                                        msg.id === aiMessageId
                                            ? { ...msg, automations: parsed.automations }
                                            : msg
                                    )
                                );
                            }
                            // Handle connection requests
                            else if (parsed.type === 'connect_request') {
                                setMessages(prev => 
                                    prev.map(msg => 
                                        msg.id === aiMessageId
                                            ? { ...msg, connectRequest: { provider: parsed.provider, reason: parsed.reason } }
                                            : msg
                                    )
                                );
                            }
                            // Handle regular content
                            else if (parsed.content) {
                                setMessages(prev => 
                                    prev.map(msg => 
                                        msg.id === aiMessageId
                                            ? { ...msg, content: msg.content + parsed.content }
                                            : msg
                                    )
                                );
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            // Don't show error if it was aborted by user
            if (error.name === 'AbortError') {
                console.log('Stream aborted by user');
                // Update message to show it was stopped
                setMessages(prev => 
                    prev.map(msg => 
                        msg.id === aiMessageId && msg.content === ''
                            ? { ...msg, content: '(Response stopped)' }
                            : msg
                    )
                );
            } else {
                console.error('Error:', error);
                const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
                setMessages(prev => 
                    prev.map(msg => 
                        msg.id === aiMessageId
                            ? { ...msg, content: `❌ ${errorMessage}` }
                            : msg
                    )
                );
            }
        } finally {
            setIsLoading(false);
            if (onLoadingChange) onLoadingChange(false);
            setCurrentAiMessageId(null);
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
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        setCurrentAiMessageId(null);
    };

    const handleAutomationSelect = (automation) => {
        const selectionMessage = `I want to use "${automation.name}" (ID: ${automation.id})`;
        handleSendMessage(selectionMessage);
    };

    const handleConnectionComplete = (provider) => {
        const connectionMessage = `I've connected my ${provider} account. What's next?`;
        handleSendMessage(connectionMessage);
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
                className="flex-1 overflow-y-auto px-6 py-4 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                    <div key={index} className="w-full">
                        <div
                            className={`flex gap-4 ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-[70%] ${
                                    message.role === 'user'
                                        ? `rounded-4xl px-3 py-2 ${
                                            isDarkMode
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-purple-500 text-white'
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
                    </div>
                )})}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
});

AiChat.displayName = 'AiChat';

export default AiChat;


