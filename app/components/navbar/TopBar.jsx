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
import AutomationMonitorDropdown from './AutomationMonitorDropdown';
import { FaBars } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { Coins, MessageCircle, Bell } from 'lucide-react';
import { safeApiFetch } from '@/lib/http/safe-api-fetch';

export default function TopBar({ tone = 'workspace' }) {
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
      const res = await safeApiFetch('/api/user');
      if (!res.ok) return 0;
      const data = await res.json();
      return data?.token_balance || 0;
    },
    enabled: !!user?.email && isAuthenticated,
    retry: false,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Fetch unread message count
  const { data: unread } = useQuery({
    queryKey: ['messageUnread'],
    queryFn: async () => {
      const res = await safeApiFetch('/api/messages/unread-count');
      if (!res.ok) return { count: 0, incoming_requests: 0, unread_messages: 0 };
      return res.json();
    },
    enabled: !!user && isAuthenticated,
    retry: false,
    refetchInterval: 30000,
  });

  // Fetch notification count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await safeApiFetch('/api/notifications');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user && isAuthenticated,
    retry: false,
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
    <div className={`app-topbar app-shell-${tone} fixed top-0 right-0 h-14 z-50 flex items-center justify-between px-5 transition-all duration-300 ${isMobile ? 'left-0' : isExpanded ? 'left-64' : 'left-13'}`}>
      {/* Left: ModelGrow (only when sidebar collapsed) or hamburger on mobile */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          <button
            onClick={() => setIsMobileOpen(true)}
            className="workspace-icon-button p-2 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <FaBars className="w-5 h-5" />
          </button>
        ) : !isExpanded ? (
          <div className="flex items-center gap-2 px-2">
            <span className="workspace-brand-name text-base font-black tracking-tight">
              ModelGrow
            </span>
            <span className="workspace-beta-badge text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-[0.08em]">beta</span>
          </div>
        ) : null}
      </div>

      {/* Right: Auth buttons or Profile + Icons */}
      {authLoading ? null : isAuthenticated ? (
        <div className="flex items-center gap-2">
          {/* Token Balance Display */}
          <div className="workspace-token-pill flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-black">
              {tokenBalance.toLocaleString()}
            </span>
          </div>

          {/* Automation Monitor */}
          <AutomationMonitorDropdown />

          {/* Chat / Messages Icon */}
          <div className="relative" ref={chatRef}>
            <button
              onClick={handleChatToggle}
              className={`workspace-icon-button relative p-2 rounded-lg transition-all ${isChatOpen ? 'workspace-icon-button-active' : ''}`}
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
            className="workspace-icon-button relative p-2 rounded-lg transition-all"
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
            className="auth-link-button rounded-lg px-4 py-2 text-sm font-black transition-all"
          >
            Log in
          </button>
          <button
            onClick={() => setIsSignUpOpen(true)}
            className="auth-primary-button rounded-lg px-5 py-2 text-sm font-black transition-all"
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
