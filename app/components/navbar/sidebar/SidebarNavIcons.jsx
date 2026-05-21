'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, LayoutDashboard, Coins, User } from 'lucide-react';
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
    { icon: Users, path: '/community', label: 'Community', protected: false },
    { icon: LayoutDashboard, path: '/dashboard', label: 'Dashboard', protected: true },
    { icon: Coins, path: '/pricing', label: 'Buy Credits', protected: false },
    { icon: User, path: '/profile', label: 'Profile', protected: true },
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
      <div className={`flex flex-col ${isExpanded ? 'gap-0.5 px-3 py-4' : 'gap-1 py-4 items-center'}`}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleClick(item)}
            className={`flex items-center rounded-lg transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-white/8'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } ${isExpanded
              ? 'w-full gap-3 px-3 py-2'
              : 'w-10 h-10 justify-center'
            }`}
            title={item.label}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.75} />
            {isExpanded && (
              <span className="text-sm whitespace-nowrap">{item.label}</span>
            )}
          </button>
        ))}
      </div>

      <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={() => { setIsSignInOpen(false); setIsSignUpOpen(true); }} />
      <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={() => { setIsSignUpOpen(false); setIsSignInOpen(true); }} />
    </>
  );
}
