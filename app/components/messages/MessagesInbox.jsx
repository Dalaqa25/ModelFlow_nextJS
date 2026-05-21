'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
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
  const { isDarkMode } = useThemeAdaptive();
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
    <div className="flex flex-col h-full w-full">
      {/* Tabs */}
      <div className={`flex gap-1.5 p-2 border-b shrink-0 ${
        isDarkMode ? 'border-slate-700/40' : 'border-gray-200'
      }`}>
        <button
          type="button"
          onClick={() => setTab('chats')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center justify-center ${
            tab === 'chats'
              ? 'bg-purple-600 text-white'
              : isDarkMode
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          Chats
          <MessagesTabBadge count={unreadChatCount} />
        </button>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center justify-center ${
            tab === 'requests'
              ? 'bg-purple-600 text-white'
              : requestsTabAttention
                ? isDarkMode
                  ? 'text-slate-200 ring-1 ring-purple-500/50'
                  : 'text-purple-700 ring-1 ring-purple-400/50 bg-purple-50'
                : isDarkMode
                  ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          Requests
          <MessagesTabBadge count={incomingCount} />
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <p className={`p-4 text-xs text-center ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Loading...</p>
        ) : threads.length === 0 ? (
          <div className="p-6 text-center">
            <FaEnvelope className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              {tab === 'requests'
                ? 'No pending requests'
                : 'No active chats yet'}
            </p>
            <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
              Message from Community requests
            </p>
          </div>
        ) : (
          <ul>
            {threads.map((t) => {
              const name = t.other_user?.display_name || 'User';
              const seed = t.other_user?.id || name;
              const showUnread = t.unread_count > 0 || t.is_incoming_request;

              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onSelectThread(t.id, t.status)}
                    className={`w-full flex items-start gap-2.5 p-3 text-left transition-colors ${
                      isDarkMode
                        ? `hover:bg-slate-800/50 border-b border-slate-800/30 ${
                            activeThreadId === t.id ? 'bg-slate-800/70' : ''
                          } ${t.is_incoming_request ? 'bg-purple-500/5' : ''}`
                        : `hover:bg-gray-50 border-b border-gray-100 ${
                            activeThreadId === t.id ? 'bg-gray-100' : ''
                          } ${t.is_incoming_request ? 'bg-purple-50/50' : ''}`
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(seed)} flex items-center justify-center flex-shrink-0 ${
                        t.is_incoming_request ? 'ring-2 ring-purple-500/50' : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {getInitial(name)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-1 items-start">
                        <span className={`text-xs font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {name}
                        </span>
                        {t.is_incoming_request && (
                          <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${
                            isDarkMode ? 'bg-amber-500/25 text-amber-300' : 'bg-amber-100 text-amber-700'
                          }`}>
                            New
                          </span>
                        )}
                        {!t.is_incoming_request && showUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1" />
                        )}
                      </div>
                      {t.request_title && (
                        <p className={`text-[10px] truncate ${isDarkMode ? 'text-purple-400/90' : 'text-purple-600/80'}`}>
                          {t.request_title}
                        </p>
                      )}
                      {t.last_message && (
                        <p className={`text-[10px] truncate ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
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
