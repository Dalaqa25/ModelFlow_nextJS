'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import ProfileDropdown from './sidebar/actions/ProfileDropdown';
import { FaBars } from 'react-icons/fa';

const UPLOAD_SEEN_KEY = 'upload_button_seen';

export default function TopBar() {
  const { isAuthenticated } = useAuth();
  const { isExpanded, isMobile, setIsMobileOpen } = useSidebar();
  const { isDarkMode, textColors } = useThemeAdaptive();
  const [showAttention, setShowAttention] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(UPLOAD_SEEN_KEY);
    if (!hasSeen) {
      setShowAttention(true);
    }
    
    // Listen for storage changes to sync with SidebarUploadIcon
    const handleStorage = () => {
      const hasSeen = localStorage.getItem(UPLOAD_SEEN_KEY);
      if (hasSeen) {
        setShowAttention(false);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`fixed top-0 right-0 h-14 bg-transparent z-30 flex items-center justify-between px-4 transition-all duration-300 ${
      isMobile ? 'left-0' : isExpanded ? 'left-48' : 'left-16'
    }`}>
      {/* Left: Hamburger (mobile) or Model Selector (desktop) */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          <button
            onClick={() => setIsMobileOpen(true)}
            className={`p-2 rounded-lg transition-colors ${
              showAttention 
                ? 'upload-attention text-purple-400' 
                : isDarkMode 
                  ? 'hover:bg-slate-800/60 text-white' 
                  : 'hover:bg-white/60 text-gray-900'
            }`}
            aria-label="Open menu"
          >
            <FaBars className="w-5 h-5" />
          </button>
        ) : null}
        <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isDarkMode 
            ? 'hover:bg-slate-800/60 text-white' 
            : 'hover:bg-white/60 text-gray-900'
        }`}>
          <span className="text-lg font-medium">ModelGrow</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Right: User Profile */}
      <ProfileDropdown />
    </div>
  );
}
