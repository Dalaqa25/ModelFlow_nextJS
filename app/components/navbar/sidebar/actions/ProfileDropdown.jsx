'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useTheme } from '@/lib/contexts/theme-context';
import { useQuery } from '@tanstack/react-query';
import { FaSignOutAlt, FaMoon, FaSun, FaDesktop, FaCheck, FaBell } from 'react-icons/fa';
import { Coins, Plus, User, Settings } from 'lucide-react';
import Link from 'next/link';
import Notifications from '@/app/components/notifications';

export default function ProfileDropdown({ tokenBalance = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { signOut, user, isAuthenticated } = useAuth();
  const { isDarkMode, themeMode, setTheme } = useTheme();

  if (!isAuthenticated) return null;

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!user && isOpen,
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
          isOpen
            ? 'bg-purple-600 text-white ring-2 ring-purple-500/50'
            : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400'
        }`}
      >
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{avatarLetter}</span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 overflow-y-auto max-h-[calc(100vh-80px)] border ${
            isDarkMode
              ? 'bg-slate-900/95 backdrop-blur-xl border-slate-700/60 shadow-black/40'
              : 'bg-white border-gray-200 shadow-gray-300/50'
          }`}>

            {/* User Header */}
            <div className={`px-4 py-4 border-b ${isDarkMode ? 'border-slate-700/60' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {displayName}
                  </p>
                  <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {displayEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Token Balance */}
            <div className="px-3 pt-3 pb-2">
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Token Balance</span>
                  </div>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {tokenBalance.toLocaleString()}
                  </span>
                </div>
                <Link
                  href="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-md text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Buy Tokens
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className={`mx-3 border-t ${isDarkMode ? 'border-slate-700/60' : 'border-gray-100'}`} />

            {/* Navigation Links */}
            <div className="px-2 py-2">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isDarkMode ? 'text-gray-300 hover:bg-slate-700/60 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>

              <button
                onClick={() => { setShowNotifications(true); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isDarkMode ? 'text-gray-300 hover:bg-slate-700/60 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FaBell className="w-4 h-4" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className={`mx-3 border-t ${isDarkMode ? 'border-slate-700/60' : 'border-gray-100'}`} />

            {/* Theme */}
            <div className="px-2 py-2">
              <p className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Theme
              </p>
              {[
                { mode: 'system', icon: FaDesktop, label: 'System' },
                { mode: 'light', icon: FaSun, label: 'Light' },
                { mode: 'dark', icon: FaMoon, label: 'Dark' },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    isDarkMode ? 'text-gray-300 hover:bg-slate-700/60 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                  {themeMode === mode && <FaCheck className="w-3 h-3 text-purple-500" />}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className={`mx-3 border-t ${isDarkMode ? 'border-slate-700/60' : 'border-gray-100'}`} />

            {/* Sign Out */}
            <div className="px-2 py-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-red-500 hover:bg-red-600 text-white"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </>
      )}

      <Notifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
