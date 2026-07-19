'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';
import AiChat from '@/app/components/mainComponents/aiChat';
import LandingSections from '@/app/components/mainComponents/LandingSections';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';
import CursorReactiveGrid from '@/app/components/shared/CursorReactiveGrid';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--landing-cream)]" />}>
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
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadActive, setIsUploadActive] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [authMessage, setAuthMessage] = useState('');

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
                <h1>ModelGrow — Run Powerful Automations with AI</h1>
                <p>ModelGrow helps people discover workflows, launch them through chat, and publish automations that others can use.</p>
            </div>

            <div className={`${isLanding ? 'landing-shell' : ''} relative min-h-screen w-full flex flex-col items-center pt-24 pb-8 overflow-hidden selection:bg-[var(--landing-yellow)]/40 selection:text-[var(--landing-ink)]`}>
            {isLanding && <CursorReactiveGrid enabled theme="light" />}
            {/* Decorative blobs */}
            {isLanding && (
                <>
                    <div className="decorative-blob" style={{ width: '620px', height: '620px', background: 'radial-gradient(circle, rgba(199,125,255,0.26) 0%, transparent 70%)', top: '-250px', right: '-150px' }} />
                    <div className="decorative-blob" style={{ width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(93,88,255,0.12) 0%, transparent 72%)', top: '12%', left: '-240px' }} />
                </>
            )}
            {isLanding && (
                <>
                    <div className="landing-doodle animate-bobble hidden sm:block rounded-[2rem]" style={{ width: 86, height: 54, top: '18%', right: '12%', '--rotate': '8deg' }} />
                    <div className="landing-doodle animate-bobble hidden lg:block rounded-full" style={{ width: 52, height: 52, top: '36%', left: '9%', '--rotate': '-10deg', animationDelay: '1s' }} />
                </>
            )}

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
                                onRequireAuth={() => setIsSignInOpen(true)}
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
                    isLoading={isLoading}
                    onStopGeneration={handleStopGeneration}
                    isUploadActive={isUploadActive}
                    onFileUpload={handleFileUpload}
                    chatStarted={hasStartedChat}
                    greetingSlot={!hasStartedChat ? <Greetings /> : null}
                    isLanding={isLanding}
                    onScrollExplore={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })}
                    onAuthRequired={() => {
                        setAuthMessage('Sign in to run automations, publish workflows, and track your workspace');
                        setIsSignInOpen(true);
                    }}
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
                onClose={() => {
                    setIsSignInOpen(false);
                    setAuthMessage('');
                }}
                onSwitchToSignUp={() => {
                    setIsSignInOpen(false);
                    setAuthMessage('');
                    setIsSignUpOpen(true);
                }}
                customMessage={authMessage}
            />
            <SignUpDialog
                isOpen={isSignUpOpen}
                onClose={() => setIsSignUpOpen(false)}
                onSwitchToSignIn={() => { setIsSignUpOpen(false); setIsSignInOpen(true); }}
            />

            {isLanding && (
                <div
                    className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col items-center justify-end gap-3 pb-6 pointer-events-none"
                    style={{
                        paddingLeft: !isMobile && isExpanded ? '256px' : !isMobile ? '52px' : '0',
                        transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: heroOpacity,
                    }}
                >
                    <div className="pointer-events-auto flex flex-col items-center gap-2">
                        <button
                            onClick={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })}
                            aria-label="Scroll down to explore"
                            className="flex flex-col items-center gap-1.5 group cursor-pointer bg-transparent border-none p-0"
                        >
                            <span className="text-xs tracking-widest uppercase landing-copy group-hover:text-[var(--landing-ink)] transition-colors duration-300 font-bold">
                                Scroll to explore
                            </span>
                            <div className="animate-scroll-bounce flex flex-col items-center">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[var(--landing-accent)] group-hover:text-[var(--landing-ink)] transition-colors duration-300">
                                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[var(--landing-accent-2)]/70 group-hover:text-[var(--landing-ink)]/70 transition-colors duration-300 -mt-2.5">
                                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </button>
                        <p className="landing-copy hover:text-[var(--landing-ink)] transition-colors cursor-pointer text-xs sm:text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/30">
                            Terms & Privacy
                        </p>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
