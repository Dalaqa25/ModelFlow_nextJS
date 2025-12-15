'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import ProfileDropdown from './ProfileDropdown';

export default function TopBar() {
  const { isAuthenticated } = useAuth();
  const { isExpanded } = useSidebar();
  const { isDarkMode, textColors } = useThemeAdaptive();

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`fixed top-0 right-0 h-14 bg-transparent z-50 flex items-center justify-between px-4 transition-all duration-300 ${
      isExpanded ? 'left-48' : 'left-16'
    }`}>
      {/* Left: Model Selector */}
      <div className="flex items-center gap-2">
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
