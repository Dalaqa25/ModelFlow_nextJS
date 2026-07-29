'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import AutomationsList from '@/app/components/mainComponents/AutomationsList';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';

const AiChat = dynamic(() => import('@/app/components/mainComponents/aiChat'), {
    ssr: false,
    loading: () => <div className="text-slate-400 text-sm py-4">Loading chat...</div>,
});

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <HomeContent />
        </Suspense>
    );
}

function HomeContent() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const chatId = searchParams.get('chat');
    const previewAutomationId = searchParams.get('preview');
    const setupName = searchParams.get('setup');
    const setupAutomationId = searchParams.get('automationId');

    const [hasStartedChat, setHasStartedChat] = useState(!!chatId);
    const [pendingMessage, setPendingMessage] = useState(null);
    const [pendingContext, setPendingContext] = useState('');
    const [pendingSetupIntro, setPendingSetupIntro] = useState(null);
    const [chatReadyTick, setChatReadyTick] = useState(0);
    const chatRef = useRef(null);
    const autoSetupRef = useRef(null);
    const previousChatIdRef = useRef(chatId);

    // Keep the mounted chat in sync with navigation. Returning to /main must
    // create a genuinely fresh chat instead of leaving the previous one visible.
    useEffect(() => {
        if (chatId) {
            setHasStartedChat(true);
        } else if (previousChatIdRef.current) {
            setHasStartedChat(false);
            setPendingMessage(null);
            setPendingContext('');
            setPendingSetupIntro(null);
        }
        previousChatIdRef.current = chatId;
    }, [chatId]);

    useEffect(() => {
        let mounted = true;

        async function loadPreviewAutomation() {
            if (!previewAutomationId) return;

            try {
                const response = await fetch(`/api/automations?id=${encodeURIComponent(previewAutomationId)}`);
                const data = await response.json().catch(() => null);
                if (mounted && response.ok && data?.id) {
                    setHasStartedChat(true);
                    setPendingSetupIntro(data);
                    if (typeof window !== 'undefined') {
                        queueMicrotask(() => {
                            window.history.replaceState({}, '', '/main');
                        });
                    }
                }
            } catch (error) {}
        }

        loadPreviewAutomation();
        return () => {
            mounted = false;
        };
    }, [previewAutomationId]);

    useEffect(() => {
        const setupKey = setupAutomationId ? `${setupAutomationId}:${setupName}` : setupName;
        if (!setupName || autoSetupRef.current === setupKey) return;

        autoSetupRef.current = setupKey;
        setHasStartedChat(true);
        setPendingMessage(`I want to set up the "${setupName}" automation`);
        setPendingContext(setupAutomationId ? `\n\n[Selected automation UUID: ${setupAutomationId}]\n[automation_id="${setupAutomationId}", automation_name="${setupName}"]` : '');

        // `setup` is a one-shot command from Explore. Clear it so refresh does not replay it.
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/main');
        }
    }, [setupName, setupAutomationId]);

    const [isScoped, setIsScoped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadActive, setIsUploadActive] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    
    const { isMobile, isExpanded } = useSidebar();
    const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/');
        }
    }, [authLoading, isAuthenticated, router]);

    const switchToSignUp = () => { setIsSignInOpen(false); setIsSignUpOpen(true); };
    const switchToSignIn = () => { setIsSignUpOpen(false); setIsSignInOpen(true); };
    const handleChatReady = useCallback(() => {
        setChatReadyTick((tick) => tick + 1);
    }, []);
    const handleConversationChange = useCallback((conversationId) => {
        if (!conversationId || typeof window === 'undefined') return;

        window.history.replaceState({}, '', `/main?chat=${conversationId}`);
    }, []);

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

    // Send pending message once chat component is mounted
    useEffect(() => {
        if (hasStartedChat && pendingMessage && chatRef.current) {
            chatRef.current.handleNewMessage(pendingMessage, pendingContext);
            setPendingMessage(null);
            setPendingContext('');
        }
    }, [hasStartedChat, pendingMessage, pendingContext, chatReadyTick]);

    useEffect(() => {
        if (hasStartedChat && pendingSetupIntro && chatRef.current) {
            chatRef.current.startAutomationSetupIntro(pendingSetupIntro);
            setPendingSetupIntro(null);
        }
    }, [hasStartedChat, pendingSetupIntro, chatReadyTick]);

    const handleLoadingChange = (loading) => {
        setIsLoading(loading);
    };

    const handleStopGeneration = () => {
        if (chatRef.current) {
            chatRef.current.stopGeneration();
        }
    };

    if (authLoading || !isAuthenticated) {
        return <div className="min-h-screen bg-[#f7f8fb] dark:bg-[#15172f]" />;
    }

    return (
        <AdaptiveBackground
            variant="content"
            className=""
            showFloatingElements={false}
            showPattern={true}
            showReactiveGrid={true}
        >
            {/* Full-page sniper-scope style overlay */}
            <div
                className={`
                    fixed inset-0 z-40 pointer-events-none
                    transition-opacity duration-300
                    ${isScoped ? 'opacity-62' : 'opacity-0'}
                `}
            >
                {/* Radial vignette: big clear center, extra soft dark corners */}
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,transparent_82%,rgba(0,0,0,0.22)_100%)] backdrop-blur-[1px]" />
            </div>

            <div className={`flex flex-col items-center px-6 ${!hasStartedChat ? 'min-h-[calc(100vh-4rem)] justify-center' : 'min-h-screen'}`}>
                {!hasStartedChat ? null : (
                    <div 
                        className="w-full min-h-screen flex flex-col items-center pt-24 pb-40 transition-all duration-300"
                        style={{ paddingLeft: sidebarOffset }}
                    >
                        <div className="w-full max-w-4xl flex flex-col">
                            <AiChat
                                ref={chatRef}
                                initialConversationId={chatId}
                                onLoadingChange={handleLoadingChange}
                                onAwaitFileUploadChange={handleUploadStatusChange}
                                onReady={handleChatReady}
                                onConversationChange={handleConversationChange}
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
                onAuthRequired={() => setIsSignInOpen(true)}
            />
            <AutomationsList
                isVisible={!hasStartedChat}
                onSelect={(automation) => {
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, '', `/main?preview=${automation.id}`);
                    }
                }}
            />
            <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
            <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
        </AdaptiveBackground>
    );
}
