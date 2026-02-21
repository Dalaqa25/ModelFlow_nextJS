'use client';

import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useState, useEffect } from 'react';

export default function Greetings() {
    const { user } = useAuth();
    const { textColors } = useThemeAdaptive();

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
            const response = await fetch('/api/user', { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const data = await response.json();
            return data;
        },
        enabled: !!user,
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
            {/* Greeting Section */}
            {/* Mobile: stacked vertically, Desktop: horizontal */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-3 mb-3">
                <Image src="/logo.png" alt="Cube" width={60} height={60} className="w-12 h-12 sm:w-[60px] sm:h-[60px] object-contain flex-shrink-0" />
                <h1 className={`text-3xl sm:text-4xl lg:text-5xl ${textColors.primary} font-medium tracking-tight text-center`}>
                    Hey there, <span className="font-semibold text-purple-400">{displayName}</span>.
                </h1>
            </div>
        </div>
    );
}

