'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useAiChat } from './useAiChat';
import MessageRenderer from './MessageRenderer';

const AiChat = forwardRef((props, ref) => {
  const { onLoadingChange, onAwaitFileUploadChange } = props;
  const { isDarkMode } = useThemeAdaptive();
  const messagesEndRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
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
    uploadState,
    isAwaitingFileUpload
  } = useAiChat({ onLoadingChange });

  // Sync upload state with parent
  useEffect(() => {
    onAwaitFileUploadChange?.(isAwaitingFileUpload);
  }, [isAwaitingFileUpload, onAwaitFileUploadChange]);

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
    handleFileUpload: (file) => handleFileUpload(file),
    isLoading: isLoading,
  }));

  // Drag and Drop handlers
  const onDragOver = (e) => {
    e.preventDefault();
    if (isAwaitingFileUpload) {
      setIsDragging(true);
    }
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (!isAwaitingFileUpload) {
      // Toast is handled in handleFileUpload if called, but we can prevent it here
      // handleFileUpload calculates this too, so calling it is safe and will show toast
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-purple-500/20 backdrop-blur-sm border-4 border-purple-500 border-dashed m-4 rounded-3xl flex items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold text-purple-600 bg-white/90 px-8 py-4 rounded-xl shadow-xl">
            📂 Drop file to upload
          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {uploadState.isUploading && (
        <div className="absolute inset-x-0 top-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900/90 text-white px-6 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-4 min-w-[300px]">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  {uploadState.status === 'compressing' ? '📉 Compressing...' :
                    uploadState.status === 'uploading' ? '☁️ Uploading...' :
                      uploadState.status === 'done' ? '✅ Complete!' : '❌ Error'}
                </span>
                <span className="opacity-70">{Math.round(uploadState.progress)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${uploadState.status === 'error' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1 truncate max-w-[250px]">
                {uploadState.fileName}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto px-6 py-4 space-y-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ maxHeight: 'calc(100vh - 12rem)', paddingBottom: '2rem' }}
      >
        {messages.filter(msg => !msg.isHidden).map((message, index) => (
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
            onNoResultsClose={() => {
              // Clear the popup from the message
              setMessages(prev =>
                prev.map(msg =>
                  msg.noResultsPopup ? { ...msg, noResultsPopup: null } : msg
                )
              );
            }}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

AiChat.displayName = 'AiChat';

export default AiChat;
