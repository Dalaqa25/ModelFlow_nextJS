'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';
import AiChat from '@/app/components/mainComponents/aiChat';
import LandingSections from '@/app/components/mainComponents/LandingSections';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';
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
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);

    // ── Scroll-based hero fade for non-auth landing ──
    const [heroOpacity, setHeroOpacity] = useState(1);
    const isLanding = !hasStartedChat && !isAuthenticated;

    useEffect(() => {
        if (!isLanding) return;

        const handleScroll = () => {
            const scrollY = window.scrollY;
            // Start fading at 100px, fully faded at 400px
            const opacity = Math.max(0, 1 - scrollY / 400);
            setHeroOpacity(opacity);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLanding]);

    const handleUploadStatusChange = (isActive) => {
        setIsUploadActive(isActive);
    };

    const handleFileUpload = (file) => {
        if (chatRef.current) {
            chatRef.current.handleFileUpload(file);
        }
    };

    const handleMessageSent = (message) => {
        if (!isAuthenticated) {
            setIsSignInOpen(true);
            return false;
        }
        if (!hasStartedChat) {
            setHasStartedChat(true);
            setPendingMessage(message);
        } else {
            if (chatRef.current) {
                chatRef.current.handleNewMessage(message);
            }
        }
        return true;
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

                {/* Hero input — fades out on scroll for non-auth landing */}
                <div
                    style={isLanding ? {
                        opacity: heroOpacity,
                        pointerEvents: heroOpacity < 0.1 ? 'none' : 'auto',
                        transition: 'opacity 0.1s ease-out',
                    } : undefined}
                >
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
                </div>

                {/* Below-fold scrollable sections for non-authenticated users */}
                {isLanding && (
                    <>
                        {/* Small spacer after the hero fold */}
                        <div className="h-8" />
                        <div
                            style={{ paddingLeft: !isMobile && isExpanded ? '256px' : !isMobile ? '52px' : '0' }}
                            className="relative z-[60] transition-all duration-300"
                        >
                            <LandingSections onSignUpClick={() => setIsSignUpOpen(true)} />
                        </div>
                    </>
                )}

                <SignInDialog
                    isOpen={isSignInOpen}
                    onClose={() => setIsSignInOpen(false)}
                    onSwitchToSignUp={() => { setIsSignInOpen(false); setIsSignUpOpen(true); }}
                />
                <SignUpDialog
                    isOpen={isSignUpOpen}
                    onClose={() => setIsSignUpOpen(false)}
                    onSwitchToSignIn={() => { setIsSignUpOpen(false); setIsSignInOpen(true); }}
                />

                {isLanding && (
                    <div
                        className="fixed bottom-0 right-0 z-50 flex items-center justify-center pb-4"
                        style={{
                            left: !isMobile && isExpanded ? '256px' : !isMobile ? '52px' : '0',
                            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: heroOpacity,
                            pointerEvents: heroOpacity < 0.1 ? 'none' : 'auto',
                        }}
                    >
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

