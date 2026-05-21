'use client';

import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useMessagesDock } from '@/lib/contexts/messages-dock-context';
import { useQuery } from '@tanstack/react-query';
import { FaComments, FaMinus } from 'react-icons/fa';
import MessagesInbox from './MessagesInbox';
import MessageThreadPanel from './MessageThreadPanel';

export default function MessagesDock() {
  const { isAuthenticated, user } = useAuth();
  const {
    isOpen,
    setIsOpen,
    tab,
    setTab,
    activeThreadId,
    setActiveThreadId,
    closeDock,
    clearThread,
  } = useMessagesDock();

  const { data: unread } = useQuery({
    queryKey: ['messageUnread'],
    queryFn: async () => {
      const res = await fetch('/api/messages/unread-count', { credentials: 'include' });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user && isAuthenticated,
    refetchInterval: 30000,
  });

  if (!isAuthenticated) return null;

  const badgeCount = unread?.count ?? 0;

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
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[45] flex flex-col items-end gap-3 pointer-events-none">
      {isOpen && (
        <div
          className="pointer-events-auto w-[min(100vw-2rem,380px)] h-[min(70vh,520px)] flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900/98 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
          role="dialog"
          aria-label="Messages"
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/50 bg-slate-900 shrink-0">
            <h2 className="text-sm font-semibold text-white">Messages</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Minimize messages"
            >
              <FaMinus className="text-xs" />
            </button>
          </div>

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

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isOpen
            ? 'bg-slate-700 text-white'
            : badgeCount > 0
              ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white ring-2 ring-purple-400 shadow-purple-500/40'
              : 'bg-gradient-to-br from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400'
        }`}
        aria-label={isOpen ? 'Close messages' : 'Open messages'}
      >
        <FaComments className="w-6 h-6" />
        {!isOpen && badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>
    </div>
  );
}
