'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import ProfileDropdown from './sidebar/actions/ProfileDropdown';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';
import { FaBars } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import { Coins } from 'lucide-react';

const UPLOAD_SEEN_KEY = 'upload_button_seen';

export default function TopBar() {
  const { isExpanded, isMobile, setIsMobileOpen } = useSidebar();
  const { isDarkMode, textColors } = useThemeAdaptive();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [showAttention, setShowAttention] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const switchToSignUp = () => { setIsSignInOpen(false); setIsSignUpOpen(true); };
  const switchToSignIn = () => { setIsSignUpOpen(false); setIsSignInOpen(true); };

  // Fetch token balance
  const { data: tokenBalance = 0 } = useQuery({
    queryKey: ['tokenBalance', user?.id],
    queryFn: async () => {
      if (!user?.email) return 0;
      const res = await fetch('/api/user');
      if (!res.ok) return 0;
      const data = await res.json();
      return data?.token_balance || 0;
    },
    enabled: !!user?.email && isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    const hasSeen = localStorage.getItem(UPLOAD_SEEN_KEY);
    if (!hasSeen) {
      setShowAttention(true);
    }

    const handleStorage = () => {
      const hasSeen = localStorage.getItem(UPLOAD_SEEN_KEY);
      if (hasSeen) {
        setShowAttention(false);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <>
    <div className={`fixed top-0 right-0 h-14 bg-transparent z-50 flex items-center justify-between px-5 transition-all duration-300 ${isMobile ? 'left-0' : isExpanded ? 'left-64' : 'left-13'}`}>
      {/* Left: ModelGrow (only when sidebar collapsed) or hamburger on mobile */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          <button
            onClick={() => setIsMobileOpen(true)}
            className={`p-2 rounded-lg transition-colors ${showAttention
                ? 'upload-attention text-purple-400'
                : isDarkMode
                  ? 'hover:bg-slate-800/60 text-white'
                  : 'hover:bg-black/5 text-gray-700'
              }`}
            aria-label="Open menu"
          >
            <FaBars className="w-5 h-5" />
          </button>
        ) : !isExpanded ? (
          <div className="flex items-center gap-2 px-2">
            <span className={`text-base font-semibold tracking-tight ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              ModelGrow
            </span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400">beta</span>
          </div>
        ) : null}
      </div>

      {/* Right: Auth buttons or Profile */}
      {authLoading ? null : isAuthenticated ? (
        <div className="flex items-center gap-3">
          {/* Token Balance Display */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            isDarkMode 
              ? 'bg-slate-800/60 border-purple-500/30 hover:bg-slate-700/60' 
              : 'bg-white/60 border-purple-200/50 hover:bg-white/80'
          }`}>
            <Coins className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {tokenBalance.toLocaleString()}
            </span>
          </div>
          
          <ProfileDropdown tokenBalance={tokenBalance} />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSignInOpen(true)}
            className={`px-5 py-2 text-base font-medium rounded-[2rem] transition-all ${
              isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-white/8'
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setIsSignUpOpen(true)}
            className="px-5 py-2 text-base font-normal !text-white bg-gradient-to-br from-violet-400 to-indigo-500 hover:from-violet-300 hover:to-indigo-400 rounded-[2rem] transition-all"
          >
            Sign up
          </button>
        </div>
      )}
    </div>

      <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
      <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
    </>
  );
}
