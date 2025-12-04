'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import Image from 'next/image';

const AiChat = forwardRef((props, ref) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
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
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-4 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        {message.role === 'assistant' && (
                            <div className="flex-shrink-0">
                                <Image
                                    src="/logo.png"
                                    alt="AI"
                                    width={36}
                                    height={36}
                                    className="rounded-lg"
                                />
                            </div>
                        )}
                        
                        <div
                            className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                                message.role === 'user'
                                    ? isDarkMode
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                        : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                    : isDarkMode
                                        ? 'bg-slate-800/90 border border-slate-700/50 text-gray-100'
                                        : 'bg-white/90 border border-gray-200 text-gray-900'
                            }`}
                        >
                            <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                                {message.role === 'assistant' && isLoading && message.content === '' && (
                                    <span className="inline-flex gap-1">
                                        <span className="animate-bounce">●</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                                    </span>
                                )}
                            </p>
                        </div>

                        {message.role === 'user' && (
                            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold ${
                                isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                            }`}>
                                U
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
});

AiChat.displayName = 'AiChat';

export default AiChat;

