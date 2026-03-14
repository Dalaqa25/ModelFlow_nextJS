'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';
import AiChat from '@/app/components/mainComponents/aiChat';
import WelcomeModal from '@/app/components/WelcomeModal';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <HomeContent />
        </Suspense>
    );
}

function HomeContent() {
    const { isAuthenticated } = useAuth();
    const { isExpanded, isMobile } = useSidebar();
    const searchParams = useSearchParams();
    const chatId = searchParams.get('chat');

    const [hasStartedChat, setHasStartedChat] = useState(!!chatId);

    useEffect(() => {
        if (chatId) {
            setHasStartedChat(true);
        } else {
            setHasStartedChat(false);
        }
    }, [chatId]);

    const [pendingMessage, setPendingMessage] = useState(null);
    const chatRef = useRef(null);
    const [isScoped, setIsScoped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadActive, setIsUploadActive] = useState(false);

    const handleUploadStatusChange = (isActive) => {
        setIsUploadActive(isActive);
    };

    const handleFileUpload = (file) => {
        if (chatRef.current) {
            chatRef.current.handleFileUpload(file);
        }
    };

    const handleMessageSent = (message) => {
        if (!hasStartedChat) {
            setHasStartedChat(true);
            setPendingMessage(message);
        } else {
            if (chatRef.current) {
                chatRef.current.handleNewMessage(message);
            }
        }
    };

    useEffect(() => {
        if (hasStartedChat && pendingMessage && chatRef.current) {
            chatRef.current.handleNewMessage(pendingMessage);
            setPendingMessage(null);
        }
    }, [hasStartedChat, pendingMessage]);

    const handleLoadingChange = (loading) => {
        setIsLoading(loading);
    };

    const handleStopGeneration = () => {
        if (chatRef.current) {
            chatRef.current.stopGeneration();
        }
    };

    return (
        <>
            {/* SEO content for crawlers */}
            <div className="sr-only">
                <h1>ModelGrow - AI Automation Platform for Business Workflows</h1>
                <p>Automate your business workflows with ModelGrow. Connect Google Drive, Gmail, Sheets, Calendar, and more.</p>
            </div>

            <AdaptiveBackground variant="content" className="" showFloatingElements={false}>
                <div
                    className={`
                        fixed inset-0 z-40 pointer-events-none
                        transition-opacity duration-300
                        ${isScoped ? 'opacity-62' : 'opacity-0'}
                    `}
                >
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,transparent_82%,rgba(0,0,0,0.22)_100%)] backdrop-blur-[1px]" />
                </div>

                <div
                    className={`flex flex-col items-center px-6 transition-all duration-300 ${!hasStartedChat ? 'min-h-[calc(100vh-4rem)] justify-center' : ''}`}
                    style={{ paddingLeft: !isMobile && isExpanded ? '256px' : !isMobile ? '52px' : '0' }}
                >
                    {!hasStartedChat ? null : (
                        <div className="w-full h-full flex flex-col items-center pt-[15vh]">
                            <div className="w-full max-w-4xl flex-1 flex flex-col">
                                <AiChat
                                    ref={chatRef}
                                    initialConversationId={chatId}
                                    onLoadingChange={handleLoadingChange}
                                    onAwaitFileUploadChange={handleUploadStatusChange}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <MainInput
                    onMessageSent={handleMessageSent}
                    onScopeChange={setIsScoped}
                    isLoading={isLoading}
                    onStopGeneration={handleStopGeneration}
                    isUploadActive={isUploadActive}
                    onFileUpload={handleFileUpload}
                    chatStarted={hasStartedChat}
                    greetingSlot={!hasStartedChat ? <Greetings /> : null}
                />
                <WelcomeModal />

                {!hasStartedChat && !isAuthenticated && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-4">
                        <p className="text-sm text-gray-500 text-center">
                            By messaging ModelGrow, you agree to our{' '}
                            <a href="/terms" className="font-semibold text-gray-400 underline hover:text-white transition-colors">Terms</a>
                            {' '}and{' '}
                            <a href="/privacy" className="font-semibold text-gray-400 underline hover:text-white transition-colors">Privacy Policy</a>
                        </p>
                    </div>
                )}
            </AdaptiveBackground>
        </>
    );
}
