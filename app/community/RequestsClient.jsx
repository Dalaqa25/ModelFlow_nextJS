"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/supabase-auth-context";
import RequestBox from "@/app/components/requests/requestBox";
import Request from "@/app/components/requests/request";
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';
import { toast } from 'react-hot-toast';
import { Lightbulb, Plus, Search, Sparkles } from 'lucide-react';

export default function RequestsClient() {
    const [isClicked, setIsClicked] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    
    const { user, loading } = useAuth();
    const router = useRouter();
    const { isMobile, isExpanded } = useSidebar();
    const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;

    const switchToSignUp = () => { setIsSignInOpen(false); setIsSignUpOpen(true); };
    const switchToSignIn = () => { setIsSignUpOpen(false); setIsSignInOpen(true); };

    const handleNewRequestClick = () => {
        if (!user) {
            toast('To make an automation request you need to be signed in.', { icon: '👋' });
            setIsSignInOpen(true);
            return;
        }
        setIsClicked(true);
    };

    return (
        <AdaptiveBackground variant="content" className="pt-16">
            {/* Backdrop overlay for request box */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isClicked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsClicked(false)}
            />

            <div className="min-h-screen pb-20" style={{ paddingLeft: sidebarOffset, transition: 'padding-left 300ms' }}>
                <div className="max-w-5xl lg:max-w-6xl mx-auto px-5 sm:px-6 pt-10 sm:pt-14 pb-8 sm:pb-10">
                    <div className="community-surface rounded-lg p-5 sm:p-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-white/35 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--landing-muted)] dark:bg-white/[0.06]">
                                    <Sparkles className="h-3.5 w-3.5 text-[var(--landing-accent)]" />
                                    Community requests
                                </div>
                                <h1 className="text-3xl font-black leading-tight text-[var(--landing-ink)] sm:text-4xl">
                                    Ask builders for the automation you need.
                                </h1>
                                <p className="mt-3 text-sm font-semibold leading-6 text-[var(--landing-muted)] sm:text-base">
                                    Browse ideas, request missing workflows, and turn repeated manual work into reusable automations.
                                </p>
                            </div>
                            <button
                                onClick={handleNewRequestClick}
                                disabled={loading}
                                className="auth-primary-button inline-flex w-fit shrink-0 items-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                                        Loading
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        New Request
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="flex items-center gap-3 rounded-lg border border-[var(--landing-border)] bg-white/30 px-4 py-3 dark:bg-white/[0.05]">
                                <Search className="h-4 w-4 text-[var(--landing-accent-3)]" />
                                <span className="text-sm font-bold text-[var(--landing-ink)]">Discover ideas</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-[var(--landing-border)] bg-white/30 px-4 py-3 dark:bg-white/[0.05]">
                                <Lightbulb className="h-4 w-4 text-[var(--landing-accent)]" />
                                <span className="text-sm font-bold text-[var(--landing-ink)]">Request missing tools</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-[var(--landing-border)] bg-white/30 px-4 py-3 dark:bg-white/[0.05]">
                                <Plus className="h-4 w-4 text-[var(--landing-accent-2)]" />
                                <span className="text-sm font-bold text-[var(--landing-ink)]">Builders can respond</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed */}
                <div className="max-w-5xl lg:max-w-6xl mx-auto px-5 sm:px-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        <Request />
                    </div>
                </div>
            </div>

            {/* Request Box Modal */}
            {isClicked && user && (
                <RequestBox
                    onClose={() => setIsClicked(false)}
                    onRequestPublished={() => setIsClicked(false)}
                />
            )}

            <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
            <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
        </AdaptiveBackground>
    );
}
