'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { getAvatarColor, getInitial } from '@/lib/messages/avatar-utils';
import MessagesTabBadge from './MessagesTabBadge';
import { FaEnvelope } from 'react-icons/fa';

export default function MessagesInbox({
  tab,
  setTab,
  activeThreadId,
  onSelectThread,
}) {
  const { user } = useAuth();
  const hasAutoTabbed = useRef(false);

  const { data: unread } = useQuery({
    queryKey: ['messageUnread'],
    queryFn: async () => {
      const res = await fetch('/api/messages/unread-count', { credentials: 'include' });
      if (!res.ok) return { incoming_requests: 0, unread_messages: 0 };
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (hasAutoTabbed.current || activeThreadId) return;
    if ((unread?.incoming_requests ?? 0) > 0) {
      setTab('requests');
      hasAutoTabbed.current = true;
    }
  }, [unread?.incoming_requests, activeThreadId, setTab]);

  const status = tab === 'requests' ? 'pending' : 'active';
  const incomingCount = unread?.incoming_requests ?? 0;
  const unreadChatCount = unread?.unread_messages ?? 0;
  const requestsTabAttention = tab !== 'requests' && incomingCount > 0;

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['messageThreads', status],
    queryFn: async () => {
      const res = await fetch(`/api/messages/threads?status=${status}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    },
    enabled: !!user,
  });

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* Tabs */}
      <div className="flex gap-2 p-3 border-b border-slate-200 dark:border-slate-700/50 shrink-0 bg-white dark:bg-slate-900/40">
        <button
          type="button"
          onClick={() => setTab('chats')}
          className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center ${
            tab === 'chats'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Chats
          <MessagesTabBadge count={unreadChatCount} />
        </button>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center ${
            tab === 'requests'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
              : requestsTabAttention
                ? 'text-purple-600 dark:text-purple-300 ring-1 ring-purple-400/60 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Requests
          <MessagesTabBadge count={incomingCount} />
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-3">
             <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
             <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Loading conversations...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700/50">
               <FaEnvelope className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {tab === 'requests'
                ? 'No pending requests'
                : 'No active chats yet'}
            </p>
            <p className="text-xs mt-2 text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">
              When you connect with others in the community, your messages will appear here.
            </p>
          </div>
        ) : (
          <ul className="py-2">
            {threads.map((t) => {
              const name = t.other_user?.display_name || 'User';
              const seed = t.other_user?.id || name;
              const showUnread = t.unread_count > 0 || t.is_incoming_request;

              return (
                <li key={t.id} className="px-2 mb-1">
                  <button
                    type="button"
                    onClick={() => onSelectThread(t.id, t.status)}
                    className={`w-full flex items-start gap-3 p-3 text-left transition-all duration-150 rounded-xl ${
                      activeThreadId === t.id
                        ? 'bg-purple-50 dark:bg-slate-800/80 shadow-sm ring-1 ring-purple-200 dark:ring-slate-700/80'
                        : t.is_incoming_request
                          ? 'bg-purple-50/60 dark:bg-purple-500/5 hover:bg-purple-100 dark:hover:bg-purple-500/10'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(seed)} flex items-center justify-center flex-shrink-0 shadow-inner ${
                        t.is_incoming_request ? 'ring-2 ring-purple-500/50 shadow-purple-500/20' : ''
                      }`}
                    >
                      <span className="text-[11px] font-bold text-white tracking-wide">
                        {getInitial(name)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex justify-between gap-2 items-start mb-0.5">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {name}
                        </span>
                        {t.is_incoming_request && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            New
                          </span>
                        )}
                        {!t.is_incoming_request && showUnread && (
                          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] mt-1.5 shrink-0" />
                        )}
                      </div>
                      {t.request_title && (
                        <p className="text-[11px] font-medium text-purple-500 dark:text-purple-400/90 truncate mb-0.5">
                          {t.request_title}
                        </p>
                      )}
                      {t.last_message && (
                        <p className={`text-xs truncate ${showUnread ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                          {t.last_message.body}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
