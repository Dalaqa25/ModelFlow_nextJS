'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useMessagesDock } from '@/lib/contexts/messages-dock-context';
import ProfileDropdown from './sidebar/actions/ProfileDropdown';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';
import MessagesInbox from '@/app/components/messages/MessagesInbox';
import MessageThreadPanel from '@/app/components/messages/MessageThreadPanel';
import Notifications from '@/app/components/notifications';
import { FaBars } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { Coins, MessageCircle, Bell } from 'lucide-react';

export default function TopBar() {
  const { isExpanded, isMobile, setIsMobileOpen } = useSidebar();
  const { isDarkMode, textColors } = useThemeAdaptive();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const {
    isOpen: isChatOpen,
    setIsOpen: setIsChatOpen,
    tab,
    setTab,
    activeThreadId,
    setActiveThreadId,
    clearThread,
  } = useMessagesDock();

  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const chatRef = useRef(null);

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

  // Fetch unread message count
  const { data: unread } = useQuery({
    queryKey: ['messageUnread'],
    queryFn: async () => {
      const res = await fetch('/api/messages/unread-count', { credentials: 'include' });
      if (!res.ok) return { count: 0, incoming_requests: 0, unread_messages: 0 };
      return res.json();
    },
    enabled: !!user && isAuthenticated,
    refetchInterval: 30000,
  });

  // Fetch notification count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!user && isAuthenticated,
    staleTime: 60 * 1000,
    refetchInterval: 60000,
  });

  const messageBadge = unread?.count ?? 0;
  const notificationBadge = notifications.filter((n) => !n.read).length;

  // Close chat dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setIsChatOpen(false);
      }
    };
    if (isChatOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isChatOpen, setIsChatOpen]);

  const handleChatToggle = () => {
    if (!isChatOpen) {
      const hasRequests = (unread?.incoming_requests ?? 0) > 0;
      setTab(hasRequests ? 'requests' : 'chats');
      clearThread();
    }
    setIsChatOpen(!isChatOpen);
  };

  const handleSelectThread = (threadId, threadStatus) => {
    setActiveThreadId(threadId);
    if (threadStatus === 'active' && tab === 'requests') {
      setTab('chats');
    }
  };

  const handleAccepted = () => {
    setTab('chats');
  };

  const handleClosePanel = () => {
    if (activeThreadId) {
      clearThread();
    } else {
      setIsChatOpen(false);
    }
  };

  return (
    <>
    <div className={`fixed top-0 right-0 h-14 bg-transparent z-50 flex items-center justify-between px-5 transition-all duration-300 ${isMobile ? 'left-0' : isExpanded ? 'left-64' : 'left-13'}`}>
      {/* Left: ModelGrow (only when sidebar collapsed) or hamburger on mobile */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          <button
            onClick={() => setIsMobileOpen(true)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
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

      {/* Right: Auth buttons or Profile + Icons */}
      {authLoading ? null : isAuthenticated ? (
        <div className="flex items-center gap-2">
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

          {/* Chat / Messages Icon */}
          <div className="relative" ref={chatRef}>
            <button
              onClick={handleChatToggle}
              className={`relative p-2 rounded-lg transition-all ${
                isChatOpen
                  ? isDarkMode
                    ? 'bg-slate-700/80 text-white'
                    : 'bg-gray-200 text-gray-900'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-slate-800/60'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Open chat"
              title="Open chat"
            >
              <MessageCircle className="w-5 h-5" />
              {messageBadge > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 ${isDarkMode ? 'border-slate-900' : 'border-white'}`}>
                  {messageBadge > 9 ? '9+' : messageBadge}
                </span>
              )}
            </button>

            {/* Messages Dropdown Panel */}
            {isChatOpen && (
              <div
                className={`absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[70vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
                  isDarkMode
                    ? 'bg-slate-900/98 backdrop-blur-xl border-slate-700/60 shadow-black/50'
                    : 'bg-white border-gray-200 shadow-lg shadow-gray-200/60'
                }`}
                role="dialog"
                aria-label="Messages"
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                  isDarkMode ? 'border-slate-700/50 bg-slate-900' : 'border-gray-100 bg-gray-50'
                }`}>
                  <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
                </div>

                {/* Content */}
                <div className="flex-1 flex min-h-0">
                  {activeThreadId ? (
                    <MessageThreadPanel
                      threadId={activeThreadId}
                      compact
                      onBack={clearThread}
                      onClose={handleClosePanel}
                      onAccepted={handleAccepted}
                    />
                  ) : (
                    <MessagesInbox
                      tab={tab}
                      setTab={setTab}
                      activeThreadId={activeThreadId}
                      onSelectThread={handleSelectThread}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications(true)}
            className={`relative p-2 rounded-lg transition-all ${
              isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-slate-800/60'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationBadge > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 ${isDarkMode ? 'border-slate-900' : 'border-white'}`}>
                {notificationBadge > 9 ? '9+' : notificationBadge}
              </span>
            )}
          </button>
          
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
      <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}
