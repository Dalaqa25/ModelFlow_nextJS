'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import MarketingLanding from '@/app/components/marketing/MarketingLanding';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';
import AiChat from '@/app/components/mainComponents/aiChat';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf7]" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isExpanded, isMobile } = useSidebar();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');

  const [hasStartedChat, setHasStartedChat] = useState(Boolean(chatId));
  const [pendingMessage, setPendingMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadActive, setIsUploadActive] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    setHasStartedChat(Boolean(chatId));
  }, [chatId]);

  useEffect(() => {
    if (hasStartedChat && pendingMessage && chatRef.current) {
      chatRef.current.handleNewMessage(pendingMessage);
      setPendingMessage(null);
    }
  }, [hasStartedChat, pendingMessage]);

  const handleMessageSent = (message) => {
    if (!hasStartedChat) {
      setHasStartedChat(true);
      setPendingMessage(message);
    } else {
      chatRef.current?.handleNewMessage(message);
    }
    return true;
  };

  const handleFileUpload = (file) => {
    chatRef.current?.handleFileUpload(file);
  };

  const handleStopGeneration = () => {
    chatRef.current?.stopGeneration();
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#fbfaf7]" />;
  }

  if (!isAuthenticated) {
    return <MarketingLanding />;
  }

  const sidebarOffset = !isMobile && isExpanded ? '256px' : !isMobile ? '52px' : '0px';

  return (
    <div className="relative min-h-screen w-full overflow-hidden pb-8 pt-20">
      <div
        className={`flex min-h-[calc(100vh-5rem)] flex-col items-center px-6 transition-[padding] duration-300 ${hasStartedChat ? '' : 'justify-center'}`}
        style={{ paddingLeft: sidebarOffset }}
      >
        {hasStartedChat && (
          <div className="flex h-full w-full flex-1 flex-col items-center pt-[9vh]">
            <div className="flex w-full max-w-4xl flex-1 flex-col">
              <AiChat
                ref={chatRef}
                initialConversationId={chatId}
                onLoadingChange={setIsLoading}
                onAwaitFileUploadChange={setIsUploadActive}
              />
            </div>
          </div>
        )}
      </div>

      <MainInput
        onMessageSent={handleMessageSent}
        isLoading={isLoading}
        onStopGeneration={handleStopGeneration}
        isUploadActive={isUploadActive}
        onFileUpload={handleFileUpload}
        chatStarted={hasStartedChat}
        greetingSlot={!hasStartedChat ? <Greetings /> : null}
      />
    </div>
  );
}
