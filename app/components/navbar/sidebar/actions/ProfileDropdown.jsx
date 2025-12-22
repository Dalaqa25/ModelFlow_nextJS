'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useTheme } from '@/lib/theme-context';
import { FaUser, FaSignOutAlt, FaMoon, FaSun, FaDesktop, FaCheck } from 'react-icons/fa';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();
  const { isDarkMode, themeMode, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleSetTheme = (mode) => {
    setTheme(mode);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center border border-purple-500/30 focus:outline-none ${
          isDarkMode 
            ? 'bg-slate-700/60 hover:bg-slate-600/60 text-white' 
            : 'bg-white/60 hover:bg-white/80 text-gray-900'
        }`}
      >
        <FaUser className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className={`absolute right-0 mt-2 w-56 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-lg z-50 py-2 ${
            isDarkMode 
              ? 'bg-slate-800/95 shadow-purple-900/20' 
              : 'bg-white/95 shadow-purple-200/30'
          }`}>
            {/* Theme Section */}
            <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Theme
            </div>
            
            <button
              onClick={() => handleSetTheme('system')}
              className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-slate-700/60' 
                  : 'text-gray-700 hover:bg-gray-100/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <FaDesktop className="w-4 h-4" />
                <span>System</span>
              </div>
              {themeMode === 'system' && <FaCheck className="w-3 h-3 text-purple-500" />}
            </button>
            
            <button
              onClick={() => handleSetTheme('light')}
              className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-slate-700/60' 
                  : 'text-gray-700 hover:bg-gray-100/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <FaSun className="w-4 h-4" />
                <span>Light</span>
              </div>
              {themeMode === 'light' && <FaCheck className="w-3 h-3 text-purple-500" />}
            </button>
            
            <button
              onClick={() => handleSetTheme('dark')}
              className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-slate-700/60' 
                  : 'text-gray-700 hover:bg-gray-100/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <FaMoon className="w-4 h-4" />
                <span>Dark</span>
              </div>
              {themeMode === 'dark' && <FaCheck className="w-3 h-3 text-purple-500" />}
            </button>

            {/* Divider */}
            <div className={`my-2 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'}`} />

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-slate-700/60' 
                  : 'text-gray-700 hover:bg-gray-100/60'
              }`}
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
