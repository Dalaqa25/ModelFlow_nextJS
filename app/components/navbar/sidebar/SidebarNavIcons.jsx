'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Home, Users, LayoutDashboard, Coins, User, Workflow, Compass, Trophy } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';

export default function SidebarNavIcons() {
  const router = useRouter();
  const pathname = usePathname();
  const { isExpanded } = useSidebar();
  const { isAuthenticated } = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const homePath = isAuthenticated ? '/main' : '/';
  const navItems = [
    { icon: Home, path: homePath, label: 'Home', protected: false },
    { icon: Users, path: '/community', label: 'Community', protected: false },
    { icon: Compass, path: '/explore', label: 'Explore', protected: false },
    { icon: Trophy, path: '/leaderboard', label: 'Leaderboard', protected: false },
    { icon: LayoutDashboard, path: '/dashboard', label: 'Dashboard', protected: true },
    { icon: Workflow, path: '/api/activepieces/launch', label: 'ModelGrow Builder', protected: true, external: true },
    { icon: Coins, path: '/pricing', label: 'Buy Credits', protected: false },
    { icon: User, path: '/profile', label: 'Profile', protected: true },
  ];

  const handleClick = (item) => {
    if (item.protected && !isAuthenticated) {
      setIsSignInOpen(true);
    } else if (item.external) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
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
            className={`sidebar-nav-button flex items-center rounded-lg transition-colors ${pathname === item.path
              ? 'sidebar-nav-button-active'
              : ''
            } ${isExpanded
              ? 'w-full gap-3 px-3 py-2'
              : 'w-10 h-10 justify-center'
            }`}
            title={item.label}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.75} />
            {isExpanded && (
              <span className={`text-sm whitespace-nowrap ${pathname === item.path ? 'font-bold' : ''}`}>{item.label}</span>
            )}
          </button>
        ))}
      </div>

      <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={() => { setIsSignInOpen(false); setIsSignUpOpen(true); }} />
      <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={() => { setIsSignUpOpen(false); setIsSignInOpen(true); }} />
    </>
  );
}
