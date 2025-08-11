"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase-auth-context";
import RequestBox from "@/app/components/requests/requestBox";
import Request from "@/app/components/requests/request";
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';

export default function RequestsClient() {
    const [isClicked, setIsClicked] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleNewRequestClick = () => {
        if (!user) {
            // Redirect to login if user is not authenticated
            router.push('/auth/login');
            return;
        }
        // If user is authenticated, show the request box
        setIsClicked(true);
    };

    return (
        <UnifiedBackground variant="content" className="pt-16">
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${isClicked ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsClicked(false)}
                style={{ transitionProperty: 'opacity' }}>
            </div>
            
            <div className="pt-20 pb-12 px-6">
                <div className="w-[92%] sm:w-[85%] mx-auto max-w-6xl">
                    <div className="flex flex-col items-center justify-center text-center mb-12">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                            Community Requests
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                            AI Model
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Requests</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto px-4">
                            Suggest and discuss AI models to be created by the community
                        </p>
                        <button
                            onClick={handleNewRequestClick}
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Loading...
                                </div>
                            ) : (
                                'New Request'
                            )}
                        </button>
                        {isClicked && user && <RequestBox/>}
                    </div>
                    <div className="flex flex-col items-center justify-center mt-12 sm:mt-20 gap-3 sm:gap-5 mb-15">
                        <Request />
                    </div>
                </div>
            </div>
        </UnifiedBackground>
    );
}