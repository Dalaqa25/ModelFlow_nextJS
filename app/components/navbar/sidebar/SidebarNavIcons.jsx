'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaThLarge, FaUser, FaCoins } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';

export default function SidebarNavIcons() {
  const router = useRouter();
  const { isExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();
  const { isAuthenticated } = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const navItems = [
    { icon: FaUsers, path: '/community', label: 'Community', protected: false },
    { icon: FaThLarge, path: '/dashboard', label: 'Dashboard', protected: true },
    { icon: FaCoins, path: '/pricing', label: 'Buy Credits', protected: false },
    { icon: FaUser, path: '/profile', label: 'Profile', protected: true },
  ];

  const handleClick = (item) => {
    if (item.protected && !isAuthenticated) {
      setIsSignInOpen(true);
    } else {
      router.push(item.path);
    }
  };

  return (
    <>
      <div className={`flex flex-col gap-1 ${isExpanded ? 'px-3 py-4' : 'py-4'}`}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleClick(item)}
            className={`flex items-center gap-3 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-white/8'
                : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
            } ${isExpanded ? 'w-full px-3 py-2' : 'w-full h-8 justify-center'}`}
            title={item.label}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${
              isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'
            }`}>{item.label}</span>
          </button>
        ))}
      </div>

      <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={() => { setIsSignInOpen(false); setIsSignUpOpen(true); }} />
      <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={() => { setIsSignUpOpen(false); setIsSignInOpen(true); }} />
    </>
  );
}
