'use client';

import { useAuth } from '@/lib/auth/supabase-auth-context';
import { safeApiFetch } from '@/lib/http/safe-api-fetch';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Greetings() {
    const { user } = useAuth();

    // Get cached username from localStorage immediately
    const [cachedUserName, setCachedUserName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('userName') || null;
        }
        return null;
    });

    const { data: userData, isLoading } = useQuery({
        queryKey: ['userData', user?.email],
        queryFn: async () => {
            const response = await safeApiFetch('/api/user');
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return data;
        },
        enabled: !!user,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    const fullName = userData?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
    const userName = fullName.split(' ')[0]; // Get only first name

    // Update localStorage when userData is fetched
    useEffect(() => {
        if (userName && userName !== 'there') {
            localStorage.setItem('userName', userName);
            setCachedUserName(userName);
        }
    }, [userName]);

    // Use cached name if available, otherwise show loading or fetched name
    const displayName = cachedUserName || (isLoading ? '...' : userName);

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
            {user ? (
                /* Authenticated: logo + "Hey there, Name." */
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-3 mb-3">
                    <Image src="/logo.png" alt="Cube" width={60} height={60} className="w-12 h-12 sm:w-[60px] sm:h-[60px] object-contain flex-shrink-0" />
                    <h1 className="landing-title text-3xl sm:text-4xl lg:text-5xl font-black text-center">
                        Hey there, <span className="landing-gradient-text">{displayName}</span>.
                    </h1>
                </div>
            ) : (
                /* Unauthenticated: value prop */
                <div className="flex flex-col items-center gap-4 text-center mt-6">
                    <h1 className="landing-title text-4xl sm:text-5xl md:text-7xl font-black leading-[0.98] max-w-4xl">
                        Run powerful <span className="landing-gradient-text">delightful</span> automations <br className="hidden sm:block"/> with AI
                    </h1>
                    <p className="landing-copy text-base sm:text-lg font-semibold max-w-xl mt-1">
                        Discover community-built workflows, launch them through chat, and publish your own to earn.
                    </p>
                </div>
            )}
        </div>
    );
}
