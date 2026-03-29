"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/supabase-auth-context";
import RequestBox from "@/app/components/requests/requestBox";
import Request from "@/app/components/requests/request";
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import { FaPlus } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function RequestsClient() {
    const [isClicked, setIsClicked] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();
    const { isMobile, isExpanded } = useSidebar();
    const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;

    const handleNewRequestClick = () => {
        if (!user) {
            router.push('/auth/login');
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
                {/* Compact Header */}
                <div className="max-w-5xl lg:max-w-6xl mx-auto px-5 sm:px-6 pt-10 sm:pt-14 pb-8 sm:pb-10">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1.5">
                                Community
                            </h1>
                            <p className="text-sm sm:text-base text-slate-400">
                                Suggest automations and share ideas with the community.
                            </p>
                        </div>
                        <button
                            onClick={handleNewRequestClick}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-fit"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <FaPlus className="text-xs" />
                                    New Suggestion
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="max-w-5xl lg:max-w-6xl mx-auto px-5 sm:px-6">
                    <div className="border-t border-slate-700/30" />
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
        </AdaptiveBackground>
    );
}