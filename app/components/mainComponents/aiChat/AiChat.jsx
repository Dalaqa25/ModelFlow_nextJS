'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useAiChat } from './useAiChat';
import MessageRenderer from './MessageRenderer';

const AiChat = forwardRef((props, ref) => {
  const { onLoadingChange } = props;
  const { isDarkMode } = useThemeAdaptive();
  const messagesEndRef = useRef(null);

  const {
    messages,
    isLoading,
    currentAiMessageId,
    sendMessage,
    stopGeneration,
    handleAutomationSelect,
    handleConnectionComplete,
    handleConfigSubmit,
    handleBackgroundActivate
  } = useAiChat({ onLoadingChange });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleNewMessage: (messageText) => sendMessage(messageText),
    stopGeneration: () => stopGeneration(),
    isLoading: isLoading,
  }));

  return (
    <div className="w-full h-full flex flex-col">
      <div
        className="flex-1 overflow-y-auto px-6 py-4 space-y-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ maxHeight: 'calc(100vh - 12rem)', paddingBottom: '2rem' }}
      >
        {messages.map((message, index) => (
          <MessageRenderer
            key={`${message.timestamp}-${index}`}
            message={message}
            index={index}
            isLoading={isLoading}
            currentAiMessageId={currentAiMessageId}
            isDarkMode={isDarkMode}
            onAutomationSelect={handleAutomationSelect}
            onConnectionComplete={handleConnectionComplete}
            onConfigSubmit={handleConfigSubmit}
            onBackgroundActivate={handleBackgroundActivate}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

AiChat.displayName = 'AiChat';

export default AiChat;
