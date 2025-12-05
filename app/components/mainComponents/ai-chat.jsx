'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import Image from 'next/image';

const AiChat = forwardRef((props, ref) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentAiMessageId, setCurrentAiMessageId] = useState(null);
    const messagesEndRef = useRef(null);
    const { isDarkMode, textColors } = useThemeAdaptive();

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

        // Create placeholder for AI response
        const aiMessageId = Date.now();
        const aiMessage = {
            id: aiMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setCurrentAiMessageId(aiMessageId);

        try {
            const response = await fetch('/api/ai/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    prompt: messageText,
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
                            setCurrentAiMessageId(null);
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
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
            console.error('Error:', error);
            const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === aiMessageId
                        ? { ...msg, content: `❌ ${errorMessage}` }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
            setCurrentAiMessageId(null);
        }
    };

    // Expose method to parent component
    useImperativeHandle(ref, () => ({
        handleNewMessage: (messageText) => {
            handleSendMessage(messageText);
        }
    }));

    return (
        <div className="w-full h-full flex flex-col">
            {/* Chat messages container */}
            <div 
                className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
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
                        key={index}
                        className={`flex gap-4 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        {/* No avatar for assistant anymore */}
                        <div
                            className={`max-w-[70%] ${
                                message.role === 'user'
                                    ? `rounded-2xl px-5 py-3 ${
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

                        {/* No avatar for user anymore */}
                    </div>
                )})}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
});

AiChat.displayName = 'AiChat';

export default AiChat;

