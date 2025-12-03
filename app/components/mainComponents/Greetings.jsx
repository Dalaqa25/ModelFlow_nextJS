'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function Greetings() {
    const { user } = useAuth();
    const router = useRouter();
    const { textColors, isDarkMode } = useThemeAdaptive();

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

    const userName = userData?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';

    const handleUpgrade = () => {
        router.push('/plans');
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
            {/* Centered Free Plan Button */}
            <div className="mb-6">
                <button
                    onClick={handleUpgrade}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm ${
                        isDarkMode 
                            ? 'bg-slate-800/60 border border-slate-700/50 text-gray-300 hover:bg-slate-700/60' 
                            : 'bg-white/60 border border-gray-300 text-gray-700 hover:bg-white/80'
                    }`}
                >
                    <span>Free plan</span>
                    <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                    <span className="underline">Upgrade</span>
                </button>
            </div>

            {/* Greeting Section */}
            <div className="flex items-center justify-center gap-3 mb-6">
                <Image src="/logo.png" alt="Cube" width={60} height={60} />
                <h1 className={`text-4xl sm:text-5xl lg:text-6xl ${textColors.primary} font-light`} style={{ fontFamily: 'Georgia, serif' }}>
                    Hey there, <span className="font-normal">{isLoading ? '...' : userName}</span>.
                </h1>
            </div>
        </div>
    );
}

