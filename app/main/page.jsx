'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import AutomationsList from '@/app/components/mainComponents/AutomationsList';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';
import { ArrowRight, Bot, CheckCircle2, Plug, ShieldCheck, Sparkles, WalletCards, X } from 'lucide-react';

const AiChat = dynamic(() => import('@/app/components/mainComponents/aiChat'), {
    ssr: false,
    loading: () => <div className="text-slate-400 text-sm py-4">Loading chat...</div>,
});

function parseJsonList(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'string') return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
}

function normalizeConnectorLabel(connector) {
    const raw = String(connector || '').trim();
    if (!raw || /^step_\d+$/i.test(raw)) return '';
    return raw
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getInputLabel(input) {
    if (typeof input === 'string') return input.replace(/_/g, ' ');
    return (input?.label || input?.description || input?.name || '').replace(/_/g, ' ');
}

function AutomationPreviewCard({ automation, isLoading, onStartSetup, onClose }) {
    if (isLoading) {
        return (
            <div className="w-full max-w-4xl rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-5 h-12 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
                <div className="mt-4 h-20 animate-pulse rounded-2xl bg-slate-100" />
            </div>
        );
    }

    if (!automation) return null;

    const connectors = parseJsonList(automation.required_connectors)
        .map(normalizeConnectorLabel)
        .filter(Boolean);
    const inputs = parseJsonList(automation.required_inputs);
    const tokenCost = automation.token_cost || 0;

    return (
        <section className="pointer-events-auto w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/88 text-left shadow-[0_32px_110px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/70 backdrop-blur-2xl">
            <div className="relative bg-[radial-gradient(circle_at_12%_10%,rgba(168,85,247,0.24),transparent_30%),radial-gradient(circle_at_86%_20%,rgba(45,212,191,0.18),transparent_28%),linear-gradient(135deg,#0f172a_0%,#25164f_58%,#111827_100%)] p-7 text-white sm:p-9">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
                    aria-label="Close automation preview"
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-violet-100">
                    <Sparkles className="h-4 w-4" />
                    Automation preview
                </div>
                <h1 className="max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                    {automation.name}
                </h1>
                <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-slate-200">
                    {automation.description || 'This automation is ready to be reviewed before setup starts.'}
                </p>
            </div>

            <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                            <Bot className="h-4 w-4 text-violet-500" />
                            What happens next
                        </div>
                        <p className="text-sm font-semibold leading-7 text-slate-700">
                            First, review what this workflow needs. When you click Start setup, ModelGrow will prepare a private runtime copy, check the required app connections, and guide you through only the missing steps.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                                <Plug className="h-4 w-4 text-violet-500" />
                                Required apps
                            </div>
                            {connectors.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {connectors.map((connector) => (
                                        <span key={connector} className="rounded-2xl bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 ring-1 ring-violet-100">
                                            {connector}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm font-semibold text-slate-500">No external app connection listed.</p>
                            )}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Info needed
                            </div>
                            {inputs.length > 0 ? (
                                <div className="space-y-2">
                                    {inputs.slice(0, 4).map((input) => (
                                        <p key={getInputLabel(input)} className="text-sm font-semibold capitalize text-slate-600">
                                            {getInputLabel(input)}
                                        </p>
                                    ))}
                                    {inputs.length > 4 && <p className="text-xs font-black text-slate-400">+{inputs.length - 4} more</p>}
                                </div>
                            ) : (
                                <p className="text-sm font-semibold text-slate-500">No manual inputs listed yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <WalletCards className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Cost</p>
                                <p className="text-xl font-black text-slate-950">{tokenCost > 0 ? `${tokenCost} tokens/run` : 'Free'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-950">
                            <ShieldCheck className="h-4 w-4 text-teal-500" />
                            Safe setup
                        </div>
                        <p className="text-sm font-semibold leading-6 text-slate-600">
                            Connections happen through the automation engine only when you decide to start.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onStartSetup}
                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-slate-950 px-5 py-4 text-sm font-black text-white shadow-[0_18px_50px_rgba(126,58,242,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(126,58,242,0.44)]"
                    >
                        Start setup
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </button>
                </aside>
            </div>
        </section>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <HomeContent />
        </Suspense>
    );
}

function HomeContent() {
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
    const [previewAutomation, setPreviewAutomation] = useState(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const chatRef = useRef(null);
    const autoSetupRef = useRef(null);

    // Auto-start chat mode if URL has a chat ID
    useEffect(() => {
        if (chatId) {
            setHasStartedChat(true);
        } else if (!setupName) {
            setHasStartedChat(false);
        }
    }, [chatId, setupName]);

    useEffect(() => {
        let mounted = true;

        async function loadPreviewAutomation() {
            if (!previewAutomationId) {
                setPreviewAutomation(null);
                return;
            }

            setIsPreviewLoading(true);
            try {
                const response = await fetch(`/api/automations?id=${encodeURIComponent(previewAutomationId)}`);
                const data = await response.json().catch(() => null);
                if (mounted) {
                    setPreviewAutomation(response.ok ? data : null);
                    setHasStartedChat(false);
                }
            } catch (error) {
                if (mounted) setPreviewAutomation(null);
            } finally {
                if (mounted) setIsPreviewLoading(false);
            }
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

    const switchToSignUp = () => { setIsSignInOpen(false); setIsSignUpOpen(true); };
    const switchToSignIn = () => { setIsSignUpOpen(false); setIsSignInOpen(true); };
    const handleChatReady = useCallback(() => {
        setChatReadyTick((tick) => tick + 1);
    }, []);
    const handleConversationChange = useCallback((conversationId) => {
        if (!conversationId || typeof window === 'undefined') return;

        window.history.replaceState({}, '', `/main?chat=${conversationId}`);
    }, []);
    const closePreview = useCallback(() => {
        setPreviewAutomation(null);
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/main');
        }
    }, []);
    const startPreviewSetup = useCallback(() => {
        if (!previewAutomation) return;

        const automation = previewAutomation;
        setPreviewAutomation(null);
        setHasStartedChat(true);
        setPendingSetupIntro(automation);

        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/main');
        }
    }, [previewAutomation]);

    const handleUploadStatusChange = (isActive) => {
        setIsUploadActive(isActive);
    };

    const handleFileUpload = (file) => {
        if (chatRef.current) {
            chatRef.current.handleFileUpload(file);
        }
    };
    const handleMessageSent = (message) => {
        if (previewAutomation) {
            closePreview();
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

    return (
        <AdaptiveBackground variant="content" className="" showFloatingElements={false}>
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

            <div className={`flex flex-col items-center px-6 ${!hasStartedChat ? 'min-h-[calc(100vh-4rem)] justify-center' : ''}`}>
                {!hasStartedChat && (previewAutomation || isPreviewLoading) ? (
                    <div
                        className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center py-12 transition-all duration-300"
                        style={{ paddingLeft: sidebarOffset }}
                    >
                        <AutomationPreviewCard
                            automation={previewAutomation}
                            isLoading={isPreviewLoading}
                            onStartSetup={startPreviewSetup}
                            onClose={closePreview}
                        />
                    </div>
                ) : !hasStartedChat ? null : (
                    <div 
                        className="w-full h-full flex flex-col items-center pt-[15vh] transition-all duration-300"
                        style={{ paddingLeft: sidebarOffset }}
                    >
                        <div className="w-full max-w-4xl flex-1 flex flex-col">
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
            {!previewAutomation && !isPreviewLoading && (
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
            )}
            <AutomationsList
                isVisible={!hasStartedChat && !previewAutomation && !isPreviewLoading}
                onSelect={(automation) => {
                    setPreviewAutomation(automation);
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
